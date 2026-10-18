import { trackEvent } from '../lib/checkAnalytics.js';

const SIGNUP = 'https://stats.sender.net/forms/b68O7R/view?utm_source=ai_pulse&utm_medium=website&utm_campaign=bluechip_updates&utm_content=result';

export default function PulseNewsletterInvite() {
  return <section className="pulse-panel" aria-labelledby="pulse-newsletter-title">
    <h2 id="pulse-newsletter-title">Stay in the loop with BlueChip</h2>
    <p>Get twice-monthly emails with practical HR, leadership and AI insights, useful resources, and BlueChip news.</p>
    <div className="pulse-actions"><a className="pulse-button" href={SIGNUP} target="_blank" rel="noopener noreferrer" title="Opens the signup form in a new tab" onClick={() => trackEvent('newsletter_signup_opened', { source: 'ai_pulse', placement: 'result' })}>Sign up for BlueChip Updates →</a></div>
    <p className="pulse-small">Optional and free. Unsubscribe at any time. Your snapshot stays here.</p>
  </section>;
}
