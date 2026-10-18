/* global process */
// Free AI Pulse "Email my results" (item 61, 2026-09-25), called from api/submit.js.
// Lives in _lib (not a Vercel route) and takes the sender as a dependency so it reuses
// submit.js's Resend call rather than a second copy.
import { buildLeadNotificationEmail } from '../_emails/lead-notification.js';
import { buildAiCheckResultsEmail, cleanAiCheckInput } from '../_emails/ai-opportunity-check.js';
import { isHoneypot } from './lead-helpers.js';
import { sanitizeAttribution, sanitizeHeardAbout } from './attribution.js';
import { cleanRecipient } from './email-address.js';
import { answerSummary, computeRange, orgSizeMidpoint } from '../../src/lib/aiOpportunity.js';
import { handlePulseDiscovery } from '../_emails/ai-pulse-discovery.js';

export const AI_CHECK_ID = 'ai-opportunity-check';

// Sends the visitor the results they asked for, rebuilt server-side from their raw answers (see
// api/_emails/ai-opportunity-check.js), and tells Thomas it happened. The honeypot (`bc_hp_trap`,
// same field as the chat widget) never drops a request silently: a tripped trap skips the
// visitor email, so the endpoint can't be used to mail third parties, but Thomas still gets a
// flagged copy in case a real person's browser filled it.
export async function handleAiCheckResults(body, res, { sendEmail }) {
  if (body.pulseVersion !== undefined) return handlePulseDiscovery(body, res, { sendEmail });
  const email = cleanRecipient(body.email);
  if (!email) return res.status(400).json({ error: 'invalid_email' });

  const input = cleanAiCheckInput(body);
  const { subject, html, resultLabel } = buildAiCheckResultsEmail(input);
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const submittedAt = new Date().toISOString();
  // Where they came from: for Thomas's notification only, never the visitor's email.
  const where = { attribution: sanitizeAttribution(body.attribution) || undefined, heardAbout: sanitizeHeardAbout(body.heard_about) || undefined };
  const label = `${resultLabel} (asked for ${input.include === 'answers' ? 'the estimate and their answers' : 'the estimate only'})`;
  // Only the revised, disclosed email request shares a completed answer snapshot.
  // Older clients keep their existing sharing scope.
  let checkSnapshot;
  if (body.shareCompletedCheck === true && body.sharingNoticeVersion === 'ai-pulse-results-v2') {
    const result = computeRange((input.answers.areas || []).map(area => ({
      area, hours: input.areaInputs[area]?.hours ?? 5, people: input.areaInputs[area]?.people ?? 1,
    })));
    checkSnapshot = {
      notice: body.sharingNoticeVersion,
      answers: answerSummary(input.answers, input).map(row => `${row.label}: ${row.items.join('; ')}`).join('\n'),
      details: `${resultLabel}\nHourly staff cost: C$${input.rate}\nWorking weeks: ${input.weeks}\nTeam illustration headcount: ${input.headcount ?? orgSizeMidpoint(input.answers.orgSize)}`,
      json: JSON.stringify({ version: 1, ...input, computedResult: result }),
    };
  }

  if (isHoneypot(body)) {
    console.warn('submit: ai-check honeypot triggered');
    const flagged = buildLeadNotificationEmail({ name: '', email, diagnosticId: AI_CHECK_ID, bandLabel: '', total: null, resultLabel: label, emailSent: false, nudgeScheduled: false, spamTrap: true, submittedAt, checkSnapshot, ...where });
    const leadNotificationSent = await sendEmail({ to: notifyTo, subject: `[Check: spam trap] ${flagged.subject}`, html: flagged.html });
    return res.status(leadNotificationSent ? 200 : 502).json({ ok: leadNotificationSent, emailSent: false, leadNotificationSent, nudgeScheduled: false });
  }

  const emailSent = await sendEmail({ to: email, subject, html, replyTo: notifyTo });
  const note = buildLeadNotificationEmail({ name: '', email, diagnosticId: AI_CHECK_ID, bandLabel: '', total: null, resultLabel: label, emailSent, nudgeScheduled: false, submittedAt, checkSnapshot, ...where });
  const leadNotificationSent = await sendEmail({ to: notifyTo, subject: note.subject, html: note.html, replyTo: email });
  // A visitor copy alone must not silently masquerade as a captured owner record.
  const ok = leadNotificationSent;
  return res.status(ok ? 200 : 502).json({ ok, emailSent, leadNotificationSent, nudgeScheduled: false });
}
