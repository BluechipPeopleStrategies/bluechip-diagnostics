// Best-effort limiter for /api/submit and /api/lead. Vercel runs several warm instances and a cold
// start empties the counters, so this slows a loop against one instance and is not a hard
// guarantee. The durable limit is the Vercel firewall rule on POST /api/lead (5 per 10 minutes per
// IP, set Oct 9 2026; Hobby allows one rate-limit rule). Pure and clock-injectable.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LIMITS = { ip: 12, email: 3 };
// Leads text Thomas and may text or email the visitor, so they get their own, tighter budget.
const LEAD_LIMITS = { ip: 8, visitor: 2 };
const MAX_KEYS = 5000;
const hits = new Map();

function prune(now) {
  if (hits.size < MAX_KEYS) return;
  for (const [k, list] of hits) {
    if (!list.some(t => now - t < DAY)) hits.delete(k);
  }
  if (hits.size >= MAX_KEYS) hits.clear();
}

function take(key, limit, now, windowMs = HOUR) {
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
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

// True when this chat or contact-form lead may go ahead (per client, per hour).
export function allowLead({ ip }, now = Date.now()) {
  prune(now);
  return ip ? take(`l:${ip}`, LEAD_LIMITS.ip, now) : true;
}

// True when BlueChip may text or email this visitor's number or address again today. Stops the
// form being used to send our confirmation text or auto-reply to someone over and over.
export function allowVisitorSend(recipient, now = Date.now()) {
  const raw = String(recipient || '').trim().toLowerCase();
  // Same number however it is typed: compare phones on their last 10 digits.
  const key = raw.includes('@') ? raw : raw.replace(/\D/g, '').slice(-10);
  if (!key) return false;
  prune(now);
  return take(`v:${key}`, LEAD_LIMITS.visitor, now, DAY);
}

export function clientIp(req) {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req?.socket?.remoteAddress || '');
}

export function resetRateLimit() { hits.clear(); }
