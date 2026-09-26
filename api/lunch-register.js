import { isHoneypot, sanitizeRegistration, validateRegistration } from './_lib/lunch-helpers.js';
import { buildRegistrantEmail, buildNotificationEmail } from './_lib/lunch-email.js';
import { appendToGithubList } from './_lib/lunch-list.js';
import { SESSION } from '../src/data/lunchSession.js';
import { zonedTimeToUtc } from '../shared/tz.js';
import { buildIcs } from '../shared/ics.js';

const LIVE_URL = 'https://bluechip-people-strategies.com/lunch/live';

const ALLOWED_ORIGINS = ['https://bluechip-people-strategies.com', 'https://www.bluechip-people-strategies.com'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

// Best-effort, in-memory, per-IP rate limit. No existing rate-limit pattern was found anywhere
// in this codebase to reuse, and there's no shared store (Redis/KV) configured, so this is
// intentionally minimal: it resets on every cold start and isn't shared across concurrent
// serverless instances. It blunts a single abusive client hammering one warm instance; it is
// NOT a substitute for a real store if this endpoint ever needs stronger protection.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitHits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function sendResendEmail({ to, subject, html, replyTo, attachments }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.BLUECHIP_FROM_EMAIL || '').trim();
  if (!apiKey || !from || !to) {
    console.warn('lunch-register: email not configured');
    return false;
  }
  const body = { from, to, subject, html };
  if (replyTo) body.reply_to = replyTo;
  if (attachments) body.attachments = attachments;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error('lunch-register: Resend send failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lunch-register: Resend send error', err);
    return false;
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  const body = req.body || {};

  if (isHoneypot(body)) {
    // Probably a bot. Never bounce it back as an error and never silently drop it either --
    // return success so a real bot doesn't learn anything, but don't send any email for it.
    console.warn('lunch-register: honeypot triggered');
    return res.status(200).json({ ok: true });
  }

  const clean = sanitizeRegistration(body);
  const valid = validateRegistration(clean);
  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  const submittedAt = new Date().toISOString();
  const startUtc = zonedTimeToUtc(SESSION.localStart, SESSION.timeZone);

  const ics = buildIcs({
    uid: `lunch-${startUtc.getTime()}-${clean.email.replace(/[^a-z0-9]/gi, '')}@bluechip-people-strategies.com`,
    start: startUtc,
    durationMinutes: SESSION.durationMinutes,
    title: SESSION.title,
    description: `Join here: ${LIVE_URL}`,
    url: LIVE_URL,
    dtstamp: new Date(submittedAt),
  });
  const icsBase64 = Buffer.from(ics, 'utf8').toString('base64');

  const { subject: regSubject, html: regHtml } = buildRegistrantEmail({ reg: clean, session: SESSION, startUtc, liveUrl: LIVE_URL });
  const confirmationSent = await sendResendEmail({
    to: clean.email,
    subject: regSubject,
    html: regHtml,
    attachments: [{ filename: 'practical-ai-lunch-and-learn.ics', content: icsBase64 }],
  });

  const { subject: notifySubject, html: notifyHtml } = buildNotificationEmail({ reg: clean, session: SESSION, submittedAt });
  const notifyTo = (process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL || '').trim();
  const notificationSent = await sendResendEmail({ to: notifyTo, subject: notifySubject, html: notifyHtml, replyTo: clean.email });

  let listWritten = false;
  if (process.env.LUNCH_LIST_GITHUB_TOKEN && process.env.LUNCH_LIST_REPO) {
    const result = await appendToGithubList({
      timestamp: submittedAt,
      name: clean.name,
      email: clean.email,
      org: clean.org,
      topics: clean.topics.join('|'),
      comfortLevel: clean.comfortLevel ?? '',
      oneThing: clean.oneThing,
      nextSessionConsent: clean.nextSessionConsent,
      page: clean.page,
    });
    listWritten = !!result.ok;
  }

  // The notification email to Thomas is the primary capture (and the consent-proof record).
  // The registrant's own confirmation email failing is degraded (Thomas can follow up
  // manually) but shouldn't fail the request; neither notification nor list write succeeding
  // means the registration was never recorded anywhere, so that DOES fail the request.
  const captured = notificationSent || listWritten;

  return res.status(captured ? 200 : 502).json({ ok: captured, confirmationSent, notificationSent, listWritten });
}
