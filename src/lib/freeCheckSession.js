// Free AI check session memory (2026-09-25, punch-list item 59). Clicking the result's own
// "See how the plan works" link used to unmount the check and throw the answers away, so a
// visitor lost a three-minute result by following the page's primary next step. The state now
// lives in sessionStorage: it survives in-tab navigation and a reload, and clears when the tab
// closes, which keeps the "please don't enter confidential information" posture (nothing is
// kept across sessions, nothing leaves the browser). Every access is try/catch'd because
// storage can throw in private windows or when site data is blocked; the check then just
// behaves like it did before (in-memory only).
const STATE_KEY = 'bluechip:ai-opportunity-check:session';
const EMAIL_KEY = 'bluechip:ai-opportunity-check:email';
const VERSION = 1;

function store() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export function loadCheckSession() {
  try {
    const raw = store()?.getItem(STATE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!isPlainObject(s) || s.v !== VERSION || !isPlainObject(s.answers)) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveCheckSession(state) {
  try {
    store()?.setItem(STATE_KEY, JSON.stringify({ ...state, v: VERSION }));
  } catch {
    // storage full or blocked: the check still works in memory
  }
}

export function clearCheckSession() {
  try {
    store()?.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}

// The address a visitor already used for "Email my results" this session, so a second send is
// one click instead of re-typing it. Same tab-lifetime storage as the answers.
export function rememberedEmail() {
  try {
    return store()?.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function rememberEmail(email) {
  try {
    if (email) store()?.setItem(EMAIL_KEY, email);
    else store()?.removeItem(EMAIL_KEY);
  } catch {
    // ignore
  }
}
