import { sendOpenPhoneSms, sendLeadEmail } from './lead.js';

// Daily lead-path check (Vercel cron, see vercel.json). Sends one test text to the lead
// alert number and one email to the lead inbox. If the text fails, the email says so in
// the subject line. If the email fails, a text alert goes out instead. Added 2026-09-24
// after chat leads were silently dropped (honeypot autofill) and Quo ran out of credits.
export default async function handler(req, res) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const when = new Date().toLocaleString('en-CA', { timeZone: 'America/Edmonton' });
  const to = (process.env.LEAD_NOTIFY_PHONE || '+15877130585').trim();

  const sms = await sendOpenPhoneSms({ to, content: `BlueChip daily lead check (${when}): lead texts are working. No action needed.` });
  const smsLine = sms.sent ? 'working' : `FAILING (${sms.status || 'no status'}: ${String(sms.error || '').slice(0, 160)})`;
  const subject = sms.sent
    ? `Daily lead check: texts and email working (${when})`
    : `ACTION NEEDED: lead texts are failing (${when})`;
  const fix = sms.sent ? '' : '<p><strong>Leads will still arrive by email, but no text alerts go out until this is fixed.</strong> A 402 error means the Quo account needs prepaid credits.</p>';
  const emailSent = await sendLeadEmail({
    subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><p><strong>Daily lead check</strong>, ${when}</p><p>Text alerts: ${smsLine}<br>Email alerts: working (you're reading this)</p>${fix}<p style="color:#666;font-size:13px">Sent automatically every morning by bluechip-diagnostics (api/lead-selftest).</p></div>`,
  });
  if (!emailSent && sms.sent) {
    await sendOpenPhoneSms({ to, content: 'ACTION NEEDED: BlueChip lead EMAILS are failing (daily check). Texts still work. Check the Resend settings on Vercel.' });
  }
  if (!emailSent || !sms.sent) console.error('lead-selftest: failure', { smsSent: sms.sent, emailSent });
  return res.status(200).json({ ok: sms.sent && emailSent, smsSent: sms.sent, emailSent });
}
