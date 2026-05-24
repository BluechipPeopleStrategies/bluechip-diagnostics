import { layout, buildCalUrl, calLink } from './_shared.js';

export function buildCancellationFollowupEmail({ firstName, diagnosticId, bandLabel, total, detail }) {
  const name = firstName || 'there';
  const ctaUrl = buildCalUrl({ diagnosticId, bandLabel, total, detail });
  const cta = ctaUrl
    ? `<p>If you'd like to pick a new slot whenever it works better, ${calLink(ctaUrl)}. Or if email is easier, hit reply and we'll figure it out that way.</p>`
    : `<p>If you'd like to pick a new time, just hit reply and we'll figure it out over email.</p>`;
  return {
    subject: 'About your cancelled Clarity Call',
    html: layout(`
      <p>Hi ${name},</p>
      <p>Saw your Clarity Call got cancelled. No problem at all, schedule changes happen.</p>
      ${cta}
      <p>If now's not the right time, no follow-up needed from me.</p>
      <p>Thomas</p>
    `),
  };
}
