import { isHoneypot, sanitizeLead, validateLead, formatLeadSms } from './_lib/lead-helpers.js';

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

export async function sendOpenPhoneSms({ to, content }) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const from = process.env.OPENPHONE_FROM;
  if (!apiKey || !from || !to) {
    console.warn('lead: OpenPhone not configured');
    return false;
  }
  try {
    const r = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], content }),
    });
    if (!r.ok) {
      console.error('lead: OpenPhone send failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lead: OpenPhone send error', err);
    return false;
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

  if (isHoneypot(body)) {
    console.warn('lead: honeypot triggered');
    return res.status(200).json({ ok: true });
  }

  const clean = sanitizeLead(body);
  const valid = validateLead(clean);
  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  const submittedAt = new Date().toISOString();
  const to = process.env.LEAD_NOTIFY_PHONE || '+15877130585';

  const smsSent = await sendOpenPhoneSms({ to, content: formatLeadSms(clean) });
  const notionWritten = await writeNotionLead(clean, submittedAt);

  return res.status(200).json({ ok: true, smsSent, notionWritten });
}
