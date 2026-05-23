import { layout, buildCalUrl, calLink } from './_shared.js';

const SIGNAL_RICH_BANDS = new Set(['Pressure building', 'Mixed signal']);

export function buildOrgPulseEmail({ firstName, bandLabel, total, detail, diagnosticId = 'org-pulse' }) {
  const name = firstName || 'there';
  const tier = SIGNAL_RICH_BANDS.has(bandLabel) ? 'signal-rich' : 'strong-foundation';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total, detail });
  return tier === 'signal-rich'
    ? signalRich({ name, bandLabel, total, detail, ctaUrl })
    : strongFoundation({ name, bandLabel, total, ctaUrl });
}

function signalRich({ name, bandLabel, total, detail, ctaUrl }) {
  const detailSentence = detail
    ? ` The dimension that flagged most clearly was ${detail}.`
    : '';
  const cta = ctaUrl
    ? `<p>If you want to talk it through, ${calLink(ctaUrl)}. Free, 30 minutes, no pitch. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply to this email and we'll find a time.</p>`;
  return {
    subject: 'Your Org Pulse result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note — your Org Pulse came in. Result landed at ${bandLabel} (${total}/100), which is signal-rich.${detailSentence} That's the most useful kind of read this produces.</p>
      <p>The dimensions that flag here are where capability builds next. Surfacing them deliberately is the work most teams skip — and the teams that don't tend to come out of the next 12 months meaningfully stronger.</p>
      ${cta}
      <p>— Thomas</p>
    `),
  };
}

function strongFoundation({ name, bandLabel, total, ctaUrl }) {
  const cta = ctaUrl
    ? `<p>If you want to talk through what that could look like, ${calLink(ctaUrl)}. Free, 30 minutes. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply and we'll find a time.</p>`;
  return {
    subject: 'Your Org Pulse result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note — your Org Pulse came in. Result landed at ${bandLabel} (${total}/100), which is the strong-foundation range. Healthy reads across the dimensions.</p>
      <p>The orgs we see compound the most aren't the ones that hit "healthy" and coast — they're the ones that use a strong baseline to take on harder development work earlier than peers can. If a leadership transition, restructure, or major initiative is on your horizon in the next two quarters, that's exactly the kind of moment a strong foundation pays for itself.</p>
      ${cta}
      <p>— Thomas</p>
    `),
  };
}
