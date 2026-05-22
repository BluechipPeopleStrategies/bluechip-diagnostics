const TERMS_URL = 'https://bluechip-people-strategies.com/terms';
const PRIVACY_URL = 'https://bluechip-people-strategies.com/privacy';

const SIGNAL_RICH_BANDS = new Set(['Pressure building', 'Mixed signal']);

export function buildOrgPulseEmail({ firstName, bandLabel, total, diagnosticId = 'org-pulse' }) {
  const name = firstName || 'there';
  const tier = SIGNAL_RICH_BANDS.has(bandLabel) ? 'signal-rich' : 'strong-foundation';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total });
  return tier === 'signal-rich'
    ? signalRich({ name, bandLabel, total, ctaUrl })
    : strongFoundation({ name, bandLabel, total, ctaUrl });
}

function signalRich({ name, bandLabel, total, ctaUrl }) {
  return {
    subject: 'Your Org Pulse result — where the leverage is',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running Org Pulse. Your result landed in <strong>${bandLabel}</strong> (${total}/100) — signal-rich. You flagged specific dimensions where pressure is showing up, and that's actually the most useful kind of result you can get from this kind of read. It points directly at where the next round of capability-building lands.</p>
      <p><strong>The dimensions you flagged are where growth happens.</strong> Organizations that develop deliberately don't avoid pressure — they read it accurately, then build the structures and leadership habits that turn it into capacity. You've now done the reading part. The structures and habits are the build.</p>
      <p><strong>This is a good moment to act, not a worrying one.</strong> Teams that surface this kind of signal early and respond to it tend to come out of the next 12 months meaningfully stronger than peers who don't. The window where it's cheap to address is right now.</p>
      <p><strong>What we'd usually do next:</strong> a 30-minute Clarity Call to walk through your result, ask the few questions the diagnostic can't, and map out what a development path could look like for your organization specifically. Free — you earned it by finishing the diagnostic.</p>
      ${ctaButton('Book your free Clarity Call', ctaUrl)}
      <p>Or reply to this email if you'd rather start in writing.</p>
      <p>— Thomas<br/>BlueChip People Strategies</p>
    `),
  };
}

function strongFoundation({ name, bandLabel, total, ctaUrl }) {
  return {
    subject: 'Your Org Pulse result — and what to build on it',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running Org Pulse. Your result landed in <strong>${bandLabel}</strong> (${total}/100) — strong-foundation. The dimensions you flagged tell us you've built the kind of underlying health that makes the next move easier, not harder. That's a platform, and platforms are rare.</p>
      <p><strong>Strong foundations are leverage, not endpoints.</strong> The orgs we see compound the most aren't the ones that hit "healthy" and coast — they're the ones that use a healthy baseline to take on harder development work earlier than peers can. Leadership pipeline, governance maturity, supervisor capability — the stuff that's expensive to retrofit when an org is under strain becomes cheaper to build when it isn't.</p>
      <p><strong>Run this on a cadence, not as a one-off.</strong> Most of the value is in the trend line. If you re-run Org Pulse in 90 days, the comparison is where the actual insight lives.</p>
      <p>If there's a leadership transition, restructure, or major initiative on your horizon in the next two quarters, that's exactly the kind of moment a strong foundation pays for itself — and exactly the kind of moment a Clarity Call is most useful. Free, 30 minutes, no pitch.</p>
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
