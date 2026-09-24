import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia. Default every test to prefers-reduced-motion: reduce, so
// the loading screen, rolling numbers and chat typing cadence resolve on their fast, deterministic
// paths instead of racing real animation timers. Tests that specifically exercise the animated
// path (useRollingNumber's non-reduced branch) override this per-test with vi.stubGlobal.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: query.indexOf('prefers-reduced-motion') !== -1,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}
