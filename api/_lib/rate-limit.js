// Best-effort limiter for /api/submit. Vercel runs several warm instances and a cold start empties
// the counters, so this slows a loop against one instance and is not a hard guarantee; a durable
// limit (Vercel firewall rule or a KV store) would be the real fix. Pure and clock-injectable.
const WINDOW_MS = 60 * 60 * 1000;
const LIMITS = { ip: 12, email: 3 };
const MAX_KEYS = 5000;
const hits = new Map();

function prune(now) {
  if (hits.size < MAX_KEYS) return;
  for (const [k, list] of hits) {
    if (!list.some(t => now - t < WINDOW_MS)) hits.delete(k);
  }
  if (hits.size >= MAX_KEYS) hits.clear();
}

function take(key, limit, now) {
  const list = (hits.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= limit) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  return true;
}

// True when this request may go ahead. `ip` may be empty (then only the per-address limit applies).
export function allowSubmit({ ip, email }, now = Date.now()) {
  prune(now);
  const okEmail = take(`e:${String(email).toLowerCase()}`, LIMITS.email, now);
  const okIp = ip ? take(`i:${ip}`, LIMITS.ip, now) : true;
  return okEmail && okIp;
}

export function clientIp(req) {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req?.socket?.remoteAddress || '');
}

export function resetRateLimit() { hits.clear(); }
