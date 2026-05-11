const KEY_PREFIX = 'bluechip-diagnostic';

function key(slug) {
  return `${KEY_PREFIX}:${slug}:state`;
}

export function saveState(slug, state) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, etc.); silently fail
  }
}

export function loadState(slug) {
  try {
    const raw = localStorage.getItem(key(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearState(slug) {
  try {
    localStorage.removeItem(key(slug));
  } catch {
    // ignore
  }
}
