const TERMS_URL = 'https://bluechip-people-strategies.com/terms';
const PRIVACY_URL = 'https://bluechip-people-strategies.com/privacy';

const SIGNAL_RICH_BANDS = new Set(['Decision drag', 'Mixed signal']);

export function buildDqiEmail({ firstName, bandLabel, total, diagnosticId = 'dqi' }) {
  const name = firstName || 'there';
  const tier = SIGNAL_RICH_BANDS.has(bandLabel) ? 'signal-rich' : 'strong-foundation';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total });
  return tier === 'signal-rich'
    ? signalRich({ name, bandLabel, total, ctaUrl })
    : strongFoundation({ name, bandLabel, total, ctaUrl });
}

function signalRich({ name, bandLabel, total, ctaUrl }) {
  return {
    subject: 'Your DQI result — where the decision capability builds',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running the Decision Quality Index. Your result landed in <strong>${bandLabel}</strong> (${total}/100) — signal-rich. You flagged specific patterns in how decisions get made under pressure, and that's the most useful kind of read you can get out of DQI. It points directly at where decision capability builds next.</p>
      <p><strong>Decision quality is the most under-developed leadership muscle.</strong> Most leaders don't get formal development on it after their first management role — they accumulate habits, good and bad, and the patterns DQI surfaces are usually the bad ones quietly hardening. You've now made yours legible. That's the work most leaders never do.</p>
      <p><strong>The leverage is in the patterns, not the individual decisions.</strong> A single bad call is a story. A pattern is a system. The dimensions you flagged are the system — and systems respond to deliberate work in a way single decisions don't.</p>
      <p><strong>What we'd usually do next:</strong> a 30-minute Clarity Call to read the result with you, ask the few questions DQI can't, and map out what targeted development could look like — whether that's a Leadership Academy track, embedded coaching, or something narrower. Free — you earned it by finishing the diagnostic.</p>
      ${ctaButton('Book your free Clarity Call', ctaUrl)}
      <p>Or reply to this email if you'd rather start in writing.</p>
      <p>— Thomas<br/>BlueChip People Strategies</p>
    `),
  };
}

function strongFoundation({ name, bandLabel, total, ctaUrl }) {
  return {
    subject: 'Your DQI result — and what to build on it',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running the Decision Quality Index. Your result landed in <strong>${bandLabel}</strong> (${total}/100) — strong-foundation. The patterns you flagged tell us your decision habits under pressure are already in the top tier of what we see. That's rarer than it sounds.</p>
      <p><strong>Strong decision habits are leverage you can extend.</strong> The leaders who compound the most aren't the ones who hit "good" and coast — they're the ones who use a strong baseline to take on harder decisions earlier than peers can. Bigger bets, faster cycles, more delegated authority downstream. The habits that got you here are the same ones that scale.</p>
      <p><strong>The blind spot at this level is usually team-wide, not personal.</strong> Your decisions are strong. The question worth asking is whether the people who report to you make decisions the same way — and whether the structures around them reward or punish it. That's the next frontier from where you sit.</p>
      <p>If a leadership transition, a stretch hire, or a bigger mandate is landing in the next two quarters, a Clarity Call is the right way to talk through what scaffolding would help most. Free, 30 minutes, no pitch.</p>
      ${ctaButton('Book your free Clarity Call', ctaUrl)}
      <p>— Thomas<br/>BlueChip People Strategies</p>
    `),
  };
}

function buildCalUrl({ diagnosticId, bandLabel, total }) {
  const baseUrl = process.env.CAL_BOOKING_URL || process.env.VITE_CAL_BOOKING_URL;
  if (!baseUrl) return '';
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return '';
  }
  const lines = [];
  if (diagnosticId) lines.push(`Diagnostic: ${diagnosticId}`);
  if (bandLabel) lines.push(`Tier: ${bandLabel}`);
  if (typeof total === 'number') lines.push(`Total: ${total}/100`);
  const notes = lines.join(' | ');
  if (notes) url.searchParams.set('notes', notes);
  return url.toString();
}

function layout(bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f6f4;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:6px;padding:32px;line-height:1.55;font-size:16px;max-width:560px;">
        <tr><td>
          ${bodyHtml}
          <hr style="border:0;border-top:1px solid #e5e5e1;margin:32px 0 16px;"/>
          <p style="font-size:12px;color:#7a7a7a;line-height:1.5;">By completing this diagnostic you agreed to BlueChip's <a href="${TERMS_URL}" style="color:#7a7a7a;">terms of use</a> and <a href="${PRIVACY_URL}" style="color:#7a7a7a;">privacy policy</a>. Reply STOP to unsubscribe from BlueChip emails.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(label, url) {
  if (!url) {
    return `<p style="text-align:center;margin:28px 0;color:#7a7a7a;font-style:italic;">${label} — reply to this email to book.</p>`;
  }
  return `<p style="text-align:center;margin:28px 0;"><a href="${url}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:4px;font-weight:600;">${label} →</a></p>`;
}
