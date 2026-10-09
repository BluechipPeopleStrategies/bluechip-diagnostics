import { layout, escapeHtml, conversationLink } from './_shared.js';

const STRONG_FOUNDATION_ARCHETYPES = new Set(['healthy-tension']);

export function buildWorkplaceReadEmail({ firstName, bandLabel, detail }) {
  const name = escapeHtml(firstName) || 'there';
  const archetypeId = bandLabel || '';
  const archetypeLabel = escapeHtml(detail || archetypeId) || 'your archetype';
  const tier = STRONG_FOUNDATION_ARCHETYPES.has(archetypeId) ? 'strong-foundation' : 'signal-rich';
  return tier === 'signal-rich'
    ? signalRich({ name, archetypeLabel })
    : strongFoundation({ name, archetypeLabel });
}

function signalRich({ name, archetypeLabel }) {
  return {
    subject: 'Your Workplace Read result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Workplace Read came in. You landed as ${archetypeLabel}, which is signal-rich. What you flagged matches patterns we see often.</p>
      <p>Naming the pattern is the first move, not the last. A lot of what makes a tough workplace tough is that the issues stay vague, personal, and hard to talk about. You now have language for them. That's leverage you didn't have an hour ago.</p>
      <p>If you want to talk through your specific situation, just reply to this email, or ${conversationLink()}. Confidential either way.</p>
      <p>Thomas</p>
    `),
  };
}

function strongFoundation({ name, archetypeLabel }) {
  return {
    subject: 'Your Workplace Read result',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick note: your Workplace Read came in. You landed at ${archetypeLabel}, which puts you in the healthy range. That's rarer than people realize.</p>
      <p>A healthy workplace isn't an accident. It's built and maintained by people who pay attention to it. The leverage from here is making the read habitual: re-run this on a cadence (quarterly, or at moments of change) and the trend line is where the actual insight lives.</p>
      <p>If a specific question is on your mind, just reply to this email, or ${conversationLink()}.</p>
      <p>Thomas</p>
    `),
  };
}
