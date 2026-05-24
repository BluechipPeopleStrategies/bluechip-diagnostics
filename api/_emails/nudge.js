import { layout, buildCalUrl, calLink } from './_shared.js';

const DIAGNOSTIC_TITLES = {
  'org-pulse': 'Org Pulse',
  'dqi': 'DQI',
  'supervisor-blind-spot': 'Supervisor Blind Spot',
  'workplace-read': 'Workplace Read',
};

export function buildNudgeEmail({ firstName, diagnosticId, bandLabel, total, detail }) {
  const name = firstName || 'there';
  const title = DIAGNOSTIC_TITLES[diagnosticId] || 'diagnostic';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total, detail });
  const cta = ctaUrl
    ? `<p>If you want to chat through it, ${calLink(ctaUrl)}. Free, 30 minutes, no pitch. Or if email is easier, hit reply and we'll figure it out that way.</p>`
    : `<p>If you want to chat through it, hit reply and we'll figure it out over email.</p>`;
  return {
    subject: `Following up on your ${title} result`,
    html: layout(`
      <p>Hi ${name},</p>
      <p>Quick follow-up. I sent your ${title} result the other day and noticed you haven't booked a Clarity Call yet. No pressure either way, just didn't want it to slip through.</p>
      <p>If you're on the fence, the call is free and there's no agenda beyond figuring out whether BlueChip is the right fit for you.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}
