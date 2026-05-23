import { buildOrgPulseEmail } from './_emails/org-pulse.js';
import { buildDqiEmail } from './_emails/dqi.js';
import { buildSupervisorBlindSpotEmail } from './_emails/supervisor-blind-spot.js';
import { buildWorkplaceReadEmail } from './_emails/workplace-read.js';

const TEMPLATE_BUILDERS = {
  'org-pulse': buildOrgPulseEmail,
  'dqi': buildDqiEmail,
  'supervisor-blind-spot': buildSupervisorBlindSpotEmail,
  'workplace-read': buildWorkplaceReadEmail,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { diagnosticId, resultLabel, detail, email, name, submittedAt } = req.body || {};

  if (!diagnosticId || !email) {
    return res.status(400).json({ error: 'missing_required_fields' });
  }

  const { bandLabel, total } = parseResultLabel(resultLabel);
  const firstName = (name || '').trim().split(/\s+/)[0] || '';

  const buildTemplate = TEMPLATE_BUILDERS[diagnosticId];
  let emailSent = false;
  if (buildTemplate) {
    const { subject, html } = buildTemplate({ firstName, bandLabel, total, detail: detail || '', diagnosticId });
    emailSent = await sendResendEmail({ to: email, subject, html });
  }

  const notionRowCreated = await writeNotionRow({
    name: name || '',
    email,
    diagnosticId,
    bandLabel,
    total,
    resultLabel: resultLabel || '',
    submittedAt: submittedAt || new Date().toISOString(),
  });

  return res.status(200).json({ ok: true, emailSent, notionRowCreated });
}

function parseResultLabel(resultLabel) {
  if (!resultLabel || typeof resultLabel !== 'string') {
    return { bandLabel: '', total: null };
  }
  const match = resultLabel.match(/^(.*?)\s*\((\d+)\/100\)\s*$/);
  if (!match) return { bandLabel: resultLabel, total: null };
  return { bandLabel: match[1].trim(), total: Number(match[2]) };
}

async function sendResendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLUECHIP_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn('Resend not configured; skipping email send');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error('Resend send failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend send error', err);
    return false;
  }
}

async function writeNotionRow({ name, email, diagnosticId, bandLabel, total, resultLabel, submittedAt }) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('Notion not configured; skipping row write');
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
          Name: { title: [{ text: { content: name || email } }] },
          Email: { email },
          Diagnostic: { select: { name: diagnosticId } },
          'Band Label': bandLabel ? { select: { name: bandLabel } } : { select: null },
          'Total Score': total != null ? { number: total } : { number: null },
          'Result Label': { rich_text: [{ text: { content: resultLabel || '' } }] },
          'Submitted At': { date: { start: submittedAt } },
          'Lead Status': { select: { name: 'New' } },
        },
      }),
    });
    if (!res.ok) {
      console.error('Notion write failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Notion write error', err);
    return false;
  }
}
