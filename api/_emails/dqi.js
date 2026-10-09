import { layout, escapeHtml, scoreText, conversationLink } from './_shared.js';

const SIGNAL_RICH_BANDS = new Set(['Decision drag', 'Mixed signal']);

export function buildDqiEmail({ firstName, bandLabel, total, detail }) {
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
    subject: 'Your DQI result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your DQI came in. Result landed at ${result}, which is signal-rich.${detailSentence} That's the most useful kind of read this produces.</p>
      <p>Decision quality is the most under-developed leadership muscle. Most leaders accumulate habits, good and bad, and the patterns DQI surfaces are usually the ones quietly hardening. You've now made yours legible. That's the work most leaders never do.</p>
      <p>If you want to talk it through, just reply to this email, or ${conversationLink()}.</p>
      <p>Thomas</p>
    `),
  };
}

function strongFoundation({ name, result }) {
  return {
    subject: 'Your DQI result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your DQI came in. Result landed at ${result}, which puts you in the strong-foundation range. Decision habits like yours are rare.</p>
      <p>The blind spot at this level is usually team-wide, not personal: whether the people who report to you make decisions the same way, and whether the structures around them reward or punish it. That's the next frontier from where you sit.</p>
      <p>If a leadership transition or bigger mandate is landing in the next two quarters, reply to this email or ${conversationLink()}.</p>
      <p>Thomas</p>
    `),
  };
}
