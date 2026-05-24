import crypto from 'crypto';
import { buildCancellationFollowupEmail } from './_emails/cancellation-followup.js';

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

async function handleBookingCreated(event) {
  const booking = event.payload || {};
  const attendees = booking.attendees || [];
  const email = (attendees[0]?.email || booking.responses?.email?.value || '').toLowerCase().trim();
  const uid = booking.uid || '';
  const meetingTime = booking.startTime || '';
  const bookedAt = event.createdAt || booking.createdAt || new Date().toISOString();
  const bookingUrl = uid ? `https://app.cal.com/booking/${uid}` : '';
  const attendeeName = attendees[0]?.name || booking.responses?.name?.value || '';

  if (!email) return { error: 'missing_attendee_email' };

  const existing = await findMostRecentRowByEmail(email);
  const bookingProps = {
    'Lead Status': { select: { name: 'Booked Clarity Call' } },
    'Meeting Time': meetingTime ? { date: { start: meetingTime } } : { date: null },
    'Booked At': bookedAt ? { date: { start: bookedAt } } : { date: null },
    'Cal Booking URL': bookingUrl ? { url: bookingUrl } : { url: null },
    'Cal Event UID': { rich_text: [{ text: { content: uid } }] },
  };

  if (existing) {
    await patchNotionPage(existing.id, bookingProps);
    // Cancel any pending automated emails so they don't fire after the person has booked.
    const nudgeId = existing.properties?.['Nudge Email ID']?.rich_text?.[0]?.text?.content;
    const followupId = existing.properties?.['Cancel Followup Email ID']?.rich_text?.[0]?.text?.content;
    const nudgeCancelled = nudgeId ? await cancelResendEmail(nudgeId) : false;
    const followupCancelled = followupId ? await cancelResendEmail(followupId) : false;
    return { matched: true, pageId: existing.id, nudgeCancelled, followupCancelled };
  }

  const created = await createNotionPage({
    Name: { title: [{ text: { content: attendeeName || email } }] },
    Email: { email },
    ...bookingProps,
  });
  return { matched: false, created: !!created };
}

async function handleBookingCancelled(event) {
  const booking = event.payload || {};
  const uid = booking.uid || '';
  if (!uid) return { error: 'missing_uid' };

  const row = await findRowByCalEventUid(uid);
  if (!row) {
    console.warn('cal-webhook: BOOKING_CANCELLED with no matching row', uid);
    return { warning: 'no_matching_row', uid };
  }

  await patchNotionPage(row.id, {
    'Lead Status': { select: { name: 'Cancelled' } },
    'Meeting Time': { date: null },
  });

  // Schedule a follow-up at +48h so the lead doesn't go silent.
  const email = row.properties?.Email?.email || '';
  let followupId = null;
  if (email) {
    const name = row.properties?.Name?.title?.[0]?.text?.content || '';
    const firstName = name.trim().split(/\s+/)[0] || '';
    const diagnosticId = row.properties?.Diagnostic?.select?.name || '';
    const bandLabel = row.properties?.['Band Label']?.select?.name || '';
    const total = row.properties?.['Total Score']?.number ?? null;
    const followupAt = new Date(Date.now() + CANCEL_FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000).toISOString();
    const { subject, html } = buildCancellationFollowupEmail({
      firstName,
      diagnosticId,
      bandLabel,
      total,
      detail: '',
    });
    followupId = await scheduleResendEmail({ to: email, subject, html, scheduledAt: followupAt });
    if (followupId) {
      await patchNotionPage(row.id, {
        'Cancel Followup Email ID': { rich_text: [{ text: { content: followupId } }] },
      });
    }
  }

  return { cancelled: true, pageId: row.id, followupScheduled: !!followupId };
}

async function handleBookingRescheduled(event) {
  const booking = event.payload || {};
  const oldUid = booking.rescheduleUid || '';
  const newUid = booking.uid || '';
  const newMeetingTime = booking.startTime || '';
  if (!oldUid && !newUid) return { error: 'missing_uids' };

  const row = (await findRowByCalEventUid(oldUid)) || (await findRowByCalEventUid(newUid));
  if (!row) {
    console.warn('cal-webhook: BOOKING_RESCHEDULED with no matching row', { oldUid, newUid });
    return { warning: 'no_matching_row', oldUid, newUid };
  }

  await patchNotionPage(row.id, {
    'Meeting Time': newMeetingTime ? { date: { start: newMeetingTime } } : { date: null },
    'Cal Event UID': { rich_text: [{ text: { content: newUid } }] },
    'Cal Booking URL': newUid ? { url: `https://app.cal.com/booking/${newUid}` } : { url: null },
    'Lead Status': { select: { name: 'Booked Clarity Call' } },
  });
  return { rescheduled: true, pageId: row.id };
}

async function findMostRecentRowByEmail(email) {
  return await queryFirstRow({
    filter: { property: 'Email', email: { equals: email } },
    sorts: [{ property: 'Submitted At', direction: 'descending' }],
  });
}

async function findRowByCalEventUid(uid) {
  if (!uid) return null;
  return await queryFirstRow({
    filter: {
      property: 'Cal Event UID',
      rich_text: { equals: uid },
    },
  });
}

async function queryFirstRow(body) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return null;
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, page_size: 1 }),
  });
  if (!res.ok) {
    console.error('cal-webhook: Notion query failed', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.results?.[0] || null;
}

async function patchNotionPage(pageId, properties) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return false;
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    console.error('cal-webhook: Notion patch failed', res.status, await res.text());
    return false;
  }
  return true;
}

async function createNotionPage(properties) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return false;
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) {
    console.error('cal-webhook: Notion create failed', res.status, await res.text());
    return false;
  }
  return true;
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

async function cancelResendEmail(emailId) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !emailId) return false;
  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn('cal-webhook: Resend cancel failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('cal-webhook: Resend cancel error', err);
    return false;
  }
}
