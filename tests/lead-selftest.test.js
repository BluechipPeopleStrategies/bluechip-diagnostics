import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/lead-selftest.js';

function mockRes() {
  return { statusCode: 0, body: null, headers: {}, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(p) { this.body = p; return this; } };
}

describe('daily lead self-test', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 's3cret';
    process.env.OPENPHONE_API_KEY = 'op'; process.env.OPENPHONE_FROM = '+15875550000'; process.env.LEAD_NOTIFY_PHONE = '+15877130585';
    process.env.RESEND_API_KEY = 're'; process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca'; process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
  });

  it('rejects calls without the cron secret', async () => {
    global.fetch = vi.fn();
    const res = mockRes();
    await handler({ headers: {} }, res);
    expect(res.statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('flags the email subject when texts fail (e.g. out of Quo credits)', async () => {
    global.fetch = vi.fn(async (url) => String(url).includes('openphone')
      ? { ok: false, status: 402, text: async () => 'Not Enough Credits' }
      : { ok: true, status: 200, text: async () => '' });
    const res = mockRes();
    await handler({ headers: { authorization: 'Bearer s3cret' } }, res);
    expect(res.body).toMatchObject({ ok: false, smsSent: false, emailSent: true });
    const mail = global.fetch.mock.calls.find((c) => String(c[0]).includes('resend'));
    expect(JSON.parse(mail[1].body).subject).toMatch(/ACTION NEEDED/);
  });

  it('reports ok when both paths work', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
    const res = mockRes();
    await handler({ headers: { authorization: 'Bearer s3cret' } }, res);
    expect(res.body).toEqual({ ok: true, smsSent: true, emailSent: true });
  });
});
