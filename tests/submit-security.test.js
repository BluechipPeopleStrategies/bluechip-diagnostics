/* global process, global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/submit.js';
import { DIAGNOSTIC_RESULTS } from '../api/_lib/diagnostic-allowlist.js';
import { cleanRecipient } from '../api/_lib/email-address.js';
import { allowSubmit, resetRateLimit } from '../api/_lib/rate-limit.js';
import { buildOrgPulseEmail } from '../api/_emails/org-pulse.js';
import { buildDqiEmail } from '../api/_emails/dqi.js';
import { buildGovernanceEvalReadinessEmail } from '../api/_emails/governance-eval-readiness.js';
import { buildSupervisorBlindSpotEmail } from '../api/_emails/supervisor-blind-spot.js';
import { buildWorkplaceReadEmail } from '../api/_emails/workplace-read.js';
import * as nudge from '../api/_emails/nudge.js';
import { isFollowupSubject } from '../api/_lib/followups.js';
import orgPulse from '../src/data/org-pulse.json';
import dqi from '../src/data/dqi.json';
import governance from '../src/data/governance-eval-readiness.json';
import supervisor from '../src/data/supervisor-blind-spot.json';
import workplace from '../src/data/workplace-read.json';

// Every network call is a vi.fn: nothing here reaches Resend.
function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}
const sends = () => global.fetch.mock.calls.filter(c => String(c[0]).includes('resend')).map(c => JSON.parse(c[1].body));
const post = (body, headers = {}) => { const res = mockRes(); return handler({ method: 'POST', headers, body }, res).then(() => res); };

beforeEach(() => {
  resetRateLimit();
  process.env.RESEND_API_KEY = 're_test';
  process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
  process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({ id: 'x' }) }));
});
afterEach(() => { vi.restoreAllMocks(); });

const GOOD = { diagnosticId: 'org-pulse', email: 'pat@example.com', name: 'Pat Doe', resultLabel: 'Mixed signal (62/100)', detail: 'Accountability' };

describe('quiz result email: the visitor cannot put their own markup or links in it', () => {
  it('escapes and drops hostile name, result and detail text', async () => {
    const res = await post({
      ...GOOD,
      name: '<a href="https://evil.example/pay">Click</a>',
      resultLabel: '<img src=x onerror=alert(1)> (62/100)',
      detail: '<script>steal()</script> https://evil.example',
    });
    expect(res.statusCode).toBe(200);
    const mail = sends().find(s => s.to === 'pat@example.com');
    expect(mail.html).not.toMatch(/evil\.example|<script|<img|onerror|<a href="https:\/\/evil/i);
    // The only link in the email is the BlueChip chat link.
    const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    expect(links).toEqual(['https://www.bluechip-people-strategies.com/?utm_source=diagnostic-email#chat']);
  });

  it('keeps a real first name, band and dimension', async () => {
    await post({ ...GOOD, name: "D'Arcy-Smith Lee" });
    const mail = sends().find(s => s.to === 'pat@example.com');
    expect(mail.html).toContain("Hi D&#39;Arcy-Smith,");
    expect(mail.html).toContain('Mixed signal (62/100)');
    expect(mail.html).toContain('The dimension that flagged most clearly was Accountability.');
  });

  it('escapes at the template as well, whatever the caller passes', () => {
    const bad = { firstName: '<b>x</b>', bandLabel: 'Mixed signal', total: 50, detail: '"><script>1</script>' };
    for (const build of [buildOrgPulseEmail, buildDqiEmail, buildGovernanceEvalReadinessEmail]) {
      const { html } = build(bad);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<b>x</b>');
    }
    for (const build of [buildSupervisorBlindSpotEmail, buildWorkplaceReadEmail]) {
      const { html } = build({ firstName: '<b>x</b>', bandLabel: 'drift', detail: '<i>y</i>' });
      expect(html).not.toContain('<i>y</i>');
      expect(html).not.toContain('<b>x</b>');
    }
  });

  it('never prints "null" or "undefined" when the result text is missing or unknown', async () => {
    await post({ diagnosticId: 'dqi', email: 'pat@example.com', resultLabel: 'Not a real band (999/100)' });
    const mail = sends().find(s => s.to === 'pat@example.com');
    expect(mail.html).not.toMatch(/null|undefined|NaN/);
  });
});

describe('quiz result email: who can be mailed', () => {
  it.each([
    ['a list', 'a@x.com,b@y.com'],
    ['a semicolon list', 'a@x.com;b@y.com'],
    ['a display name', 'Boss <a@x.com>'],
    ['a quoted local part', '"a b"@x.com'],
    ['no domain dot', 'a@localhost'],
    ['whitespace inside', 'a b@x.com'],
    ['nothing', ''],
  ])('refuses %s and sends nothing', async (_label, email) => {
    const res = await post({ ...GOOD, email });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_email' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses an unknown diagnostic id', async () => {
    const res = await post({ ...GOOD, diagnosticId: 'something-else' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'unknown_diagnostic' });
    expect(global.fetch).not.toHaveBeenCalled();
    const proto = await post({ ...GOOD, diagnosticId: '__proto__' });
    expect(proto.statusCode).toBe(400);
  });

  it('addresses the visitor email to exactly the one address given, and the lead note to Thomas only', async () => {
    await post({ ...GOOD, email: '  Pat@Example.com ' });
    const mails = sends();
    expect(mails).toHaveLength(2);
    expect(mails.map(m => m.to).sort()).toEqual(['Pat@Example.com', 't@bc.ca']);
    expect(mails.every(m => typeof m.to === 'string')).toBe(true);
  });

  it('a filled spam trap mails nobody but Thomas', async () => {
    const res = await post({ ...GOOD, bc_hp_trap: 'http://spam.example' });
    expect(res.statusCode).toBe(200);
    const mails = sends();
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe('t@bc.ca');
    expect(mails[0].subject).toMatch(/^\[Check: spam trap\]/);
  });

  it('limits repeat sends to one address (best effort) and sends nothing when limited', async () => {
    for (let i = 0; i < 3; i += 1) expect((await post(GOOD)).statusCode).toBe(200);
    global.fetch.mockClear();
    const res = await post(GOOD);
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: 'rate_limited' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('limits one client address across many recipients', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' };
    for (let i = 0; i < 12; i += 1) expect((await post({ ...GOOD, email: `p${i}@example.com` }, headers)).statusCode).toBe(200);
    expect((await post({ ...GOOD, email: 'p99@example.com' }, headers)).statusCode).toBe(429);
  });

  it('the limiter frees up after its window', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i += 1) expect(allowSubmit({ ip: '', email: 'a@x.com' }, t0)).toBe(true);
    expect(allowSubmit({ ip: '', email: 'a@x.com' }, t0 + 1000)).toBe(false);
    expect(allowSubmit({ ip: '', email: 'a@x.com' }, t0 + 61 * 60 * 1000)).toBe(true);
  });

  it('cleanRecipient trims and accepts a normal address', () => {
    expect(cleanRecipient(' pat@example.com ')).toBe('pat@example.com');
    expect(cleanRecipient(null)).toBe('');
    expect(cleanRecipient(`${'a'.repeat(250)}@x.com`)).toBe('');
  });
});

describe('the 24-hour nudge and the Clarity Call are retired', () => {
  it('schedules no follow-up email and reports nudgeScheduled false', async () => {
    const res = await post(GOOD);
    expect(res.body).toEqual({ ok: true, emailSent: true, nudgeScheduled: false, leadNotificationSent: true });
    expect(sends().some(s => s.scheduled_at)).toBe(false);
  });

  it('keeps only what is needed to cancel a nudge already queued', () => {
    expect(nudge.buildNudgeEmail).toBeUndefined();
    expect(isFollowupSubject('Following up on your Org Pulse result')).toBe(true);
    expect(isFollowupSubject('About your cancelled Clarity Call')).toBe(true);
    expect(isFollowupSubject('Your Org Pulse result')).toBe(false);
  });

  it('no result email mentions the Clarity Call, a price, a booking link or an em dash, and all point to the chat', () => {
    const emails = [
      buildOrgPulseEmail({ firstName: 'Pat', bandLabel: 'Pressure building', total: 30, detail: 'Accountability' }),
      buildOrgPulseEmail({ firstName: 'Pat', bandLabel: 'Healthy', total: 90, detail: '' }),
      buildDqiEmail({ firstName: 'Pat', bandLabel: 'Decision drag', total: 30, detail: 'Speed' }),
      buildDqiEmail({ firstName: 'Pat', bandLabel: 'Calibrated', total: 90, detail: '' }),
      buildGovernanceEvalReadinessEmail({ firstName: 'Pat', bandLabel: 'Exposure showing', total: 30, detail: 'Candor & Independence' }),
      buildGovernanceEvalReadinessEmail({ firstName: 'Pat', bandLabel: 'Defensible', total: 90, detail: '' }),
      buildSupervisorBlindSpotEmail({ firstName: 'Pat', bandLabel: 'fire-fighter', detail: 'The Fire Fighter' }),
      buildSupervisorBlindSpotEmail({ firstName: 'Pat', bandLabel: 'coach', detail: 'The Coach' }),
      buildWorkplaceReadEmail({ firstName: 'Pat', bandLabel: 'drift', detail: 'Drift' }),
      buildWorkplaceReadEmail({ firstName: 'Pat', bandLabel: 'healthy-tension', detail: 'Healthy Tension' }),
    ];
    for (const { subject, html } of emails) {
      const text = `${subject} ${html}`;
      expect(text).not.toMatch(/clarity call|cal\.com|\$99|C\$99|30 minutes|free, 30|opportunity check/i);
      expect(text).not.toContain('—');
      expect(html).toMatch(/start the conversation/i);
      expect(html).toContain('utm_source=diagnostic-email#chat');
    }
  });
});

describe('the result-email allowlist matches the question banks', () => {
  const banks = {
    'org-pulse': orgPulse, dqi, 'governance-eval-readiness': governance,
    'supervisor-blind-spot': supervisor, 'workplace-read': workplace,
  };
  it.each(Object.entries(banks))('%s: bands and details are real labels in src/data', (id, bank) => {
    const { bands, details } = DIAGNOSTIC_RESULTS[id];
    const realBands = bank.scoring?.totalBands ? bank.scoring.totalBands.map(b => b.label) : bank.archetypes.map(a => a.id);
    expect([...bands].sort()).toEqual([...realBands].sort());
    const realDetails = bank.dimensions ? bank.dimensions.map(d => d.label) : bank.archetypes.map(a => a.name || a.label);
    expect([...details].sort()).toEqual([...realDetails].sort());
  });
  it('covers every quiz and nothing else', () => {
    expect(Object.keys(DIAGNOSTIC_RESULTS).sort()).toEqual(Object.keys(banks).sort());
  });
});
