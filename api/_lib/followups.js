/* global process */
// Pending follow-up emails, found and cancelled through Resend alone (2026-09-26).
//
// Before PR #56 the 24h nudge's Resend id lived in the lead's Notion row, and the Cal.com
// webhook read it back to cancel the nudge when the lead booked. Notion is legacy and
// read-only now, so the webhook finds pending follow-ups directly in Resend instead
// (Thomas, 2026-09-26: "Keep it, cancel by email address").
//
// Resend's List Emails endpoint (GET https://api.resend.com/emails, docs:
// https://resend.com/docs/api-reference/emails/list-emails) has no recipient or status
// filter: it pages through every email the team sent (limit <= 100, cursor `after`), each
// with `to`, `from`, `subject`, `created_at`, `last_event` and `scheduled_at`. A scheduled
// email that has not gone out yet has `last_event: "scheduled"`
// (https://resend.com/docs/dashboard/emails/manage-emails). So we page back through the
// window in which a still-pending follow-up could have been created and filter here:
//   - the 24h nudge is created at submit time, so a pending one is < 24h old;
//   - the +48h cancellation follow-up is < 48h old.
// LOOKBACK_HOURS covers both with margin. BlueChip sends a handful of emails a day, so this
// is one or two requests; MAX_PAGES caps the worst case (Resend's default rate limit is
// 10 requests/second per team).
//
// Only emails that are ALL of: still scheduled, addressed to exactly this recipient, from
// BLUECHIP_FROM_EMAIL, and carrying one of the two follow-up subjects are ever touched.
// Cancelling needs nothing but the booker's address, so nothing has to be carried through
// the booking link.

import { NUDGE_SUBJECT_RE } from '../_emails/nudge.js';
// Subject of the retired +48h cancelled-booking follow-up. Nothing schedules it any more, but one
// already queued must still be found and cancelled.
export const CANCEL_FOLLOWUP_SUBJECT = 'About your cancelled Clarity Call';

export const LOOKBACK_HOURS = 50;
export const MAX_PAGES = 10;
const PAGE_SIZE = 100;
const RESEND_EMAILS = 'https://api.resend.com/emails';

export function isFollowupSubject(subject) {
  const s = String(subject || '');
  return s === CANCEL_FOLLOWUP_SUBJECT || NUDGE_SUBJECT_RE.test(s);
}

// "Name <addr@x>" or "addr@x" -> "addr@x" (lower-cased).
export function bareAddress(value) {
  const s = String(value || '').trim();
  const m = s.match(/<([^<>]+)>\s*$/);
  return (m ? m[1] : s).trim().toLowerCase();
}

// Resend returns e.g. "2026-04-03 22:13:42.674981+00"; normalise to ISO before parsing.
function parseCreatedAt(value) {
  if (!value) return NaN;
  const iso = String(value).trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  return Date.parse(iso);
}

/**
 * Every still-scheduled BlueChip follow-up addressed to `email`.
 * Returns { emails, complete }: `complete` is false when a Resend request failed or the page
 * cap was hit before the lookback window was exhausted, so callers can log it.
 */
export async function findPendingFollowups(email, { now = Date.now(), lookbackHours = LOOKBACK_HOURS, maxPages = MAX_PAGES } = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bareAddress(process.env.BLUECHIP_FROM_EMAIL);
  const target = String(email || '').trim().toLowerCase();
  if (!apiKey || !from || !target) return { emails: [], complete: false };

  const cutoff = now - lookbackHours * 60 * 60 * 1000;
  const found = [];
  let after = null;
  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(RESEND_EMAILS);
    url.searchParams.set('limit', String(PAGE_SIZE));
    if (after) url.searchParams.set('after', after);
    let data;
    try {
      const res = await fetch(url.toString(), { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } });
      if (!res.ok) {
        console.warn('followups: Resend list failed', res.status, await res.text());
        return { emails: found, complete: false };
      }
      data = await res.json();
    } catch (err) {
      console.warn('followups: Resend list error', err);
      return { emails: found, complete: false };
    }
    const items = Array.isArray(data?.data) ? data.data : [];
    for (const item of items) {
      const to = (Array.isArray(item.to) ? item.to : [item.to]).map(bareAddress);
      if (
        item.last_event === 'scheduled' &&
        to.length === 1 && to[0] === target &&
        bareAddress(item.from) === from &&
        isFollowupSubject(item.subject) &&
        typeof item.id === 'string' && item.id
      ) {
        found.push(item);
      }
    }
    if (!data?.has_more || items.length === 0) return { emails: found, complete: true };
    // Newest first: once a whole page predates the window, nothing older can be pending.
    const times = items.map(i => parseCreatedAt(i.created_at));
    if (times.every(t => Number.isFinite(t) && t < cutoff)) return { emails: found, complete: true };
    after = items[items.length - 1].id;
  }
  console.warn('followups: hit the page cap before the lookback window ended');
  return { emails: found, complete: false };
}

export async function cancelResendEmail(emailId) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !emailId) return false;
  try {
    const res = await fetch(`${RESEND_EMAILS}/${encodeURIComponent(emailId)}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn('followups: Resend cancel failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('followups: Resend cancel error', err);
    return false;
  }
}

/** Cancel every pending BlueChip follow-up addressed to `email`. */
export async function cancelPendingFollowups(email, opts) {
  const { emails, complete } = await findPendingFollowups(email, opts);
  let cancelled = 0;
  for (const e of emails) {
    if (await cancelResendEmail(e.id)) cancelled += 1;
  }
  return { pendingFound: emails.length, cancelled, searchComplete: complete };
}
