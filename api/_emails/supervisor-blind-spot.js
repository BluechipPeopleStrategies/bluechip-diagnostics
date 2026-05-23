const TERMS_URL = 'https://bluechip-people-strategies.com/terms';
const PRIVACY_URL = 'https://bluechip-people-strategies.com/privacy';

const STRONG_FOUNDATION_ARCHETYPES = new Set(['coach', 'builder']);

export function buildSupervisorBlindSpotEmail({ firstName, bandLabel, total, diagnosticId = 'supervisor-blind-spot' }) {
  const name = firstName || 'there';
  const archetypeId = bandLabel || '';
  const tier = STRONG_FOUNDATION_ARCHETYPES.has(archetypeId) ? 'strong-foundation' : 'signal-rich';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel: archetypeId, total });
  return tier === 'signal-rich'
    ? signalRich({ name, archetypeId, ctaUrl })
    : strongFoundation({ name, archetypeId, ctaUrl });
}

function signalRich({ name, archetypeId, ctaUrl }) {
  return {
    subject: 'Your Supervisor Blind Spot result — where the development lands',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running the Supervisor Blind Spot. Your result is signal-rich — you flagged specific patterns where the gap between intent and impact is showing up, and that's the most useful kind of result this diagnostic produces. It points directly at where targeted development pays off the fastest.</p>
      <p><strong>Blind spots aren't flaws — they're the development frontier.</strong> Every supervisor has them. The ones who grow fastest are the ones who surface them deliberately and treat them as the work, not as something to defend against. You just did the first half.</p>
      <p><strong>Supervisor capability is the most undervalued leverage point in any org.</strong> Most leadership development goes to executives. Most management training goes to middle managers. Supervisors — the layer closest to the actual work — get less than either. That makes targeted supervisor development one of the highest-ROI moves a thinking org can make. You're already ahead of that curve just by running this.</p>
      <p><strong>What we'd usually do next:</strong> a 30-minute Clarity Call to walk through your result, ask the few questions the diagnostic can't, and map out what development could look like — whether that's individual work, a cohort track, or something embedded into how your org develops supervisors generally. Free — you earned it by finishing the diagnostic.</p>
      ${ctaButton('Book your free Clarity Call', ctaUrl)}
      <p>Or reply to this email if you'd rather start in writing.</p>
      <p>— Thomas<br/>BlueChip People Strategies</p>
    `),
  };
}

function strongFoundation({ name, archetypeId, ctaUrl }) {
  return {
    subject: 'Your Supervisor Blind Spot result — and what to build on it',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running the Supervisor Blind Spot. Your result lands in the strong-foundation range — the dimensions you flagged tell us your self-read as a supervisor is sharper than most. That's not common, and it matters.</p>
      <p><strong>Self-awareness is the supervisor skill that scales everything else.</strong> Supervisors who can read their own impact accurately make better calls on delegation, feedback, conflict, hiring — the entire job. You've now confirmed you have the underlying capability. The leverage is in what you do with it.</p>
      <p><strong>The next move from here is usually expanding the read.</strong> Self-perception is one signal. Reports' perception is another. Peers' is a third. Strong supervisors — the ones who genuinely grow — eventually triangulate all three. If you want a structured way to do that, a 360-style read or a coaching engagement is usually how it happens.</p>
      <p>A Clarity Call is the cheapest way to talk through whether the next investment is worth making for you specifically. Free, 30 minutes, no pitch.</p>
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
  if (bandLabel) lines.push(`Archetype: ${bandLabel}`);
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
