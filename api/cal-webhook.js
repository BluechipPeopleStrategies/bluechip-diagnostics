import crypto from 'crypto';

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
  if (triggerEvent !== 'BOOKING_CREATED') {
    // Ignore reschedules + cancellations for now; we just track the first booking.
    return res.status(200).json({ ok: true, ignored: triggerEvent });
  }

  const booking = event.payload || {};
  const attendees = booking.attendees || [];
  const email = (attendees[0]?.email || booking.responses?.email?.value || '').toLowerCase().trim();
  const uid = booking.uid || '';
  const meetingTime = booking.startTime || '';
  const bookedAt = event.createdAt || booking.createdAt || new Date().toISOString();
  const bookingUrl = uid ? `https://app.cal.com/booking/${uid}` : '';
  const attendeeName = attendees[0]?.name || booking.responses?.name?.value || '';

  if (!email) {
    return res.status(400).json({ error: 'missing_attendee_email' });
  }

  const result = await upsertNotionBookingRow({ email, uid, meetingTime, bookedAt, bookingUrl, attendeeName });
  return res.status(200).json({ ok: true, ...result });
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

async function upsertNotionBookingRow({ email, uid, meetingTime, bookedAt, bookingUrl, attendeeName }) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('cal-webhook: Notion not configured');
    return { skipped: 'notion_not_configured' };
  }

  const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'Email', email: { equals: email } },
      sorts: [{ property: 'Submitted At', direction: 'descending' }],
      page_size: 1,
    }),
  });
  if (!queryRes.ok) {
    console.error('cal-webhook: Notion query failed', queryRes.status, await queryRes.text());
    return { error: 'notion_query_failed' };
  }
  const queryData = await queryRes.json();
  const existing = queryData.results?.[0];

  const bookingProps = {
    'Lead Status': { select: { name: 'Booked Clarity Call' } },
    'Meeting Time': meetingTime ? { date: { start: meetingTime } } : { date: null },
    'Booked At': bookedAt ? { date: { start: bookedAt } } : { date: null },
    'Cal Booking URL': bookingUrl ? { url: bookingUrl } : { url: null },
    'Cal Event UID': { rich_text: [{ text: { content: uid } }] },
  };

  if (existing) {
    const updRes = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: bookingProps }),
    });
    if (!updRes.ok) {
      console.error('cal-webhook: Notion update failed', updRes.status, await updRes.text());
      return { error: 'notion_update_failed' };
    }
    // Best-effort cancel the scheduled nudge so the person doesn't get pestered after they've already booked.
    const nudgeId = existing.properties?.['Nudge Email ID']?.rich_text?.[0]?.text?.content;
    let nudgeCancelled = false;
    if (nudgeId) nudgeCancelled = await cancelResendEmail(nudgeId);
    return { matched: true, pageId: existing.id, nudgeCancelled };
  }

  // No matching submission row — create a booking-only row so we don't lose the lead.
  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: attendeeName || email } }] },
        Email: { email },
        ...bookingProps,
      },
    }),
  });
  if (!createRes.ok) {
    console.error('cal-webhook: Notion create failed', createRes.status, await createRes.text());
    return { error: 'notion_create_failed' };
  }
  return { matched: false, created: true };
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
