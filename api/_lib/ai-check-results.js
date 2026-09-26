/* global process */
// Free AI Opportunity Check "Email my results" (item 61, 2026-09-25), called from api/submit.js.
// Lives in _lib (not a Vercel route) and takes the sender as a dependency so it reuses
// submit.js's Resend call rather than a second copy.
import { buildLeadNotificationEmail } from '../_emails/lead-notification.js';
import { buildAiCheckResultsEmail, cleanAiCheckInput } from '../_emails/ai-opportunity-check.js';
import { isHoneypot } from './lead-helpers.js';

export const AI_CHECK_ID = 'ai-opportunity-check';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Sends the visitor the results they asked for, rebuilt server-side from their raw answers (see
// api/_emails/ai-opportunity-check.js), and tells Thomas it happened. The honeypot (`bc_hp_trap`,
// same field as the chat widget) never drops a request silently: a tripped trap skips the
// visitor email, so the endpoint can't be used to mail third parties, but Thomas still gets a
// flagged copy in case a real person's browser filled it.
export async function handleAiCheckResults(body, res, { sendEmail }) {
  const email = String(body.email || '').trim().slice(0, 254);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid_email' });

  const input = cleanAiCheckInput(body);
  const { subject, html, resultLabel } = buildAiCheckResultsEmail(input);
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const label = `${resultLabel} (asked for ${input.include === 'answers' ? 'the estimate and their answers' : 'the estimate only'})`;

  if (isHoneypot(body)) {
    console.warn('submit: ai-check honeypot triggered');
    const flagged = buildLeadNotificationEmail({ name: '', email, diagnosticId: AI_CHECK_ID, bandLabel: '', total: null, resultLabel: label, emailSent: false, savedToNotion: false });
    await sendEmail({ to: notifyTo, subject: `[Check: spam trap] ${flagged.subject}`, html: flagged.html });
    return res.status(200).json({ ok: true, emailSent: true });
  }

  const emailSent = await sendEmail({ to: email, subject, html, replyTo: notifyTo });
  const note = buildLeadNotificationEmail({ name: '', email, diagnosticId: AI_CHECK_ID, bandLabel: '', total: null, resultLabel: label, emailSent, savedToNotion: false });
  const leadNotificationSent = await sendEmail({ to: notifyTo, subject: note.subject, html: note.html, replyTo: email });
  const ok = emailSent || leadNotificationSent;
  return res.status(ok ? 200 : 502).json({ ok, emailSent, leadNotificationSent, nudgeScheduled: false });
}
