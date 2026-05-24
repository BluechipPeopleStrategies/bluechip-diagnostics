import { layout, buildCalUrl, calLink } from './_shared.js';

export function buildCancellationFollowupEmail({ firstName, diagnosticId, bandLabel, total, detail }) {
  const name = firstName || 'there';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total, detail });
  const cta = ctaUrl
    ? `<p>If you'd like to pick a new slot whenever it works better, ${calLink(ctaUrl)}. Or just reply and we'll find something.</p>`
    : `<p>If you'd like to pick a new time, just reply to this email and we'll find something.</p>`;
  return {
    subject: 'About your cancelled Clarity Call',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Saw your Clarity Call got cancelled. No problem at all, schedule changes happen.</p>
      <p>If now's not the right time, no follow-up needed from me.</p>
      ${cta}
      <p>Thomas</p>
    `),
  };
}
