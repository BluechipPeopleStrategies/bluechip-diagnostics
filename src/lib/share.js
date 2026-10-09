/**
 * Encode a result object into a URL-safe short string.
 * The shared URL contains only the result label (archetype id or score band), no PII, no answers.
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

// Turns a share-link code back into a readable result, but only when it names a real band or
// archetype of this diagnostic (the code is plain base64 and anyone can edit it). Anything else
// returns null and the page falls back to its generic text.
export function describeSharedResult(diagnostic, resultCode) {
  const decoded = decodeResult(resultCode || '');
  if (!decoded) return null;
  if (decoded.type === 'archetype') {
    const a = (diagnostic.archetypes || []).find((x) => x.id === decoded.label);
    return a ? a.name || a.label || null : null;
  }
  if (decoded.type === 'score') {
    const m = decoded.label.match(/^(.*?)\s*\((\d{1,3})\/100\)$/);
    if (!m) return null;
    const band = (diagnostic.scoring?.totalBands || []).find((b) => b.label === m[1]);
    const total = Number(m[2]);
    return band && total >= 0 && total <= 100 ? `${band.label} (${total}/100)` : null;
  }
  return null;
}
