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

  it('returns 200 ok on honeypot without calling fetch', async () => {
    const req = { method: 'POST', headers: {}, body: { name: 'x', need: 'y', contact: 'z', company: 'bot' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch).not.toHaveBeenCalled();
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
