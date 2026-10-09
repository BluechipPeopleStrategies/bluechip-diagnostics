/* global process, Buffer */
import crypto from 'crypto';
import { cancelPendingFollowups } from './_lib/followups.js';

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
// it. A booking cancels any follow-up still queued for the booker, found in Resend by the
// booker's email address (api/_lib/followups.js). The Clarity Call is gone (2026-10-09), so no
// diagnostic email or page links to a booking any more, and nothing schedules a follow-up:
// BOOKING_CANCELLED and BOOKING_RESCHEDULED are acknowledged and ignored.
async function handleBookingCreated(event) {
  const booking = event.payload || {};
  const email = bookerEmail(booking);
  if (!email) return { error: 'missing_attendee_email' };

  // Cancel any pending automated emails so they don't fire after the person has booked.
  const result = await cancelPendingFollowups(email);
  if (!result.searchComplete) console.warn('cal-webhook: pending follow-up search was incomplete');
  return result;
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
