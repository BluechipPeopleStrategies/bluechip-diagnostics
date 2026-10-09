// Funnel events for the free AI Pulse, so drop-off can be read per question.
// Only structural facts leave the page (question id and number, step, counts). Never answer
// values: the check asks about sensitive information and nothing the visitor chose is sent.
// Each event goes to PostHog and to Google Analytics (GA4, the same property as the main site,
// so a visit that starts on the site and continues here reads as one journey).
// Safe when either is absent (tests, ad blockers): it simply does nothing.
export function trackEvent(event, props = {}) {
  try {
    if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, props);
    }
  } catch { /* analytics must never break the check */ }
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, props);
    }
  } catch { /* analytics must never break the check */ }
}

export function trackCheck(event, props = {}) {
  trackEvent(event, props);
}
