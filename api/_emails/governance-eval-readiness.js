import { layout, escapeHtml, scoreText, conversationLink } from './_shared.js';

const SIGNAL_RICH_BANDS = new Set(['Exposure showing', 'Goodwill dependent']);

export function buildGovernanceEvalReadinessEmail({ firstName, bandLabel, total, detail }) {
  const name = escapeHtml(firstName) || 'there';
  const tier = SIGNAL_RICH_BANDS.has(bandLabel) ? 'signal-rich' : 'strong-foundation';
  const result = scoreText({ bandLabel, total });
  return tier === 'signal-rich'
    ? signalRich({ name, result, detail: escapeHtml(detail) })
    : strongFoundation({ name, result });
}

function signalRich({ name, result, detail }) {
  const detailSentence = detail
    ? ` The dimension that flagged most clearly was ${detail}.`
    : '';
  return {
    subject: 'Your Governance Health Check result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Governance Health Check result came in at ${result}.${detailSentence} That is a common read; most boards inherit their evaluation process rather than design it.</p>
      <p>The useful part is that the exposure is specific, not general. Boards that evaluate their senior leader well tend to have three things in place: a structured process, evidence alongside impressions, and a way to be fully honest in the room. The dimensions that flagged for you show which of those to build first, and structure is buildable.</p>
      <p>If you want to talk it through, just reply to this email, or ${conversationLink()}.</p>
      <p>Thomas</p>
    `),
  };
}

function strongFoundation({ name, result }) {
  return {
    subject: 'Your Governance Health Check result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Governance Health Check result came in at ${result}. That is a stronger evaluation practice than many boards ever build.</p>
      <p>The work from here is usually protection rather than repair: keeping the process intact through board turnover, and sharpening the one dimension that scored lowest so the result keeps standing up to scrutiny. Some boards at this stage add an outside facilitator for rigor; others genuinely do not need one. Both are fine answers.</p>
      <p>If you want a second set of eyes on it, just reply to this email, or ${conversationLink()}.</p>
      <p>Thomas</p>
    `),
  };
}
