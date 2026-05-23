const TERMS_URL = 'https://bluechip-people-strategies.com/terms';
const PRIVACY_URL = 'https://bluechip-people-strategies.com/privacy';

const STRONG_FOUNDATION_ARCHETYPES = new Set(['healthy-tension']);

export function buildWorkplaceReadEmail({ firstName, bandLabel, total, diagnosticId = 'workplace-read' }) {
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
    subject: 'Your Workplace Read result — what it gives you',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running Workplace Read. Your result is signal-rich — what you flagged about your workplace matches patterns we see often, and being able to name those dimensions clearly is useful regardless of where you sit relative to them. Most people inside difficult environments can't articulate what's off. You just did.</p>
      <p><strong>Naming the pattern is the first move, not the last.</strong> A lot of what makes a tough workplace tough is that the issues stay vague, personal, and hard to talk about. Workplace Read gives you a vocabulary — dimensions, patterns, language. That's leverage you didn't have an hour ago.</p>
      <p><strong>There are more options than the situation usually suggests.</strong> Depending on what you flagged, the next step might be a structured conversation with a leader or HR, a documented request for a change, a deliberate decision about whether to stay and shape it or leave on your terms. None of those require figuring it out alone — and if you're the leader, the same dimensions point at where investment lands next: manager development, structural change, communication architecture, or something narrower.</p>
      <p><strong>What we'd usually do next:</strong> a 30-minute Clarity Call to walk through your result, ask the few questions Workplace Read can't, and tell you honestly what the right next move is. Free — you earned it by finishing the diagnostic. Confidential either way.</p>
      ${ctaButton('Book your free Clarity Call', ctaUrl)}
      <p>Or reply to this email if you'd rather start in writing.</p>
      <p>— Thomas<br/>BlueChip People Strategies</p>
    `),
  };
}

function strongFoundation({ name, archetypeId, ctaUrl }) {
  return {
    subject: 'Your Workplace Read result — and what to build on it',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Thanks for running Workplace Read. Your result lands in the healthy range — what you flagged doesn't match the patterns we see in genuinely difficult workplaces. That's a useful read whichever side of the org chart you're on.</p>
      <p><strong>A healthy workplace is rarer than people realize.</strong> If your read holds up, you're in something most people in the workforce don't experience. That's worth recognizing — and it's worth being deliberate about. Healthy workplaces aren't accidents; they're built and maintained by people who pay attention to them. You're now one of those people.</p>
      <p><strong>The leverage from here is making the read habitual, not occasional.</strong> Most workplaces that drift into trouble drift there slowly, and the people inside them are the last to see it. Running Workplace Read on a cadence — quarterly, or at moments of change like a restructure, a leadership transition, or a growth period — turns "I think we're fine" into "I know what changed and by how much." The link is the same.</p>
      <p>If a specific question is on your mind — a change you're weighing, a team dynamic you're noticing, a leadership move you're considering — a Clarity Call is the cheapest way to talk it through. Free, 30 minutes, no pitch.</p>
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
