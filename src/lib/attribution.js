// Lead-source attribution for the app's own domain (2026-10-09). Same logic and the same
// storage keys as public/widget.js (the app is a separate origin from the main site, so it
// has to capture its own): a first touch once per browser (localStorage `bc_first_touch`, kept
// 90 days) and a last touch per session (sessionStorage `bc_last_touch`). Campaign tags come
// from the utm_* query params, the referrer is the host only (empty for BlueChip's own sites),
// the landing page is the path only. Every storage access is wrapped; if storage is blocked
// the values still live in memory for this page. Sent to /api/submit as `attribution`.

export const FIRST_KEY = 'bc_first_touch';
export const LAST_KEY = 'bc_last_touch';
export const FIRST_DAYS = 90;
export const OWN_HOSTS = ['bluechip-people-strategies.com', 'bluechip-diagnostics.vercel.app'];
export const TOUCH_KEYS = ['source', 'medium', 'campaign', 'content', 'referrer', 'landing', 'date'];

const DAY_MS = 86400000;

export function cleanTag(v) {
  return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
}

function stripWww(h) {
  return String(h || '').toLowerCase().replace(/^www\./, '');
}

// Host of the referrer, or '' when there is none or it is one of our own sites.
export function referrerHost(referrer, hostname = '') {
  const m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?([^/?#:]+)/i.exec(referrer || '');
  if (!m) return '';
  const host = stripWww(m[1]).replace(/[^a-z0-9.-]/g, '');
  if (!host) return '';
  const own = OWN_HOSTS.concat([stripWww(hostname)]).filter(Boolean);
  if (own.some((h) => host === h || host.endsWith(`.${h}`))) return '';
  return host.slice(0, 100);
}

function localDate(now) {
  const d = new Date(now);
  const two = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

// Only the known keys, strings only.
export function stripTouch(t) {
  const out = {};
  for (const k of TOUCH_KEYS) out[k] = t && typeof t[k] === 'string' ? t[k] : '';
  return out;
}

// This page view as a touch, and whether it carries any new signal (a UTM or an outside referrer).
export function currentTouch({ search = '', referrer = '', hostname = '', pathname = '/', now = Date.now() } = {}) {
  let params;
  try { params = new URLSearchParams(search); } catch { params = new URLSearchParams(''); }
  const t = {
    source: cleanTag(params.get('utm_source')),
    medium: cleanTag(params.get('utm_medium')),
    campaign: cleanTag(params.get('utm_campaign')),
    content: cleanTag(params.get('utm_content')),
    referrer: referrerHost(referrer, hostname),
    landing: String(pathname || '/').slice(0, 100),
    date: localDate(now),
  };
  const known = !!(t.source || t.medium || t.campaign || t.content || t.referrer);
  if (!known) t.source = 'direct';
  return { touch: stripTouch(t), known };
}

function readJson(store, key) {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(store, key, value) {
  try { store.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep it in memory only */ }
}

function getStore(win, name) {
  try { return win[name]; } catch { return null; }
}

let memory = { first: null, last: null };

// Run once per page load (main.jsx). Returns { first, last }.
export function captureAttribution({ win = typeof window === 'undefined' ? null : window, now = Date.now() } = {}) {
  if (!win) return { first: stripTouch(null), last: stripTouch(null) };
  const loc = win.location || {};
  let referrer = '';
  try { referrer = (win.document && win.document.referrer) || ''; } catch { /* ignore */ }
  const cur = currentTouch({ search: loc.search || '', referrer, hostname: loc.hostname || '', pathname: loc.pathname || '/', now });

  const local = getStore(win, 'localStorage');
  const session = getStore(win, 'sessionStorage');

  const stored = local ? readJson(local, FIRST_KEY) : null;
  const fresh = !!(stored && stored.touch && typeof stored.ts === 'number' && now - stored.ts >= 0 && now - stored.ts <= FIRST_DAYS * DAY_MS);
  let first;
  if (fresh) {
    first = stripTouch(stored.touch);
  } else {
    first = cur.touch;
    if (local) writeJson(local, FIRST_KEY, { ts: now, touch: first });
  }

  const prev = session ? readJson(session, LAST_KEY) : null;
  let last;
  if (prev && prev.touch && !cur.known) {
    last = stripTouch(prev.touch); // same session and nothing new on this page: keep the earlier last touch
  } else {
    last = cur.touch;
    if (session) writeJson(session, LAST_KEY, { touch: last });
  }

  memory = { first, last };
  return { first: { ...first }, last: { ...last } };
}

// What the app sends with a lead. Safe to call before capture (returns empty touches).
export function getAttribution() {
  return { first: stripTouch(memory.first), last: stripTouch(memory.last) };
}

// For tests.
export function resetAttributionMemory() {
  memory = { first: null, last: null };
}
