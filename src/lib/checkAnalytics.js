// Funnel events for the free AI Opportunity Check, so drop-off can be read per question.
// Only structural facts leave the page (question id and number, step, counts). Never answer
// values: the check asks about sensitive information and nothing the visitor chose is sent.
// Safe when PostHog is absent (tests, ad blockers): it simply does nothing.
export function trackCheck(event, props = {}) {
  try {
    if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, props);
    }
  } catch { /* analytics must never break the check */ }
}
