import { NEXT_SESSION_CONSENT_LABEL } from '../../shared/consentCopy.js';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function topicLabel(session, id) {
  const t = session.topics.find((x) => x.id === id);
  return t ? t.label : id;
}

function formatWhen(startUtc, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dtf.format(startUtc)} MT`;
}

// Confirmation email to the registrant. The .ics attachment (built by the caller with
// shared/ics.js) carries the /lunch/live join link and a 15-minute VALARM.
export function buildRegistrantEmail({ reg, session, startUtc, liveUrl }) {
  const first = (reg.name || '').trim().split(/\s+/)[0] || 'there';
  const when = formatWhen(startUtc, session.timeZone);
  return {
    subject: `You're in: ${session.title}`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6;padding:20px">
<div style="max-width:560px;margin:0 auto">
<p style="font-size:18px"><strong>Seat saved, ${esc(first)}.</strong></p>
<p>${esc(session.seriesTitle)}<br>${esc(session.title)}<br>${esc(when)}</p>
<p>Your calendar invite is attached, with a reminder 15 minutes before. The join link is inside it, and always lives at
<a href="${esc(liveUrl)}">${esc(liveUrl)}</a>, no account needed to watch on YouTube.</p>
<p>Know someone who'd get value from the same session? Forward this email or share
${esc(liveUrl.replace('/lunch/live', '/lunch'))}.</p>
<p style="font-size:13px;color:#666;margin-top:24px">BlueChip People Strategies, 10060 Jasper Ave NW, Unit 2020, Edmonton, AB T5J 3R8</p>
</div></body></html>`,
  };
}

// Notification email to Thomas. This is the consent proof: every field the registrant
// submitted, plus the exact wording they saw next to the consent checkbox.
export function buildNotificationEmail({ reg, session, submittedAt }) {
  const rows = [
    ['Name', reg.name],
    ['Email', reg.email],
    ['Organization', reg.org || '(not given)'],
    ['Topics', reg.topics.length ? reg.topics.map((id) => topicLabel(session, id)).join(', ') : '(none picked)'],
    ['Comfort level', reg.comfortLevel != null ? `${reg.comfortLevel} of 5` : '(not set)'],
    ['One thing', reg.oneThing || '(not given)'],
    ['Next-session consent', reg.nextSessionConsent ? 'YES' : 'no'],
    ['Consent wording shown', NEXT_SESSION_CONSENT_LABEL],
    ['Page', reg.page],
    ['Submitted at', submittedAt],
  ];
  return {
    subject: `New Lunch & Learn registration: ${reg.name}`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5;padding:20px">
<div style="max-width:640px;margin:0 auto">
<p style="font-size:18px"><strong>New Lunch &amp; Learn registration</strong></p>
<table cellpadding="6" style="border-collapse:collapse">${rows
      .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top"><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`)
      .join('')}</table>
<p style="font-size:13px;color:#666;margin-top:20px">Reply to this email to reach them directly.</p>
</div></body></html>`,
  };
}
