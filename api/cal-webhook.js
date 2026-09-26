/* global process, Buffer */
import crypto from 'crypto';
import { buildCancellationFollowupEmail, CANCEL_FOLLOWUP_SUBJECT } from './_emails/cancellation-followup.js';
import { DIAGNOSTIC_TITLES } from './_emails/nudge.js';
import { cancelPendingFollowups, findPendingFollowups } from './_lib/followups.js';

const CANCEL_FOLLOWUP_DELAY_HOURS = 48;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('cal-webhook: failed to read body', err);
    return res.status(400).json({ error: 'body_read_failed' });
  }

  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-cal-signature-256'] || req.headers['X-Cal-Signature-256'];
    if (!signature || !verifySignature(rawBody, signature, secret)) {
      console.warn('cal-webhook: invalid signature');
      return res.status(401).json({ error: 'invalid_signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const triggerEvent = event.triggerEvent;
  try {
    if (triggerEvent === 'BOOKING_CREATED') {
      const result = await handleBookingCreated(event);
      return res.status(200).json({ ok: true, event: 'BOOKING_CREATED', ...result });
    }
    if (triggerEvent === 'BOOKING_CANCELLED') {
      const result = await handleBookingCancelled(event);
      return res.status(200).json({ ok: true, event: 'BOOKING_CANCELLED', ...result });
    }
    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      const result = await handleBookingRescheduled(event);
      return res.status(200).json({ ok: true, event: 'BOOKING_RESCHEDULED', ...result });
    }
  } catch (err) {
    console.error('cal-webhook: handler error', err);
    return res.status(500).json({ error: 'handler_error' });
  }
  return res.status(200).json({ ok: true, ignored: triggerEvent });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigClean = String(signature).replace(/^sha256=/i, '').trim();
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sigClean, 'hex'));
  } catch {
    return false;
  }
}

// Notion is legacy and read-only (Thomas, 2026-09-26): this webhook neither reads nor writes
// it. Pending follow-ups (the 24h nudge, the +48h cancellation follow-up) are found and
// cancelled in Resend by the booker's email address (api/_lib/followups.js), and a cancelled
// booking's follow-up takes its diagnostic context from the booking notes that BlueChip's
// own booking links prefill (Cal.com passes them through as responses.notes / additionalNotes).
async function handleBookingCreated(event) {
  const booking = event.payload || {};
  const email = bookerEmail(booking);
  if (!email) return { error: 'missing_attendee_email' };

  // Cancel any pending automated emails so they don't fire after the person has booked.
  const result = await cancelPendingFollowups(email);
  if (!result.searchComplete) console.warn('cal-webhook: pending follow-up search was incomplete');
  return result;
}

async function handleBookingCancelled(event) {
  const booking = event.payload || {};
  const email = bookerEmail(booking);
  if (!email) return { followupScheduled: false, reason: 'missing_attendee_email' };

  // Only bookings made from a BlueChip diagnostic link get the follow-up (before 2026-09-26:
  // only bookers with a Notion diagnostic row). The link prefills "Diagnostic: <id> | ..."
  // into the notes; anything else, including an unknown id, gets nothing.
  const context = parseBookingNotes(bookingNotes(booking));
  if (!context) return { followupScheduled: false, reason: 'no_diagnostic_context' };

  // Never stack follow-ups: a book/cancel loop leaves at most one pending.
  const { emails: pending } = await findPendingFollowups(email);
  if (pending.some(e => e.subject === CANCEL_FOLLOWUP_SUBJECT)) {
    return { followupScheduled: false, reason: 'already_pending' };
  }

  const rawName = booking.attendees?.[0]?.name || booking.responses?.name?.value || '';
  const firstName = escapeHtml(String(rawName).trim().split(/\s+/)[0] || '').slice(0, 60);
  const followupAt = new Date(Date.now() + CANCEL_FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000).toISOString();
  const { subject, html } = buildCancellationFollowupEmail({
    firstName,
    diagnosticId: context.diagnosticId,
    bandLabel: context.bandLabel,
    total: context.total,
    detail: '',
  });
  const followupId = await scheduleResendEmail({ to: email, subject, html, scheduledAt: followupAt });
  return { followupScheduled: !!followupId };
}

async function handleBookingRescheduled(event) {
  const booking = event.payload || {};
  const oldUid = booking.rescheduleUid || '';
  const newUid = booking.uid || '';
  if (!oldUid && !newUid) return { error: 'missing_uids' };
  // Rescheduling only ever updated Notion fields (meeting time, Cal UID), which are no longer
  // written. Nothing else to do.
  return { rescheduled: true, recorded: false };
}

function bookerEmail(booking) {
  const raw = booking.attendees?.[0]?.email || booking.responses?.email?.value || '';
  const email = String(raw).toLowerCase().trim();
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) ? email : '';
}

function bookingNotes(booking) {
  const fromResponses = booking.responses?.notes?.value;
  return String(fromResponses || booking.additionalNotes || booking.description || '');
}

/**
 * "Diagnostic: org-pulse | Result: Exposed | Total: 42/100" (email links) or
 * "Diagnostic: org-pulse | Tier: exposed | Total: 42/100" (results-page link) ->
 * { diagnosticId, bandLabel, total }, or null when there is no known diagnostic id.
 * Values are whitelisted/clamped: the notes field is free text the booker can edit.
 */
export function parseBookingNotes(notes) {
  const text = String(notes || '').slice(0, 2000);
  const field = (label) => {
    const m = text.match(new RegExp(String.raw`(?:^|\|)\s*${label}:\s*([^|\n]*)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const diagnosticId = field('Diagnostic').toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(DIAGNOSTIC_TITLES, diagnosticId)) return null;
  const band = (field('Result') || field('Tier')).replace(/[^A-Za-z0-9 ,.'-]/g, '').trim().slice(0, 60);
  const totalMatch = field('Total').match(/^(\d{1,3})\s*\/\s*100$/);
  const totalNum = totalMatch ? Number(totalMatch[1]) : null;
  return {
    diagnosticId,
    bandLabel: band,
    total: totalNum !== null && totalNum <= 100 ? totalNum : null,
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function scheduleResendEmail({ to, subject, html, scheduledAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLUECHIP_FROM_EMAIL;
  if (!apiKey || !from) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, scheduled_at: scheduledAt }),
    });
    if (!res.ok) {
      console.error('cal-webhook: Resend schedule failed', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error('cal-webhook: Resend schedule error', err);
    return null;
  }
}
