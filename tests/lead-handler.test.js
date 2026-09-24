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
    process.env.LEAD_NOTIFY_PHONE = '+15877130585';
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
    expect(payload.to).toEqual(['+15877130585']);
    expect(payload.from).toBe('+15875550000');
    expect(payload.content).toContain('Name: Jane');
    expect(call[1].headers.Authorization).toBe('op_test');
  });
});
