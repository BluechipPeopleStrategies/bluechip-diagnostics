import { layout, buildCalUrl, calLink } from './_shared.js';

const STRONG_FOUNDATION_ARCHETYPES = new Set(['coach', 'builder']);

export function buildSupervisorBlindSpotEmail({ firstName, bandLabel, detail, diagnosticId = 'supervisor-blind-spot' }) {
  const name = firstName || 'there';
  const archetypeId = bandLabel || '';
  const archetypeLabel = detail || archetypeId || 'your archetype';
  const tier = STRONG_FOUNDATION_ARCHETYPES.has(archetypeId) ? 'strong-foundation' : 'signal-rich';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel: archetypeId, detail });
  return tier === 'signal-rich'
    ? signalRich({ name, archetypeLabel, ctaUrl })
    : strongFoundation({ name, archetypeLabel, ctaUrl });
}

function signalRich({ name, archetypeLabel, ctaUrl }) {
  const cta = ctaUrl
    ? `<p>If you want to talk through what targeted development could look like, ${calLink(ctaUrl)}. Free, 30 minutes, no pitch. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply to this email and we'll find a time.</p>`;
  return {
    subject: 'Your Supervisor Blind Spot result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Supervisor Blind Spot read came in. You landed as ${archetypeLabel}, which is signal-rich. That's actually the most useful kind of result this diagnostic produces.</p>
      <p>Blind spots aren't flaws. They're the development frontier. Every supervisor has them. The ones who grow fastest surface them deliberately and treat them as the work, not as something to defend against.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}

function strongFoundation({ name, archetypeLabel, ctaUrl }) {
  const cta = ctaUrl
    ? `<p>If you want to talk through whether a 360-style read or a coaching engagement is worth it for you, ${calLink(ctaUrl)}. Free, 30 minutes. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply and we'll find a time.</p>`;
  return {
    subject: 'Your Supervisor Blind Spot result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Supervisor Blind Spot read came in. You landed as ${archetypeLabel}, which is strong-foundation. Self-awareness at this level is rarer than it sounds.</p>
      <p>The next move from here is usually expanding the read. Self-perception is one signal, your reports' is another, peers' is a third. Strong supervisors eventually triangulate all three.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}
