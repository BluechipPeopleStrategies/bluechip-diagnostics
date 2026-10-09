import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { captureAttribution, getAttribution, resetAttributionMemory, currentTouch, referrerHost } from '../src/lib/attribution.js';

const script = readFileSync('public/widget.js', 'utf8');
const DAY = 86400000;
const NOW = new Date(2026, 9, 9, 12, 0, 0).getTime(); // Oct 9 2026, local noon

// ---- widget: runs the real public/widget.js in jsdom ----
function setReferrer(value) {
  Object.defineProperty(document, 'referrer', { configurable: true, get: () => value });
}
function loadWidget({ url = '/', referrer = '' } = {}) {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-bcw]').forEach(s => s.remove());
  delete window.__bcwLoaded;
  delete window.BlueChipAttribution;
  window.history.replaceState(null, '', url);
  setReferrer(referrer);
  window.eval(script);
  return window.BlueChipAttribution.get();
}

// ---- app lib: a fake window with Map-backed storage ----
function memStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
function fakeWin({ search = '', referrer = '', hostname = 'bluechip-diagnostics.vercel.app', pathname = '/', local, session } = {}) {
  return {
    location: { search, hostname, pathname },
    document: { referrer },
    localStorage: local || memStore(),
    sessionStorage: session || memStore(),
  };
}
// The app lib is handed the jsdom window's storage, so both implementations share state in a test.
function loadApp({ search = '', referrer = '', pathname = '/' } = {}) {
  const win = {
    location: { search, hostname: 'bluechip-diagnostics.vercel.app', pathname },
    document: { referrer },
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
  };
  return captureAttribution({ win, now: Date.now() });
}

// The same behaviour table runs against both implementations.
const IMPLEMENTATIONS = [
  ['widget.js', ({ url, referrer }) => loadWidget({ url, referrer })],
  ['src/lib/attribution.js', ({ url = '/', referrer = '' }) => {
    const [pathname, search = ''] = url.split('?');
    return loadApp({ pathname, search: search ? `?${search}` : '', referrer });
  }],
];

function newSession() {
  window.sessionStorage.clear();
  resetAttributionMemory();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetAttributionMemory();
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe.each(IMPLEMENTATIONS)('attribution capture: %s', (_name, load) => {
  it('records UTMs, lowercased and limited to [a-z0-9._-], each capped at 60 characters', () => {
    const { first } = load({ url: `/?utm_source=TikTok&utm_medium=Bio%20Link&utm_campaign=AI_News.Daily-1!&utm_content=${'x'.repeat(80)}` });
    expect(first.source).toBe('tiktok');
    expect(first.medium).toBe('bio-link');
    expect(first.campaign).toBe('ai_news.daily-1');
    expect(first.content).toBe('x'.repeat(60));
  });

  it('records the landing path only (no query), the date, and an empty referrer', () => {
    const { first } = load({ url: '/ai-handoff-plan?utm_source=linkedin&secret=1' });
    expect(first.landing).toBe('/ai-handoff-plan');
    expect(first.date).toBe('2026-10-09');
    expect(first.referrer).toBe('');
  });

  it('caps the landing path at 100 characters', () => {
    expect(load({ url: `/${'a'.repeat(150)}` }).first.landing.length).toBe(100);
  });

  it('keeps the host only of an outside referrer, never the path or query', () => {
    const { first } = load({ url: '/', referrer: 'https://www.google.com/search?q=bluechip+hr&token=abc' });
    expect(first.referrer).toBe('google.com');
    expect(first.source).toBe('');
  });

  it('keeps an app referrer such as an Android package name', () => {
    expect(load({ url: '/', referrer: 'android-app://com.linkedin.android/' }).first.referrer).toBe('com.linkedin.android');
  });

  it('ignores a referrer from the same site, a subdomain of it, or the app domain', () => {
    expect(load({ url: '/', referrer: 'https://www.bluechip-people-strategies.com/services' }).first.referrer).toBe('');
    window.localStorage.clear(); newSession();
    expect(load({ url: '/', referrer: 'https://edit.bluechip-people-strategies.com/x' }).first.referrer).toBe('');
    window.localStorage.clear(); newSession();
    expect(load({ url: '/', referrer: 'https://bluechip-diagnostics.vercel.app/ai-opportunity-check' }).first.referrer).toBe('');
  });

  it('does not treat a lookalike host as our own', () => {
    expect(load({ url: '/', referrer: 'https://evilbluechip-people-strategies.com/' }).first.referrer).toBe('evilbluechip-people-strategies.com');
  });

  it('says "direct" when there are no UTMs and no outside referrer', () => {
    const { first, last } = load({ url: '/', referrer: 'https://www.bluechip-people-strategies.com/' });
    expect(first.source).toBe('direct');
    expect(last.source).toBe('direct');
  });

  it('does not say "direct" when an outside referrer exists', () => {
    expect(load({ url: '/', referrer: 'https://news.ycombinator.com/' }).first.source).toBe('');
  });

  it('keeps the first touch for later visits, and takes a new last touch from a new session', () => {
    load({ url: '/?utm_source=tiktok&utm_medium=bio' });
    newSession();
    const second = load({ url: '/services?utm_source=linkedin' });
    expect(second.first.source).toBe('tiktok');
    expect(second.first.medium).toBe('bio');
    expect(second.last.source).toBe('linkedin');
    expect(second.last.landing).toBe('/services');
  });

  it('keeps the earlier last touch when a later page in the same session carries no new signal', () => {
    load({ url: '/?utm_source=instagram' });
    const next = load({ url: '/services', referrer: 'https://www.bluechip-people-strategies.com/' });
    expect(next.last.source).toBe('instagram');
    expect(next.last.landing).toBe('/');
  });

  it('replaces the last touch when the same session arrives with a new UTM', () => {
    load({ url: '/?utm_source=instagram' });
    expect(load({ url: '/?utm_source=threads' }).last.source).toBe('threads');
  });

  it('expires the first touch after 90 days and records a fresh one', () => {
    load({ url: '/?utm_source=tiktok' });
    vi.setSystemTime(NOW + 89 * DAY);
    newSession();
    expect(load({ url: '/?utm_source=google' }).first.source).toBe('tiktok');
    vi.setSystemTime(NOW + 91 * DAY);
    newSession();
    const later = load({ url: '/?utm_source=google' });
    expect(later.first.source).toBe('google');
    expect(later.first.date).toBe('2027-01-08');
  });

  it('survives corrupt stored values', () => {
    window.localStorage.setItem('bc_first_touch', '{not json');
    window.sessionStorage.setItem('bc_last_touch', '42');
    const { first, last } = load({ url: '/?utm_source=youtube' });
    expect(first.source).toBe('youtube');
    expect(last.source).toBe('youtube');
  });

  it('still works, from memory, when storage throws on every access', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const out = load({ url: '/?utm_source=facebook' });
    expect(out.first.source).toBe('facebook');
    expect(out.last.source).toBe('facebook');
  });

  it('hands out only the known string keys', () => {
    const out = load({ url: '/?utm_source=x' });
    expect(Object.keys(out.first).sort()).toEqual(['campaign', 'content', 'date', 'landing', 'medium', 'referrer', 'source']);
    expect(Object.values(out.first).every(v => typeof v === 'string')).toBe(true);
  });
});

describe('window.BlueChipAttribution', () => {
  it('exposes get() returning { first, last } copies', () => {
    loadWidget({ url: '/?utm_source=tiktok' });
    const a = window.BlueChipAttribution.get();
    a.first.source = 'tampered';
    expect(window.BlueChipAttribution.get().first.source).toBe('tiktok');
    expect(Object.keys(window.BlueChipAttribution)).toEqual(['get']);
  });

  it('stores the first touch under bc_first_touch and the last under bc_last_touch', () => {
    loadWidget({ url: '/?utm_source=tiktok' });
    expect(JSON.parse(window.localStorage.getItem('bc_first_touch')).touch.source).toBe('tiktok');
    expect(JSON.parse(window.sessionStorage.getItem('bc_last_touch')).touch.source).toBe('tiktok');
  });
});

describe('src/lib/attribution.js specifics', () => {
  it('shares storage keys and shape with the widget, so either reads the other', () => {
    loadWidget({ url: '/?utm_source=threads' });
    const win = fakeWin({ local: memStore({ bc_first_touch: window.localStorage.getItem('bc_first_touch') }) });
    expect(captureAttribution({ win, now: Date.now() }).first.source).toBe('threads');
  });

  it('getAttribution returns empty touches before capture and the captured ones after', () => {
    expect(getAttribution().first.source).toBe('');
    loadApp({ search: '?utm_source=instagram' });
    expect(getAttribution().first.source).toBe('instagram');
  });

  it('copes with no window at all', () => {
    expect(captureAttribution({ win: null }).first.source).toBe('');
  });

  it('helpers: referrerHost and currentTouch', () => {
    expect(referrerHost('not a url', 'x.com')).toBe('');
    expect(referrerHost('https://x.com/a', 'x.com')).toBe('');
    expect(currentTouch({ search: '?utm_source=a', now: NOW }).known).toBe(true);
    expect(currentTouch({ now: NOW })).toMatchObject({ known: false, touch: { source: 'direct' } });
  });
});
