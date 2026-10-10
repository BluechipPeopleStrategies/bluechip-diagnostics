/* global process */
import { isHoneypot, sanitizeLead, validateLead, formatLeadSms, looksLikePhone, formatVisitorConfirmation, samePhone, buildChatLeadEmail, isCanadianPhone } from './_lib/lead-helpers.js';
import { cleanRecipient } from './_lib/email-address.js';
import { buildContactAutoReplyEmail } from './_emails/contact-auto-reply.js';

export async function sendLeadEmail({ subject, html, replyTo }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.BLUECHIP_FROM_EMAIL || '').trim();
  const to = (process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL || '').trim();
  if (!apiKey || !from || !to) {
    console.warn('lead: email not configured');
    return false;
  }
  const body = { from, to, subject, html };
  if (replyTo) body.reply_to = replyTo;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error('lead: Resend send failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lead: Resend send error', err);
    return false;
  }
}

const ALLOWED_ORIGINS = [
  'https://bluechip-people-strategies.com',
  'https://www.bluechip-people-strategies.com',
  // Free checks on BlueChip's own address (Oct 9, 2026), plus the old Vercel address during the move.
  'https://check.bluechip-people-strategies.com',
  'https://bluechip-diagnostics.vercel.app',
  // Squarespace editor and preview, so Thomas can test the chat without publishing (2026-09-24).
  'https://helix-radish-yk5a.squarespace.com',
];

// Auto-reply to the visitor (contact form only). Separate from sendLeadEmail, which always goes to BlueChip.
export async function sendVisitorEmail({ to, subject, html, text }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.BLUECHIP_FROM_EMAIL || '').trim();
  if (!apiKey || !from || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, text, reply_to: 'hello@bluechip-people-strategies.com' }),
    });
    if (!r.ok) { console.error('lead: auto-reply send failed', r.status, await r.text()); return false; }
    return true;
  } catch (err) {
    console.error('lead: auto-reply send error', err);
    return false;
  }
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export async function sendOpenPhoneSms({ to, content }) {
  // Trim stray whitespace/tabs/newlines that copy-paste can leave in env vars or input.
  const apiKey = (process.env.OPENPHONE_API_KEY || '').trim();
  const from = (process.env.OPENPHONE_FROM || '').trim();
  to = typeof to === 'string' ? to.trim() : to;
  if (!apiKey || !from || !to) {
    console.warn('lead: OpenPhone not configured');
    return {
      sent: false,
      configured: !!apiKey && !!from,
      hasKey: !!apiKey,
      hasFrom: !!from,
      status: null,
      error: 'missing_env_or_to',
    };
  }
  try {
    const r = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], content }),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('lead: OpenPhone send failed', r.status, text);
      return { sent: false, configured: true, hasKey: true, hasFrom: true, status: r.status, error: String(text).slice(0, 300) };
    }
    return { sent: true, configured: true, hasKey: true, hasFrom: true, status: r.status, error: null };
  } catch (err) {
    console.error('lead: OpenPhone send error', err);
    return { sent: false, configured: true, hasKey: true, hasFrom: true, status: null, error: String(err).slice(0, 300) };
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = req.body || {};

  const clean = sanitizeLead(body);
  const replyTo = /@/.test(clean.email) ? clean.email : undefined;

  if (isHoneypot(body)) {
    // Probably a bot, but never drop it silently: email it, flagged, and skip the text alert.
    console.warn('lead: honeypot triggered');
    const mail = buildChatLeadEmail(clean, { smsSent: false, suspectedSpam: true, submittedAt: new Date().toISOString() });
    await sendLeadEmail({ ...mail, replyTo });
    return res.status(200).json({ ok: true });
  }

  const valid = validateLead(clean);
  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  const submittedAt = new Date().toISOString();
  const to = (process.env.LEAD_NOTIFY_PHONE || '+15877130585').trim();

  const leadResult = await sendOpenPhoneSms({ to, content: formatLeadSms(clean) });
  const smsSent = leadResult.sent;

  // Auto-confirmation back to the visitor (only when they opted in and gave a phone number).
  // Skipped when the visitor's number is BlueChip's own texting number: it can't text itself.
  let confirmationSent = false;
  let confirmationNote = 'not requested';
  if (clean.consent && looksLikePhone(clean.contact)) {
    if (samePhone(clean.contact, process.env.OPENPHONE_FROM)) {
      confirmationNote = "skipped: the visitor's number is BlueChip's own texting number";
    } else if (!isCanadianPhone(clean.contact)) {
      confirmationNote = 'skipped: not a Canadian number, so reply by email';
    } else {
      const conf = await sendOpenPhoneSms({ to: clean.contact, content: formatVisitorConfirmation(clean) });
      confirmationSent = conf.sent;
      confirmationNote = conf.sent ? 'sent' : 'failed';
    }
  }

  // Email copy of every lead, so a failed text never means a missed lead. Since 2026-09-26 this
  // email is also the lead record (Notion is legacy, read-only): a local job files it in the
  // Obsidian vault from its Lead-Data block.
  const mail = buildChatLeadEmail(clean, { smsSent, confirmationNote, submittedAt });
  const emailSent = await sendLeadEmail({ ...mail, replyTo });

  // If neither the text nor the email went out the lead is lost: say so (non-2xx) so the widget
  // keeps the form and tells the visitor, instead of confirming an inquiry nobody received.
  const captured = smsSent || emailSent;

  // Contact-form senders get one short auto-reply (Thomas, Oct 9 2026). Only once the lead is captured, and a
  // failed auto-reply never fails the lead.
  let autoReplySent = false;
  if (captured && /contact form/i.test(clean.source || '')) {
    const to = cleanRecipient(clean.email || clean.contact);
    if (to) autoReplySent = await sendVisitorEmail({ to, ...buildContactAutoReplyEmail({ name: clean.name }) });
  }
  return res.status(captured ? 200 : 502).json({ ok: captured, smsSent, confirmationSent, emailSent, autoReplySent });
}
