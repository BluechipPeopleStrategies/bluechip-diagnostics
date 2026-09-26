import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/lunch-register.js';
import { NEXT_SESSION_CONSENT_LABEL } from '../shared/consentCopy.js';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function baseReq(body, ip = '203.0.113.10') {
  return { method: 'POST', headers: { 'x-forwarded-for': ip }, body };
}

describe('lunch-register handler', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.BLUECHIP_FROM_EMAIL = 'hello@bc.ca';
    process.env.BLUECHIP_NOTIFY_EMAIL = 'thomas@bc.ca';
    delete process.env.LUNCH_LIST_GITHUB_TOKEN;
    delete process.env.LUNCH_LIST_REPO;
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({}) }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-POST with 405', async () => {
    const req = { method: 'GET', headers: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('honeypot: returns 200 and sends no email at all', async () => {
    const req = baseReq({ name: 'Bot', email: 'bot@example.com', bc_hp_trap: 'filled-in' }, '203.0.113.11');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a legacy "company" honeypot value the same way a normal lead would be accepted', async () => {
    // Never named "company" here in the first place (see honeypot-field-name-autofill-dropped-leads
    // memory), but confirm a stray "company" field never gets treated as the trap.
    const req = baseReq({ name: 'Jo', email: 'jo@example.ca', company: 'Acme Ltd' }, '203.0.113.12');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when name is missing', async () => {
    const req = baseReq({ name: '', email: 'jo@example.ca' }, '203.0.113.13');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('missing_name');
  });

  it('returns 400 when email looks invalid', async () => {
    const req = baseReq({ name: 'Jo', email: 'not-an-email' }, '203.0.113.14');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_email');
  });

  it('accepts a full registration, emails a confirmation with an .ics attachment, and notifies Thomas', async () => {
    const req = baseReq(
      {
        name: 'Jordan Lee',
        email: 'jordan@example.ca',
        org: 'Example Property Group',
        topics: ['email', 'privacy', 'not-a-real-topic'],
        comfortLevel: 3,
        oneThing: 'A faster way to answer the same tenant emails',
        nextSessionConsent: true,
        page: '/lunch',
      },
      '203.0.113.15'
    );
    const res = mockRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confirmationSent).toBe(true);
    expect(res.body.notificationSent).toBe(true);

    const calls = global.fetch.mock.calls;
    expect(calls.length).toBe(2);

    const confirmationCall = calls.find((c) => JSON.parse(c[1].body).to === 'jordan@example.ca');
    expect(confirmationCall).toBeTruthy();
    const confirmationBody = JSON.parse(confirmationCall[1].body);
    expect(confirmationBody.attachments).toHaveLength(1);
    expect(confirmationBody.attachments[0].filename).toBe('practical-ai-lunch-and-learn.ics');
    const icsText = Buffer.from(confirmationBody.attachments[0].content, 'base64').toString('utf8');
    expect(icsText).toContain('BEGIN:VCALENDAR');
    expect(icsText).toContain('BEGIN:VALARM');
    expect(icsText).toContain('TRIGGER:-PT15M');

    const notifyCall = calls.find((c) => JSON.parse(c[1].body).to === 'thomas@bc.ca');
    expect(notifyCall).toBeTruthy();
    const notifyBody = JSON.parse(notifyCall[1].body);
    expect(notifyBody.html).toContain('Jordan Lee');
    expect(notifyBody.html).toContain('jordan@example.ca');
    expect(notifyBody.html).toContain('Example Property Group');
    expect(notifyBody.html).toContain('Email and replies');
    expect(notifyBody.html).toContain('Keeping private info safe');
    expect(notifyBody.html).not.toContain('not-a-real-topic');
    expect(notifyBody.html).toContain('3 of 5');
    expect(notifyBody.html).toContain('A faster way to answer the same tenant emails');
    expect(notifyBody.html).toContain('YES');
    // The consent-proof requirement: the notification carries the exact wording the registrant saw.
    expect(notifyBody.html).toContain(NEXT_SESSION_CONSENT_LABEL);
  });

  it('records consent as NO when the box was left unticked, and never trusts a non-boolean value', async () => {
    const req = baseReq({ name: 'Sam', email: 'sam@example.ca', nextSessionConsent: 'yes-please' }, '203.0.113.16');
    const res = mockRes();
    await handler(req, res);
    const notifyCall = global.fetch.mock.calls.find((c) => JSON.parse(c[1].body).to === 'thomas@bc.ca');
    const notifyBody = JSON.parse(notifyCall[1].body);
    expect(notifyBody.html).toContain('>no<');
    expect(notifyBody.html).not.toContain('>YES<');
  });

  it('returns 502 when nothing could be captured (no Resend config, no list storage)', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BLUECHIP_FROM_EMAIL;
    const req = baseReq({ name: 'Sam', email: 'sam@example.ca' }, '203.0.113.17');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res.body.ok).toBe(false);
  });

  it('rate-limits repeated requests from the same IP', async () => {
    const ip = '203.0.113.99';
    let last;
    for (let i = 0; i < 7; i += 1) {
      const req = baseReq({ name: 'Repeat', email: 'repeat@example.ca' }, ip);
      last = mockRes();
      await handler(req, last);
    }
    expect(last.statusCode).toBe(429);
  });
});
