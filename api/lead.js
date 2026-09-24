import { isHoneypot, sanitizeLead, validateLead, formatLeadSms, looksLikePhone, formatVisitorConfirmation, samePhone, buildChatLeadEmail, isCanadianPhone } from './_lib/lead-helpers.js';

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
  // Squarespace editor and preview, so Thomas can test the chat without publishing (2026-09-24).
  'https://helix-radish-yk5a.squarespace.com',
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

export async function writeNotionLead(clean, submittedAt) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_CONTACT_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('lead: Notion contact DB not configured');
    return false;
  }
  try {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: clean.name } }] },
          Inquiry: { rich_text: [{ text: { content: `${clean.need}\nContact: ${clean.contact}${clean.email ? `\nEmail: ${clean.email}` : ''}\nTexting consent: ${clean.consent ? 'yes' : 'NO'}` } }] },
          Source: { rich_text: [{ text: { content: clean.source || 'chat widget' } }] },
          'Submitted At': { date: { start: submittedAt } },
          Status: { select: { name: 'New' } },
          ...(clean.email ? { Email: { email: clean.email } } : {}),
        },
      }),
    });
    if (!r.ok) {
      console.error('lead: Notion write failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lead: Notion write error', err);
    return false;
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
    const mail = buildChatLeadEmail(clean, { smsSent: false, suspectedSpam: true });
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
  const notionWritten = await writeNotionLead(clean, submittedAt);

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

  // Email copy of every lead, so a failed text never means a missed lead.
  const mail = buildChatLeadEmail(clean, { smsSent, confirmationNote });
  const emailSent = await sendLeadEmail({ ...mail, replyTo });

  return res.status(200).json({ ok: true, smsSent, notionWritten, confirmationSent, emailSent });
}
