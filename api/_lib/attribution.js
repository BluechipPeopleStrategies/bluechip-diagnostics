// Lead-source attribution (2026-10-09): where an inquiry came from.
//
// The browser sends two optional things with a lead: `attribution` ({ first, last }, built by
// public/widget.js or src/lib/attribution.js) and `heard_about` (the visitor's own answer to
// "how did you hear about us?"). Both are untrusted. Everything here narrows them to a small,
// known shape before they reach the notification email to Thomas: unknown keys are dropped,
// every value is a capped string, and `heard_about` must be one of the allowlisted slugs.
// They are never put in an email to the visitor.

export const HEARD_ABOUT = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
  google: 'Google search',
  ai_assistant: 'ChatGPT or another AI',
  referral: 'Someone referred me',
  email: 'An email from BlueChip',
  event: 'An event or talk',
  other: 'Other',
};

// Per-key caps. The first four are campaign tags (lowercase, [a-z0-9._-]); referrer is a host;
// landing is a path; date is YYYY-MM-DD.
export const TOUCH_CAPS = { source: 60, medium: 60, campaign: 60, content: 60, referrer: 100, landing: 100, date: 10 };
const TOUCH_KEYS = Object.keys(TOUCH_CAPS);
const TAG_KEYS = ['source', 'medium', 'campaign', 'content'];

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function cleanValue(key, value) {
  if (typeof value !== 'string') return '';
  let v = value.trim();
  if (TAG_KEYS.includes(key)) v = v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '');
  else if (key === 'referrer') v = v.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  else if (key === 'landing') v = v.replace(/[^!-~]/g, '').replace(/[<>"'`\\]/g, '');
  else if (key === 'date') v = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
  return v.slice(0, TOUCH_CAPS[key]);
}

// One touch: only the known keys, strings only, capped. Returns null when nothing usable is left.
export function sanitizeTouch(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  for (const key of TOUCH_KEYS) {
    if (!own(raw, key)) continue;
    const v = cleanValue(key, raw[key]);
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : null;
}

// { first, last } -> the same shape with each touch sanitized; null when neither survives.
export function sanitizeAttribution(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  const first = own(raw, 'first') ? sanitizeTouch(raw.first) : null;
  const last = own(raw, 'last') ? sanitizeTouch(raw.last) : null;
  if (first) out.first = first;
  if (last) out.last = last;
  return out.first || out.last ? out : null;
}

// The allowlisted slug, or '' for anything else.
export function sanitizeHeardAbout(raw) {
  if (typeof raw !== 'string') return '';
  const slug = raw.trim().toLowerCase();
  return own(HEARD_ABOUT, slug) ? slug : '';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  if (!m) return '';
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}` : '';
}

// "tiktok / bio / ai-news-daily (Oct 9, landed on /)". Plain text, not escaped.
export function describeTouch(touch) {
  if (!touch) return '';
  const tags = TAG_KEYS.map((k) => touch[k]).filter(Boolean);
  let head = tags.join(' / ');
  if (!touch.source && touch.referrer) head = head ? `${touch.referrer} (referrer) / ${tags.join(' / ')}` : `${touch.referrer} (referrer)`;
  if (!head) head = 'unknown';
  const when = shortDate(touch.date);
  const detail = [when, touch.landing ? `landed on ${touch.landing}` : ''].filter(Boolean).join(', ');
  return detail ? `${head} (${detail})` : head;
}

// Rows for the notification email: [label, text]. Empty when there is nothing to show.
export function attributionRows({ attribution, heardAbout } = {}) {
  const rows = [];
  if (attribution && attribution.first) rows.push(['First visit', describeTouch(attribution.first)]);
  if (attribution && attribution.last) rows.push(['This visit', describeTouch(attribution.last)]);
  if (heardAbout && own(HEARD_ABOUT, heardAbout)) rows.push(['They said', HEARD_ABOUT[heardAbout]]);
  return rows;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The "Where they came from" block for Thomas's notification email ('' when there is nothing).
// Inputs are re-sanitized here, so a caller that forgot to is still safe, and every value is
// HTML-escaped.
export function buildAttributionBlockHtml({ attribution, heardAbout } = {}) {
  const rows = attributionRows({
    attribution: sanitizeAttribution(attribution),
    heardAbout: sanitizeHeardAbout(heardAbout),
  });
  if (!rows.length) return '';
  const body = rows
    .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top;padding:2px 12px 2px 0"><strong>${esc(k)}:</strong></td><td style="padding:2px 0">${esc(v)}</td></tr>`)
    .join('');
  return `<p style="margin:20px 0 4px"><strong>Where they came from</strong></p><table cellpadding="0" style="border-collapse:collapse;font-size:15px">${body}</table>`;
}

// Extra keys for the machine-readable Lead-Data block (keys must be lowercase letters and
// underscores). Undefined values are skipped by buildLeadDataBlock.
export function attributionLeadData({ attribution, heardAbout } = {}) {
  const a = sanitizeAttribution(attribution);
  const h = sanitizeHeardAbout(heardAbout);
  return {
    first_visit: a && a.first ? describeTouch(a.first) : undefined,
    last_visit: a && a.last ? describeTouch(a.last) : undefined,
    heard_about: h || undefined,
  };
}
