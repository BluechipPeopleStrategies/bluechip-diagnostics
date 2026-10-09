/* global process */
import { buildContactAcknowledgementEmail } from './_emails/contact-acknowledgement.js';
import { buildContactNotificationEmail } from './_emails/contact-notification.js';
import { cleanRecipient } from './_lib/email-address.js';

const ALLOWED_ORIGINS = [
  'https://bluechip-people-strategies.com',
  'https://www.bluechip-people-strategies.com',
  // Free checks on BlueChip's own address (Oct 9, 2026), plus the old Vercel address during the move.
  'https://check.bluechip-people-strategies.com',
  'https://bluechip-diagnostics.vercel.app',
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
    company, // honeypot
  } = req.body || {};

  // Honeypot: legitimate users won't fill this hidden field. Pretend success to fool bots, but
  // never drop it silently (browsers autofill fields named "company" and that once lost real
  // leads on the chat widget): Thomas gets a flagged copy, and the sender gets no acknowledgement.
  if (company && String(company).trim().length > 0) {
    console.warn('contact: honeypot triggered');
    const flagged = buildContactNotificationEmail({
      name: cap(name, 120),
      email: cap(email, 200),
      inquiry: cap(inquiry, 4000),
      source: `${cap(source, 80) || 'contact-form'} (spam trap filled)`,
      acks: { advisoryOnly: !!ackAdvisoryOnly, decisionsAreMine: !!ackDecisionsAreMine },
      submittedAt: new Date().toISOString(),
    });
    await sendEmail({
      to: process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL,
      subject: `[Check: spam trap] ${flagged.subject}`,
      html: flagged.html,
    });
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !inquiry) {
    return res.status(400).json({ error: 'missing_required_fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!ackAdvisoryOnly || !ackDecisionsAreMine) {
    return res.status(400).json({ error: 'missing_acknowledgements' });
  }

  const acks = {
    advisoryOnly: !!ackAdvisoryOnly,
    decisionsAreMine: !!ackDecisionsAreMine,
  };
  const submittedAt = new Date().toISOString();
  const cleanSource = (source || 'contact-form').toString().slice(0, 100);

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
    submittedAt,
  });
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const notificationSent = await sendEmail({
    to: notifyTo,
    subject: notifTemplate.subject,
    html: notifTemplate.html,
    replyTo: email,
  });

  return res.status(200).json({ ok: true, acknowledgementSent, notificationSent });
}

const cap = (value, max) => (typeof value === 'string' ? value : String(value ?? '')).trim().slice(0, max);

function isValidEmail(email) {
  return cleanRecipient(email) !== '';
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
