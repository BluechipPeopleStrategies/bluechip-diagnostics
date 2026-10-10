/* global process */
import { buildOrgPulseEmail } from './_emails/org-pulse.js';
import { buildDqiEmail } from './_emails/dqi.js';
import { buildSupervisorBlindSpotEmail } from './_emails/supervisor-blind-spot.js';
import { buildWorkplaceReadEmail } from './_emails/workplace-read.js';
import { buildGovernanceEvalReadinessEmail } from './_emails/governance-eval-readiness.js';
import { buildLeadNotificationEmail } from './_emails/lead-notification.js';
import { AI_CHECK_ID, handleAiCheckResults } from './_lib/ai-check-results.js';
import { cleanRecipient } from './_lib/email-address.js';
import { isKnownDiagnostic, knownOrEmpty } from './_lib/diagnostic-allowlist.js';
import { isHoneypot } from './_lib/lead-helpers.js';
import { allowSubmit, clientIp } from './_lib/rate-limit.js';
import { sanitizeAttribution, sanitizeHeardAbout } from './_lib/attribution.js';
import { safeFirstName } from './_lib/first-name.js';

const TEMPLATE_BUILDERS = {
  'org-pulse': buildOrgPulseEmail,
  'dqi': buildDqiEmail,
  'supervisor-blind-spot': buildSupervisorBlindSpotEmail,
  'workplace-read': buildWorkplaceReadEmail,
  'governance-eval-readiness': buildGovernanceEvalReadinessEmail,
};

const cap = (value, max) => (typeof value === 'string' ? value : '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = req.body || {};
  const { diagnosticId, resultLabel, detail, name, orgSize, sector, submittedAt } = body;
  const email = cleanRecipient(body.email);

  if (diagnosticId !== AI_CHECK_ID && !isKnownDiagnostic(diagnosticId)) {
    return res.status(400).json({ error: 'unknown_diagnostic' });
  }
  if (!email) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  // Best effort (see api/_lib/rate-limit.js): stops a loop of requests from mailing one address,
  // or from one client, over and over.
  if (!allowSubmit({ ip: clientIp(req), email })) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  // The free AI Pulse "Email my results" has its own path (2026-09-25): no scoring template.
  if (diagnosticId === AI_CHECK_ID) return handleAiCheckResults({ ...body, email }, res, { sendEmail: sendResendEmail });

  const { bandLabel: rawBand, total: rawTotal } = parseResultLabel(resultLabel);
  const total = Number.isInteger(rawTotal) && rawTotal >= 0 && rawTotal <= 100 ? rawTotal : null;
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const leadFields = {
    name: cap(name, 120),
    email,
    diagnosticId,
    bandLabel: cap(rawBand, 80),
    total,
    resultLabel: cap(resultLabel, 120),
    orgSize: cap(orgSize, 60),
    sector: cap(sector, 60),
    submittedAt: cap(submittedAt, 40) || new Date().toISOString(),
    // Where they came from (2026-10-09): optional, narrowed to a known shape, shown to Thomas only.
    attribution: sanitizeAttribution(body.attribution) || undefined,
    heardAbout: sanitizeHeardAbout(body.heard_about) || undefined,
  };

  // A filled spam-trap field (same name as the chat widget's) means probably a bot: the visitor
  // gets no email, so the endpoint cannot be used to mail a third party, but Thomas still gets a
  // flagged copy in case a real person's browser filled it.
  if (isHoneypot(body)) {
    console.warn('submit: quiz honeypot triggered');
    const flagged = buildLeadNotificationEmail({ ...leadFields, emailSent: false, nudgeScheduled: false, spamTrap: true });
    await sendResendEmail({ to: notifyTo, subject: `[Check: spam trap] ${flagged.subject}`, html: flagged.html });
    return res.status(200).json({ ok: true, emailSent: true, nudgeScheduled: false, leadNotificationSent: true });
  }

  // The visitor email is built only from known labels and a letters-only first name (see
  // api/_lib/diagnostic-allowlist.js); the templates escape what they print as well.
  const buildTemplate = TEMPLATE_BUILDERS[diagnosticId];
  const { subject, html } = buildTemplate({
    firstName: safeFirstName(name),
    bandLabel: knownOrEmpty(diagnosticId, 'bands', rawBand),
    total,
    detail: knownOrEmpty(diagnosticId, 'details', cap(detail, 80)),
  });
  const emailSent = await sendResendEmail({ to: email, subject, html });

  // The lead notification to Thomas is the lead record (2026-09-26): Notion is legacy and
  // read-only, and a local job files these emails in the Obsidian vault (Website Leads note)
  // by parsing their Lead-Data block. If it did not send (e.g. missing/expired Resend env
  // vars), the lead is lost: do NOT report success. Return a non-2xx so the client shows the
  // "email Thomas directly" fallback instead of a false "Got it." A failed result email
  // alone is degraded (the lead is still recorded), so it does not fail the request;
  // emailSent is reported so the client can soften its copy. There is no 24-hour follow-up
  // email any more (retired 2026-10-09): the opt-in promises "No auto-sequence".
  const note = buildLeadNotificationEmail({ ...leadFields, emailSent, nudgeScheduled: false });
  const leadNotificationSent = await sendResendEmail({
    to: notifyTo,
    subject: note.subject,
    html: note.html,
    replyTo: email,
  });
  const captured = leadNotificationSent;

  return res.status(captured ? 200 : 502).json({
    ok: captured,
    emailSent,
    nudgeScheduled: false,
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
