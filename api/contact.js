import { buildContactAcknowledgementEmail } from './_emails/contact-acknowledgement.js';
import { buildContactNotificationEmail } from './_emails/contact-notification.js';

const ALLOWED_ORIGINS = [
  'https://bluechip-people-strategies.com',
  'https://www.bluechip-people-strategies.com',
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const {
    name,
    email,
    inquiry,
    source,
    ackAdvisoryOnly,
    ackDecisionsAreMine,
    ackReadMSA,
    company, // honeypot
  } = req.body || {};

  // Honeypot: legitimate users won't fill this hidden field. Pretend success to fool bots.
  if (company && String(company).trim().length > 0) {
    console.warn('contact: honeypot triggered', { name, email });
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !inquiry) {
    return res.status(400).json({ error: 'missing_required_fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!ackAdvisoryOnly || !ackDecisionsAreMine || !ackReadMSA) {
    return res.status(400).json({ error: 'missing_acknowledgements' });
  }

  const acks = {
    advisoryOnly: !!ackAdvisoryOnly,
    decisionsAreMine: !!ackDecisionsAreMine,
    readMSA: !!ackReadMSA,
  };
  const submittedAt = new Date().toISOString();
  const cleanSource = (source || 'contact-form').toString().slice(0, 100);

  const notionWritten = await writeNotionContactRow({
    name,
    email,
    inquiry,
    source: cleanSource,
    submittedAt,
    acks,
  });

  const ackTemplate = buildContactAcknowledgementEmail({ name });
  const acknowledgementSent = await sendEmail({
    to: email,
    subject: ackTemplate.subject,
    html: ackTemplate.html,
  });

  const notifTemplate = buildContactNotificationEmail({
    name,
    email,
    inquiry,
    source: cleanSource,
    acks,
  });
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const notificationSent = await sendEmail({
    to: notifyTo,
    subject: notifTemplate.subject,
    html: notifTemplate.html,
    replyTo: email,
  });

  return res.status(200).json({ ok: true, acknowledgementSent, notificationSent, notionWritten });
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLUECHIP_FROM_EMAIL;
  if (!apiKey || !from || !to) return false;
  const body = { from, to, subject, html };
  if (replyTo) body.reply_to = replyTo;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('contact: Resend send failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('contact: Resend send error', err);
    return false;
  }
}

async function writeNotionContactRow({ name, email, inquiry, source, submittedAt, acks }) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_CONTACT_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('contact: Notion contact DB not configured');
    return false;
  }
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { email },
          Inquiry: { rich_text: [{ text: { content: inquiry.slice(0, 2000) } }] },
          Source: { rich_text: [{ text: { content: source } }] },
          'Submitted At': { date: { start: submittedAt } },
          Status: { select: { name: 'New' } },
          'Ack: Advisory only': { checkbox: !!acks.advisoryOnly },
          'Ack: Decisions are mine': { checkbox: !!acks.decisionsAreMine },
          'Ack: Read MSA': { checkbox: !!acks.readMSA },
        },
      }),
    });
    if (!res.ok) {
      console.error('contact: Notion write failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('contact: Notion write error', err);
    return false;
  }
}
