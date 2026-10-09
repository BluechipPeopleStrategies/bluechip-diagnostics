/* global process, global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import leadHandler from '../api/lead.js';
import submitHandler from '../api/submit.js';
import { resetRateLimit } from '../api/_lib/rate-limit.js';
import {
  HEARD_ABOUT, sanitizeTouch, sanitizeAttribution, sanitizeHeardAbout, describeTouch,
  buildAttributionBlockHtml, attributionLeadData,
} from '../api/_lib/attribution.js';
import { sanitizeLead, buildChatLeadEmail } from '../api/_lib/lead-helpers.js';
import { buildLeadNotificationEmail } from '../api/_emails/lead-notification.js';
import { parseLeadDataBlock } from '../api/_emails/lead-data.js';

const TOUCH = { source: 'tiktok', medium: 'bio', campaign: 'ai-news-daily', content: '', referrer: '', landing: '/', date: '2026-10-09' };

describe('sanitizeTouch', () => {
  it('keeps only the known keys', () => {
    const out = sanitizeTouch({ ...TOUCH, evil: 'x', __proto__: { source: 'inherited' }, constructor: 'c' });
    expect(Object.keys(out).sort()).toEqual(['campaign', 'date', 'landing', 'medium', 'source']);
  });

  it('drops anything that is not a string', () => {
    const out = sanitizeTouch({ source: 5, medium: ['a'], campaign: { a: 1 }, content: null, referrer: true, landing: '/ok', date: 20261009 });
    expect(out).toEqual({ landing: '/ok' });
  });

  it('returns null for a non-object or when nothing usable is left', () => {
    for (const v of [null, undefined, 'tiktok', 7, ['a'], {}, { source: '' }, { evil: 'x' }]) expect(sanitizeTouch(v)).toBeNull();
  });

  it('lowercases tags and limits them to [a-z0-9._-]', () => {
    expect(sanitizeTouch({ source: ' TikTok<script> ', medium: 'Bio Link', campaign: 'a/b?c=d' })).toEqual({
      source: 'tiktokscript', medium: 'bio-link', campaign: 'abcd',
    });
  });

  it('caps tags at 60, referrer and landing at 100', () => {
    const out = sanitizeTouch({ source: 'a'.repeat(200), referrer: 'b'.repeat(200), landing: `/${'c'.repeat(200)}` });
    expect(out.source.length).toBe(60);
    expect(out.referrer.length).toBe(100);
    expect(out.landing.length).toBe(100);
  });

  it('keeps a referrer to a host (no path) and a landing without angle brackets, quotes or spaces', () => {
    const out = sanitizeTouch({ referrer: 'Google.com/search?q=1', landing: '/a b/<img src=x onerror=1>"' });
    expect(out.referrer).toBe('google.comsearchq1');
    expect(out.landing).toBe('/ab/imgsrc=xonerror=1');
  });

  it('only accepts a YYYY-MM-DD date', () => {
    expect(sanitizeTouch({ source: 'x', date: '2026-10-09' }).date).toBe('2026-10-09');
    expect(sanitizeTouch({ source: 'x', date: 'yesterday' })).toEqual({ source: 'x' });
  });
});

describe('sanitizeAttribution', () => {
  it('keeps first and last, drops every other key', () => {
    const out = sanitizeAttribution({ first: TOUCH, last: { source: 'linkedin' }, extra: { source: 'z' }, history: [1] });
    expect(Object.keys(out).sort()).toEqual(['first', 'last']);
    expect(out.last).toEqual({ source: 'linkedin' });
  });

  it('keeps just one touch if only one is usable', () => {
    expect(sanitizeAttribution({ first: TOUCH, last: 'junk' })).toEqual({ first: sanitizeTouch(TOUCH) });
  });

  it('returns null for junk', () => {
    for (const v of [null, undefined, 'x', 3, [], {}, { first: {}, last: [] }, { other: TOUCH }]) expect(sanitizeAttribution(v)).toBeNull();
  });
});

describe('sanitizeHeardAbout', () => {
  it('accepts exactly the allowlisted slugs', () => {
    expect(Object.keys(HEARD_ABOUT)).toEqual(['linkedin', 'instagram', 'tiktok', 'youtube', 'facebook', 'threads', 'google', 'ai_assistant', 'referral', 'email', 'event', 'other']);
    for (const slug of Object.keys(HEARD_ABOUT)) expect(sanitizeHeardAbout(slug)).toBe(slug);
  });

  it('drops everything else, including prototype names', () => {
    for (const v of ['', 'twitter', 'LinkedIn!', '__proto__', 'constructor', 'toString', null, 5, ['tiktok'], { a: 1 }]) expect(sanitizeHeardAbout(v)).toBe('');
  });

  it('is forgiving about case and spaces', () => {
    expect(sanitizeHeardAbout('  TikTok ')).toBe('tiktok');
  });
});

describe('describeTouch', () => {
  it('matches the example format', () => {
    expect(describeTouch(TOUCH)).toBe('tiktok / bio / ai-news-daily (Oct 9, landed on /)');
  });
  it('shows a referrer when there is no source', () => {
    expect(describeTouch({ referrer: 'google.com', landing: '/services', date: '2026-10-09' })).toBe('google.com (referrer) (Oct 9, landed on /services)');
  });
  it('handles direct and empty touches', () => {
    expect(describeTouch({ source: 'direct', landing: '/', date: '2026-01-02' })).toBe('direct (Jan 2, landed on /)');
    expect(describeTouch({ landing: '/x' })).toBe('unknown (landed on /x)');
    expect(describeTouch(null)).toBe('');
  });
});

describe('the "Where they came from" block', () => {
  it('shows first visit, this visit and what they said', () => {
    const html = buildAttributionBlockHtml({ attribution: { first: TOUCH, last: { source: 'linkedin', date: '2026-10-09', landing: '/services' } }, heardAbout: 'tiktok' });
    expect(html).toContain('Where they came from');
    expect(html).toContain('First visit:');
    expect(html).toContain('tiktok / bio / ai-news-daily (Oct 9, landed on /)');
    expect(html).toContain('This visit:');
    expect(html).toContain('linkedin (Oct 9, landed on /services)');
    expect(html).toContain('They said:');
    expect(html).toContain('>TikTok<');
  });

  it('is empty when there is nothing to show', () => {
    expect(buildAttributionBlockHtml({})).toBe('');
    expect(buildAttributionBlockHtml({ attribution: { evil: 1 }, heardAbout: 'nope' })).toBe('');
  });

  it('escapes HTML even if a caller passes unsanitized input', () => {
    const html = buildAttributionBlockHtml({ attribution: { first: { source: '<script>alert(1)</script>', landing: '/"><img src=x>' } } });
    expect(html).not.toMatch(/<script|<img/i);
  });

  it('shows the answer label for ChatGPT or another AI and An email from BlueChip', () => {
    expect(buildAttributionBlockHtml({ heardAbout: 'ai_assistant' })).toContain('ChatGPT or another AI');
    expect(buildAttributionBlockHtml({ heardAbout: 'email' })).toContain('An email from BlueChip');
  });

  it('gives the Lead-Data keys (lowercase letters and underscores only)', () => {
    const d = attributionLeadData({ attribution: { first: TOUCH }, heardAbout: 'youtube' });
    expect(d).toEqual({ first_visit: 'tiktok / bio / ai-news-daily (Oct 9, landed on /)', last_visit: undefined, heard_about: 'youtube' });
    for (const k of Object.keys(d)) expect(k).toMatch(/^[a-z_]+$/);
  });
});

describe('sanitizeLead', () => {
  it('is unchanged for a payload without the new fields', () => {
    expect(sanitizeLead({ name: 'Jo', need: 'n', contact: 'c' })).toEqual({ name: 'Jo', need: 'n', contact: 'c', email: '', source: '', consent: false });
  });
  it('adds sanitized attribution and heard_about', () => {
    const out = sanitizeLead({ name: 'Jo', need: 'n', contact: 'c', attribution: { first: TOUCH, x: 1 }, heard_about: 'linkedin' });
    expect(out.attribution).toEqual({ first: sanitizeTouch(TOUCH) });
    expect(out.heardAbout).toBe('linkedin');
  });
  it('drops a bad heard_about and junk attribution', () => {
    const out = sanitizeLead({ name: 'Jo', need: 'n', contact: 'c', attribution: 'x', heard_about: 'carrier pigeon' });
    expect(out).not.toHaveProperty('attribution');
    expect(out).not.toHaveProperty('heardAbout');
  });
});

describe('notification emails', () => {
  const lead = { name: 'Jo', need: 'The AI Handoff Plan', contact: '7805550100', email: 'jo@x.org', consent: true, attribution: { first: TOUCH, last: { source: 'linkedin' } }, heardAbout: 'tiktok' };

  it('chat lead email carries the block and the Lead-Data keys', () => {
    const { html } = buildChatLeadEmail(lead, { smsSent: true, submittedAt: '2026-10-09T18:00:00Z' });
    expect(html).toContain('Where they came from');
    expect(html).toContain('First visit:');
    const data = parseLeadDataBlock(html);
    expect(data.first_visit).toBe('tiktok / bio / ai-news-daily (Oct 9, landed on /)');
    expect(data.last_visit).toBe('linkedin');
    expect(data.heard_about).toBe('tiktok');
    expect(data.kind).toBe('chat');
  });

  it('chat lead email is unchanged without attribution', () => {
    const { html } = buildChatLeadEmail({ name: 'Jo', need: 'n', contact: 'c', consent: true }, {});
    expect(html).not.toContain('Where they came from');
    expect(parseLeadDataBlock(html)).not.toHaveProperty('first_visit');
  });

  it('diagnostic lead email carries the block and the Lead-Data keys', () => {
    const { html } = buildLeadNotificationEmail({ name: 'Jo', email: 'jo@x.org', diagnosticId: 'org-pulse', attribution: { first: TOUCH }, heardAbout: 'google' });
    expect(html).toContain('Where they came from');
    expect(html).toContain('Google search');
    const data = parseLeadDataBlock(html);
    expect(data.first_visit).toContain('tiktok');
    expect(data.heard_about).toBe('google');
  });

  it('escapes hostile attribution in both emails', () => {
    const evil = { first: { source: '<script>x</script>', landing: '/<img src=x onerror=1>' } };
    const a = buildChatLeadEmail({ ...lead, attribution: evil }, {}).html;
    const b = buildLeadNotificationEmail({ name: 'Jo', email: 'jo@x.org', attribution: evil }).html;
    for (const html of [a, b]) expect(html).not.toMatch(/<script>|<img/i);
  });
});

function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}
const resendSends = () => global.fetch.mock.calls.filter(c => String(c[0]).includes('resend')).map(c => JSON.parse(c[1].body));

describe('handlers', () => {
  beforeEach(() => {
    resetRateLimit();
    process.env.OPENPHONE_API_KEY = 'op_test';
    process.env.OPENPHONE_FROM = '+15875550000';
    process.env.LEAD_NOTIFY_PHONE = '+15877130585';
    process.env.RESEND_API_KEY = 're_test';
    process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
    process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({ id: 'x' }) }));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('/api/lead puts the block in the email to Thomas, not in the text to the visitor or to Thomas', async () => {
    const body = { name: 'Jo', need: 'The AI Handoff Plan', contact: '7805550100', email: 'jo@x.org', consent: true, attribution: { first: TOUCH, last: TOUCH, extra: 'x' }, heard_about: 'tiktok' };
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body }, res);
    expect(res.statusCode).toBe(200);
    const mails = resendSends();
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe('t@bc.ca');
    expect(mails[0].html).toContain('Where they came from');
    expect(mails[0].html).toContain('They said:');
    const texts = global.fetch.mock.calls.filter(c => String(c[0]).includes('openphone')).map(c => JSON.parse(c[1].body).content);
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) expect(t).not.toMatch(/tiktok|Where they came from/i);
  });

  it('/api/lead ignores junk and still works without the new fields', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'Jo', need: 'n', contact: '7805550100', attribution: 'oops', heard_about: 'nope' } }, res);
    expect(res.statusCode).toBe(200);
    expect(resendSends()[0].html).not.toContain('Where they came from');
  });

  it('/api/lead also records it on a spam-trap copy', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'x', need: 'y', contact: 'z', bc_hp_trap: 'bot', heard_about: 'linkedin' } }, res);
    expect(resendSends()[0].html).toContain('LinkedIn');
  });

  it('/api/submit shows it to Thomas only, never in the visitor result email', async () => {
    const res = mockRes();
    await submitHandler({
      method: 'POST', headers: {},
      body: { diagnosticId: 'org-pulse', email: 'pat@example.com', name: 'Pat', resultLabel: 'Mixed signal (62/100)', attribution: { first: TOUCH, last: TOUCH }, heard_about: 'threads' },
    }, res);
    expect(res.statusCode).toBe(200);
    const mails = resendSends();
    const visitor = mails.find(m => m.to === 'pat@example.com');
    const thomas = mails.find(m => m.to === 't@bc.ca');
    expect(thomas.html).toContain('Where they came from');
    expect(thomas.html).toContain('Threads');
    expect(visitor.html).not.toMatch(/Where they came from|tiktok|ai-news-daily|Threads/i);
    expect(parseLeadDataBlock(thomas.html).heard_about).toBe('threads');
  });

  it('/api/submit drops unknown keys and a non-allowlisted heard_about', async () => {
    const res = mockRes();
    await submitHandler({
      method: 'POST', headers: {},
      body: { diagnosticId: 'org-pulse', email: 'pat@example.com', name: 'Pat', resultLabel: 'Mixed signal (62/100)', attribution: { first: { source: 'x', sneaky: '<b>hi</b>' }, other: 1 }, heard_about: '<b>hi</b>' },
    }, res);
    const thomas = resendSends().find(m => m.to === 't@bc.ca');
    expect(thomas.html).not.toContain('<b>hi</b>');
    expect(thomas.html).not.toContain('They said');
    expect(thomas.html).toContain('First visit:');
  });

  it('/api/submit for the AI Pulse results email also tells Thomas, and not the visitor', async () => {
    const res = mockRes();
    await submitHandler({
      method: 'POST', headers: {},
      body: { diagnosticId: 'ai-opportunity-check', email: 'pat@example.com', include: 'estimate', answers: {}, attribution: { first: TOUCH }, heard_about: 'email' },
    }, res);
    expect(res.statusCode).toBe(200);
    const mails = resendSends();
    const thomas = mails.find(m => m.to === 't@bc.ca');
    const visitor = mails.find(m => m.to === 'pat@example.com');
    expect(thomas.html).toContain('First visit:');
    expect(thomas.html).toContain('An email from BlueChip');
    expect(visitor.html).not.toMatch(/Where they came from|ai-news-daily/i);
  });
});
