import { layout, buildCalUrl, calLink } from './_shared.js';

const SIGNAL_RICH_BANDS = new Set(['Decision drag', 'Mixed signal']);

export function buildDqiEmail({ firstName, bandLabel, total, detail, diagnosticId = 'dqi' }) {
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
    subject: 'Your DQI result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note — your DQI came in. Result landed at ${bandLabel} (${total}/100), which is signal-rich.${detailSentence} That's the most useful kind of read this produces.</p>
      <p>Decision quality is the most under-developed leadership muscle — most leaders accumulate habits, good and bad, and the patterns DQI surfaces are usually the ones quietly hardening. You've now made yours legible. That's the work most leaders never do.</p>
      ${cta}
      <p>— Thomas</p>
    `),
  };
}

function strongFoundation({ name, bandLabel, total, ctaUrl }) {
  const cta = ctaUrl
    ? `<p>If a leadership transition or bigger mandate is landing in the next two quarters, ${calLink(ctaUrl)}. Free, 30 minutes. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply and we'll find a time.</p>`;
  return {
    subject: 'Your DQI result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note — your DQI came in. Result landed at ${bandLabel} (${total}/100), which puts you in the strong-foundation range. Decision habits like yours are rare.</p>
      <p>The blind spot at this level is usually team-wide, not personal — whether the people who report to you make decisions the same way, and whether the structures around them reward or punish it. That's the next frontier from where you sit.</p>
      ${cta}
      <p>— Thomas</p>
    `),
  };
}
