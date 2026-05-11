/**
 * Encode a result object into a URL-safe short string.
 * The shared URL contains only the result label (archetype id or score band) — no PII, no answers.
 */
export function encodeResult(result) {
  const payload = `${result.type}:${result.label}`;
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeResult(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const decoded = atob(padded + padding);
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { type: decoded.slice(0, idx), label: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}
