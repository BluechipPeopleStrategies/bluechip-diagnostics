import { buildOrgPulseEmail } from './_emails/org-pulse.js';
import { buildDqiEmail } from './_emails/dqi.js';
import { buildSupervisorBlindSpotEmail } from './_emails/supervisor-blind-spot.js';
import { buildWorkplaceReadEmail } from './_emails/workplace-read.js';
import { buildGovernanceEvalReadinessEmail } from './_emails/governance-eval-readiness.js';
import { buildNudgeEmail } from './_emails/nudge.js';
import { buildLeadNotificationEmail } from './_emails/lead-notification.js';
import { AI_CHECK_ID, handleAiCheckResults } from './_lib/ai-check-results.js';

const NUDGE_DELAY_HOURS = 24;

const TEMPLATE_BUILDERS = {
  'org-pulse': buildOrgPulseEmail,
  'dqi': buildDqiEmail,
  'supervisor-blind-spot': buildSupervisorBlindSpotEmail,
  'workplace-read': buildWorkplaceReadEmail,
  'governance-eval-readiness': buildGovernanceEvalReadinessEmail,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { diagnosticId, resultLabel, detail, email, name, orgSize, sector, submittedAt } = req.body || {};

  // The free AI Opportunity Check's "Email my results" has its own path (2026-09-25): no
  // scoring template, no 24-hour nudge.
  if (diagnosticId === AI_CHECK_ID) return handleAiCheckResults(req.body || {}, res, { sendEmail: sendResendEmail });

  if (!diagnosticId || !email) {
    return res.status(400).json({ error: 'missing_required_fields' });
  }

  const { bandLabel, total } = parseResultLabel(resultLabel);
  const firstName = (name || '').trim().split(/\s+/)[0] || '';

  const buildTemplate = TEMPLATE_BUILDERS[diagnosticId];
  let emailSent = false;
  let nudgeEmailId = null;
  if (buildTemplate) {
    const { subject, html } = buildTemplate({ firstName, bandLabel, total, detail: detail || '', diagnosticId });
    emailSent = await sendResendEmail({ to: email, subject, html });

    const nudgeAt = new Date(Date.now() + NUDGE_DELAY_HOURS * 60 * 60 * 1000).toISOString();
    const { subject: nudgeSubject, html: nudgeHtml } = buildNudgeEmail({
      firstName,
      diagnosticId,
      bandLabel,
      total,
      detail: detail || '',
    });
    nudgeEmailId = await scheduleResendEmail({
      to: email,
      subject: nudgeSubject,
      html: nudgeHtml,
      scheduledAt: nudgeAt,
    });
  }

  // The lead notification to Thomas is the lead record (2026-09-26): Notion is legacy and
  // read-only, and a local job files these emails in the Obsidian vault (Website Leads note)
  // by parsing their Lead-Data block. If it did not send (e.g. missing/expired Resend env
  // vars), the lead is lost: do NOT report success. Return a non-2xx so the client shows the
  // "email Thomas directly" fallback instead of a false "Got it." A failed result email
  // alone is degraded (the lead is still recorded), so it does not fail the request;
  // emailSent is reported so the client can soften its copy.
  const { subject: notifSubject, html: notifHtml } = buildLeadNotificationEmail({
    name: name || '',
    email,
    diagnosticId,
    bandLabel,
    total,
    resultLabel: resultLabel || '',
    orgSize: orgSize || '',
    sector: sector || '',
    emailSent,
    nudgeScheduled: !!nudgeEmailId,
    submittedAt: (typeof submittedAt === 'string' && submittedAt.slice(0, 40)) || new Date().toISOString(),
  });
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const leadNotificationSent = await sendResendEmail({
    to: notifyTo,
    subject: notifSubject,
    html: notifHtml,
    replyTo: email,
  });
  const captured = leadNotificationSent;

  return res.status(captured ? 200 : 502).json({
    ok: captured,
    emailSent,
    nudgeScheduled: !!nudgeEmailId,
    leadNotificationSent,
  });
}

function parseResultLabel(resultLabel) {
  if (!resultLabel || typeof resultLabel !== 'string') {
    return { bandLabel: '', total: null };
  }
  const match = resultLabel.match(/^(.*?)\s*\((\d+)\/100\)\s*$/);
  if (!match) return { bandLabel: resultLabel, total: null };
  return { bandLabel: match[1].trim(), total: Number(match[2]) };
}

async function sendResendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLUECHIP_FROM_EMAIL;
  if (!apiKey || !from || !to) {
    console.warn('Resend not configured; skipping email send');
    return false;
  }
  const body = { from, to, subject, html };
  if (replyTo) body.reply_to = replyTo;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('Resend send failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend send error', err);
    return false;
  }
}

async function scheduleResendEmail({ to, subject, html, scheduledAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLUECHIP_FROM_EMAIL;
  if (!apiKey || !from) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, scheduled_at: scheduledAt }),
    });
    if (!res.ok) {
      console.error('Resend schedule failed', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error('Resend schedule error', err);
    return null;
  }
}
