import { buildOrgPulseEmail } from './_emails/org-pulse.js';
import { buildDqiEmail } from './_emails/dqi.js';
import { buildSupervisorBlindSpotEmail } from './_emails/supervisor-blind-spot.js';
import { buildWorkplaceReadEmail } from './_emails/workplace-read.js';
import { buildGovernanceEvalReadinessEmail } from './_emails/governance-eval-readiness.js';
import { buildNudgeEmail } from './_emails/nudge.js';
import { buildLeadNotificationEmail } from './_emails/lead-notification.js';

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

  const notionRowCreated = await writeNotionRow({
    name: name || '',
    email,
    diagnosticId,
    bandLabel,
    total,
    resultLabel: resultLabel || '',
    orgSize: orgSize || '',
    sector: sector || '',
    submittedAt: submittedAt || new Date().toISOString(),
    nudgeEmailId,
  });

  // The Notion row is where leads actually land, so it is the source of truth for
  // whether we captured this person. If it failed (e.g. missing/expired env vars),
  // the lead is lost: do NOT report success. Return a non-2xx so the client shows
  // the "email Thomas directly" fallback instead of a false "Got it." A failed
  // result email alone is degraded (lead is still captured), so it does not fail
  // the request; emailSent is reported so the client can soften its copy.
  const captured = notionRowCreated;

  // New-lead alert: ping the team the moment a lead is captured, so leads do not
  // sit unseen in the Notion DB. Best-effort and only on successful capture: the
  // lead is already saved, so a failed alert must NOT fail the request. Mirrors the
  // notification in api/contact.js (same BLUECHIP_NOTIFY_EMAIL recipient).
  let leadNotificationSent = false;
  if (captured) {
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
    });
    const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
    leadNotificationSent = await sendResendEmail({
      to: notifyTo,
      subject: notifSubject,
      html: notifHtml,
      replyTo: email,
    });
  }

  return res.status(captured ? 200 : 502).json({
    ok: captured,
    emailSent,
    nudgeScheduled: !!nudgeEmailId,
    notionRowCreated,
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

async function writeNotionRow({ name, email, diagnosticId, bandLabel, total, resultLabel, orgSize, sector, submittedAt, nudgeEmailId }) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('Notion not configured; skipping row write');
    return false;
  }

  // Always-present columns the DB is known to have.
  const baseProps = {
    Name: { title: [{ text: { content: name || email } }] },
    Email: { email },
    Diagnostic: { select: { name: diagnosticId } },
    'Band Label': bandLabel ? { select: { name: bandLabel } } : { select: null },
    'Total Score': total != null ? { number: total } : { number: null },
    'Result Label': { rich_text: [{ text: { content: resultLabel || '' } }] },
    'Submitted At': { date: { start: submittedAt } },
    'Lead Status': { select: { name: 'New' } },
    'Nudge Email ID': nudgeEmailId ? { rich_text: [{ text: { content: nudgeEmailId } }] } : { rich_text: [] },
  };

  // Optional org-context columns (QW1). If the DB doesn't have these select
  // properties yet, Notion rejects the whole write, which would lose the lead.
  // So we try with them, then retry without them on failure.
  const optionalProps = {};
  if (orgSize) optionalProps['Org Size'] = { select: { name: orgSize } };
  if (sector) optionalProps['Sector'] = { select: { name: sector } };

  const postRow = (properties) =>
    fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
    });

  try {
    let res = await postRow({ ...baseProps, ...optionalProps });
    if (!res.ok && Object.keys(optionalProps).length > 0) {
      const errText = await res.text();
      console.warn(
        'Notion write with org-context columns failed; retrying without Org Size/Sector. ' +
          'Add those select properties to the DB to capture them.',
        res.status,
        errText
      );
      res = await postRow(baseProps);
    }
    if (!res.ok) {
      console.error('Notion write failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Notion write error', err);
    return false;
  }
}
