import { layout, buildCalUrl, calLink } from './_shared.js';

const SIGNAL_RICH_BANDS = new Set(['Exposure showing', 'Goodwill dependent']);

export function buildGovernanceEvalReadinessEmail({
  firstName,
  bandLabel,
  total,
  detail,
  diagnosticId = 'governance-eval-readiness',
}) {
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
    subject: 'Your Governance Evaluation Readiness result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Governance Evaluation Readiness result came in at ${bandLabel} (${total}/100).${detailSentence} That is a common read; most boards inherit their evaluation process rather than design it.</p>
      <p>The useful part is that the exposure is specific, not general. Boards that evaluate their senior leader well tend to have three things in place: a structured process, evidence alongside impressions, and a way to be fully honest in the room. The dimensions that flagged for you show which of those to build first, and structure is buildable.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}

function strongFoundation({ name, bandLabel, total, ctaUrl }) {
  const cta = ctaUrl
    ? `<p>If you want a second set of eyes on it, ${calLink(ctaUrl)}. Free, 30 minutes. Or just reply.</p>`
    : `<p>If you want to talk it through, just reply and we'll find a time.</p>`;
  return {
    subject: 'Your Governance Evaluation Readiness result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Governance Evaluation Readiness result came in at ${bandLabel} (${total}/100). That is a stronger evaluation practice than many boards ever build.</p>
      <p>The work from here is usually protection rather than repair: keeping the process intact through board turnover, and sharpening the one dimension that scored lowest so the result keeps standing up to scrutiny. Some boards at this stage add an outside facilitator for rigor; others genuinely do not need one. Both are fine answers.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}
