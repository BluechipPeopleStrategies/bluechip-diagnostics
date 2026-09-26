const CAPS = { name: 120, email: 200, org: 150, oneThing: 220, page: 100 };
const VALID_TOPIC_IDS = ['email', 'reports', 'minutes', 'staff', 'intake', 'privacy', 'other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The trap field is bc_hp_trap, the same non-autofillable name api/lead.js already uses.
// Never name a trap field "company" (or anything else a browser autofills): see
// C:/Users/mtsli/.claude/projects/.../memory/honeypot-field-name-autofill-dropped-leads.md.
export function isHoneypot(body) {
  return typeof body?.bc_hp_trap === 'string' && body.bc_hp_trap.trim().length > 0;
}

function clean(value, cap) {
  return (typeof value === 'string' ? value : '').trim().slice(0, cap);
}

export function sanitizeRegistration(body = {}) {
  const topics = Array.isArray(body.topics)
    ? [...new Set(body.topics.filter((t) => VALID_TOPIC_IDS.includes(t)))]
    : [];
  const comfortLevel = Number.isInteger(body.comfortLevel) && body.comfortLevel >= 1 && body.comfortLevel <= 5 ? body.comfortLevel : null;
  return {
    name: clean(body.name, CAPS.name),
    email: clean(body.email, CAPS.email),
    org: clean(body.org, CAPS.org),
    topics,
    comfortLevel,
    oneThing: clean(body.oneThing, CAPS.oneThing),
    nextSessionConsent: body.nextSessionConsent === true,
    page: clean(body.page, CAPS.page) || '/lunch',
  };
}

// Only name and a real-looking email are required. Everything else (org, topics, comfort,
// one thing, consent) is optional, matching the sketch's "skip to your details" fast path.
export function validateRegistration({ name, email }) {
  if (!name) return { ok: false, error: 'missing_name' };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  return { ok: true };
}
