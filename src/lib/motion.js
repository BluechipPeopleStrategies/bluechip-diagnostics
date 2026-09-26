// Small motion helpers shared by the plan page and the site header.

export function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch { return false; }
}

// Clicking the nav item for the page you're already on used to do nothing (punch list item 42).
// It now scrolls back to the top: smoothly, or as a jump under prefers-reduced-motion. Inside the
// Squarespace iframe the app's own window never scrolls (the frame is sized to its content), so
// scrollIntoView is used there instead, which also scrolls the parent page to the frame's top.
export function scrollPageToTop() {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  const framed = typeof window !== 'undefined' && window.parent !== window;
  if (framed && document.body && document.body.scrollIntoView) {
    document.body.scrollIntoView({ behavior, block: 'start' });
  } else if (typeof window.scrollTo === 'function') {
    try { window.scrollTo({ top: 0, behavior }); } catch { /* jsdom: not implemented */ }
  }
}

