/* global process, global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/lead.js';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

describe('lead handler', () => {
  beforeEach(() => {
    process.env.OPENPHONE_API_KEY = 'op_test';
    process.env.OPENPHONE_FROM = '+15875550000';
    process.env.LEAD_NOTIFY_PHONE = '+15875550123';
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_CONTACT_DATABASE_ID;
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('rejects non-POST with 405', async () => {
    const req = { method: 'GET', headers: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('honeypot: returns 200, sends no text, but emails a flagged copy', async () => {
    process.env.RESEND_API_KEY = 're_test'; process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca'; process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    const req = { method: 'POST', headers: {}, body: { name: 'x', need: 'y', contact: 'z', bc_hp_trap: 'bot' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('openphone'))).toBe(false);
    const mail = global.fetch.mock.calls.find(c => String(c[0]).includes('resend'));
    expect(JSON.parse(mail[1].body).subject).toMatch(/spam trap/);
  });

  it('an autofilled legacy "company" field no longer drops the lead', async () => {
    const req = { method: 'POST', headers: {}, body: { name: 'Jo', need: 'The AI Handoff Plan', contact: '7805551234', consent: true, company: 'Acme Ltd' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.body.smsSent).toBe(true);
  });

  it('emails every lead and skips the visitor confirmation when it is our own number', async () => {
    process.env.RESEND_API_KEY = 're_test'; process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca'; process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    const req = { method: 'POST', headers: {}, body: { name: 'T', need: 'The AI Handoff Plan', contact: '587-555-0000', consent: true } };
    const res = mockRes();
    await handler(req, res);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.confirmationSent).toBe(false);
    const texts = global.fetch.mock.calls.filter(c => String(c[0]).includes('openphone'));
    expect(texts.length).toBe(1);
  });

  it('returns 400 when required fields missing', async () => {
    const req = { method: 'POST', headers: {}, body: { name: '', need: '', contact: '' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('sends SMS via OpenPhone and returns smsSent true', async () => {
    const req = { method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: 'j@x.ca', source: 'homepage chat' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.smsSent).toBe(true);
    const call = global.fetch.mock.calls.find(c => String(c[0]).includes('openphone'));
    expect(call).toBeTruthy();
    const payload = JSON.parse(call[1].body);
    expect(payload.to).toEqual(['+15875550123']);
    expect(payload.from).toBe('+15875550000');
    expect(payload.content).toContain('Name: Jane');
    expect(call[1].headers.Authorization).toBe('op_test');
  });

  it('returns 502 (lead lost) when neither the text nor the email could be sent, so the widget can say so', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'down' }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: '7805550100', email: 'j@x.ca', consent: true } }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ ok: false, smsSent: false, emailSent: false });
  });

  it('stays 200 when only one of the two got through', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
    process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    global.fetch = vi.fn(async (url) => (String(url).includes('openphone')
      ? { ok: false, status: 402, text: async () => 'no credits' }
      : { ok: true, status: 200, text: async () => '' }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: '7805550100', email: 'j@x.ca' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, smsSent: false, emailSent: true });
  });

  it('the retainer confirmation text no longer talks about tiers', async () => {
    const { formatVisitorConfirmation } = await import('../api/_lib/lead-helpers.js');
    const text = formatVisitorConfirmation({ name: 'Jane', need: 'Practical AI and/or Embedded HR Retainers' });
    expect(text).not.toMatch(/tier/i);
    expect(text).toContain('https://www.bluechip-people-strategies.com/embedded-hr-retainers');
  });
});

// Pre-launch checklist (Oct 9, 2026): a loop against /api/lead, or the form aimed at someone else's
// number or inbox, stops after a few sends. Best effort per instance; the firewall rule is the hard limit.
describe('lead handler: rate limits and safe first name', () => {
  it('stops a ninth lead from one client within the hour', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { resetRateLimit } = await import('../api/_lib/rate-limit.js');
    resetRateLimit();
    process.env.RESEND_API_KEY = 're_test'; process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca'; process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({}) }));
    const codes = [];
    for (let i = 0; i < 9; i++) {
      const res = { statusCode: 0, headers: {}, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; }, end() { return this; } };
      await handler({ method: 'POST', headers: { 'x-forwarded-for': '203.0.113.9' }, body: { name: 'Jo', need: 'help', contact: 'jo@x.ca' } }, res);
      codes.push(res.statusCode);
    }
    expect(codes.slice(0, 8).every(c => c === 200)).toBe(true);
    expect(codes[8]).toBe(429);
  });

  it('sends the auto-reply to one address at most twice a day', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { resetRateLimit } = await import('../api/_lib/rate-limit.js');
    resetRateLimit();
    process.env.RESEND_API_KEY = 're_test'; process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca'; process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({}) }));
    const sent = [];
    for (let i = 0; i < 3; i++) {
      const res = { statusCode: 0, headers: {}, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; }, end() { return this; } };
      await handler({ method: 'POST', headers: {}, body: { name: 'Jo', need: 'hi', contact: 'Victim@Example.org', source: 'contact form' } }, res);
      sent.push(res.body.autoReplySent);
    }
    expect(sent).toEqual([true, true, false]);
  });

  it('texts and emails the visitor a letters-only first name, never the rest of what they typed', async () => {
    const { formatVisitorConfirmation } = await import('../api/_lib/lead-helpers.js');
    const { buildContactAutoReplyEmail } = await import('../api/_emails/contact-auto-reply.js');
    const text = formatVisitorConfirmation({ name: 'Win-a-prize.example.com/claim now', need: 'x' });
    expect(text.startsWith('Hi Win-a-prizeexamplecomclaim, ')).toBe(true);
    expect(text).not.toContain('example.com');
    expect(formatVisitorConfirmation({ name: "D'Arcy Smith", need: 'x' }).startsWith("Hi D'Arcy, ")).toBe(true);
    expect(buildContactAutoReplyEmail({ name: 'evil.example/x <b>' }).text.startsWith('Hi evilexamplex,')).toBe(true);
  });
});
