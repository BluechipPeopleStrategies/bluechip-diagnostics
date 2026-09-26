/* global process, global, Buffer */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import submitHandler from '../api/submit.js';
import contactHandler from '../api/contact.js';
import leadHandler from '../api/lead.js';
import calWebhookHandler, { parseBookingNotes } from '../api/cal-webhook.js';
import { buildLeadDataBlock, parseLeadDataBlock } from '../api/_emails/lead-data.js';
import { buildLeadNotificationEmail } from '../api/_emails/lead-notification.js';
import { buildContactNotificationEmail } from '../api/_emails/contact-notification.js';
import { buildChatLeadEmail } from '../api/_lib/lead-helpers.js';

// Leads to Obsidian (2026-09-26): Notion is legacy and read-only. No endpoint writes Notion;
// the notification email to Thomas is the lead record, and its Lead-Data block is what the
// local capture job (BlueChip/tools/diagnostic-leads-to-obsidian.py) parses.
// Every network call is a vi.fn: nothing here reaches Resend, OpenPhone or Notion.

function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

const resendCalls = () => global.fetch.mock.calls.filter(c => String(c[0]).includes('resend')).map(c => JSON.parse(c[1].body));

function okFetch(json = { id: 'x' }) {
  return vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => json }));
}

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test';
  process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
  process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
  // Present on purpose: even with Notion still configured in Vercel, nothing may write to it.
  process.env.NOTION_API_KEY = 'secret_test';
  process.env.NOTION_DATABASE_ID = 'db_test';
  process.env.NOTION_CONTACT_DATABASE_ID = 'db_contact_test';
  process.env.OPENPHONE_API_KEY = 'op_test';
  process.env.OPENPHONE_FROM = '+15875550000';
  global.fetch = okFetch();
});
afterEach(() => { vi.restoreAllMocks(); });

describe('Lead-Data block', () => {
  it('round-trips values, including HTML, line breaks, backslashes and booleans', () => {
    const html = buildLeadDataBlock({
      kind: 'contact', name: 'Dana <b>Lee</b> & Co', inquiry: 'line one\nline two\\three', flag: true, off: false,
      skipped: undefined, empty: '',
    });
    expect(html).not.toContain('<b>Lee</b>');
    expect(parseLeadDataBlock(html)).toEqual({
      kind: 'contact', name: 'Dana <b>Lee</b> & Co', inquiry: 'line one\nline two\\three', flag: 'yes', off: 'no', empty: '',
    });
  });

  it('a visitor cannot cut the block short or forge a field by typing the terminator', () => {
    const html = buildLeadDataBlock({ name: 'x\nEnd-Lead-Data\nspam_trap: no', spam_trap: true });
    const data = parseLeadDataBlock(html);
    expect(data.spam_trap).toBe('yes');
    expect(data.name).toBe('x\nEnd-Lead-Data\nspam_trap: no');
  });

  it('is present in all three notification emails, human-readable body unchanged', () => {
    const diag = buildLeadNotificationEmail({ name: 'Dana', email: 'dana@acme.org', diagnosticId: 'dqi', bandLabel: 'Steady', total: 61, emailSent: true, nudgeScheduled: true, submittedAt: '2026-09-26T10:00:00.000Z' });
    expect(diag.subject).toBe('New diagnostic lead: Dana');
    expect(diag.html).toContain('<strong>Result:</strong> Steady (61/100)');
    expect(parseLeadDataBlock(diag.html)).toEqual({
      kind: 'diagnostic', diagnostic: 'dqi', name: 'Dana', email: 'dana@acme.org', result: 'Steady (61/100)', band: 'Steady',
      score: '61', org_size: '', sector: '', visitor_email_sent: 'yes', nudge_scheduled: 'yes', spam_trap: 'no',
      submitted_at: '2026-09-26T10:00:00.000Z',
    });
    expect(diag.html).not.toMatch(/Notion/);

    const contact = buildContactNotificationEmail({ name: 'Jo', email: 'jo@x.ca', inquiry: 'Hi\nthere', source: 'contact-form', acks: { advisoryOnly: true, decisionsAreMine: true }, submittedAt: '2026-09-26T10:00:00.000Z' });
    expect(parseLeadDataBlock(contact.html)).toMatchObject({ kind: 'contact', name: 'Jo', email: 'jo@x.ca', inquiry: 'Hi\nthere', ack_advisory_only: 'yes' });

    const chat = buildChatLeadEmail({ name: 'T', need: 'Help', contact: '7805551234', email: '', source: 'home chat', consent: true }, { smsSent: false, suspectedSpam: true, submittedAt: '2026-09-26T10:00:00.000Z' });
    expect(chat.subject).toMatch(/^\[Check: spam trap\] New chat lead/);
    expect(parseLeadDataBlock(chat.html)).toMatchObject({ kind: 'chat', name: 'T', phone: '7805551234', email: '', spam_trap: 'yes', text_alert_sent: 'no', texting_consent: 'yes' });
  });
});

describe('submit (scored diagnostics): no Notion row, the notification is the record', () => {
  const body = { diagnosticId: 'dqi', email: 'pat@example.com', name: 'Pat Doe', resultLabel: 'Steady (61/100)', orgSize: '11-50', sector: 'municipal' };

  it('sends result email, schedules the nudge, notifies Thomas with Lead-Data, never touches Notion', async () => {
    const res = mockRes();
    await submitHandler({ method: 'POST', body }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, emailSent: true, nudgeScheduled: true, leadNotificationSent: true });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const note = resendCalls().find(s => s.to === 't@bc.ca');
    expect(note.reply_to).toBe('pat@example.com');
    expect(parseLeadDataBlock(note.html)).toMatchObject({
      kind: 'diagnostic', diagnostic: 'dqi', name: 'Pat Doe', email: 'pat@example.com', band: 'Steady', score: '61',
      org_size: '11-50', sector: 'municipal', visitor_email_sent: 'yes', nudge_scheduled: 'yes', spam_trap: 'no',
    });
  });

  it('returns 502 (lead lost) when the notification to Thomas fails, even if the visitor email sent', async () => {
    global.fetch = vi.fn(async (url, init) => {
      const payload = JSON.parse(init.body);
      const ok = payload.to !== 't@bc.ca';
      return { ok, status: ok ? 200 : 500, text: async () => '', json: async () => ({ id: 'x' }) };
    });
    const res = mockRes();
    await submitHandler({ method: 'POST', body }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ ok: false, emailSent: true, leadNotificationSent: false });
  });

  it('still records the lead when the visitor result email fails', async () => {
    global.fetch = vi.fn(async (url, init) => {
      const payload = JSON.parse(init.body);
      const ok = payload.to === 't@bc.ca';
      return { ok, status: ok ? 200 : 500, text: async () => '', json: async () => ({ id: 'x' }) };
    });
    const res = mockRes();
    await submitHandler({ method: 'POST', body }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, emailSent: false, leadNotificationSent: true });
    const note = resendCalls().find(s => s.to === 't@bc.ca');
    expect(parseLeadDataBlock(note.html).visitor_email_sent).toBe('no');
  });

  it('still rejects a missing email with 400 and sends nothing', async () => {
    const res = mockRes();
    await submitHandler({ method: 'POST', body: { diagnosticId: 'dqi' } }, res);
    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('contact and chat endpoints: no Notion row', () => {
  it('contact form: acknowledgement + notification with Lead-Data, no Notion', async () => {
    const res = mockRes();
    await contactHandler({ method: 'POST', headers: {}, body: { name: 'Jo', email: 'jo@x.ca', inquiry: 'Hello', ackAdvisoryOnly: true, ackDecisionsAreMine: true } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, acknowledgementSent: true, notificationSent: true });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const note = resendCalls().find(s => s.to === 't@bc.ca');
    expect(parseLeadDataBlock(note.html)).toMatchObject({ kind: 'contact', email: 'jo@x.ca', inquiry: 'Hello', source: 'contact-form' });
  });

  it('contact form honeypot is unchanged: pretend success, send nothing', async () => {
    const res = mockRes();
    await contactHandler({ method: 'POST', headers: {}, body: { name: 'Bot', email: 'b@x.ca', inquiry: 'spam', company: 'Acme' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('chat widget: text + email copy with Lead-Data, no Notion, no notionWritten in the response', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: '7805551234', email: 'j@x.ca', consent: false, source: 'homepage chat' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, smsSent: true, confirmationSent: false, emailSent: true });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const mail = resendCalls()[0];
    expect(parseLeadDataBlock(mail.html)).toMatchObject({ kind: 'chat', name: 'Jane', email: 'j@x.ca', text_alert_sent: 'yes', spam_trap: 'no', page: 'homepage chat' });
  });
});

describe('cal-webhook: pending follow-ups found and cancelled in Resend, Notion never touched', () => {
  function calReq(event, headers = {}) {
    const req = new EventEmitter();
    req.method = 'POST';
    req.headers = headers;
    setTimeout(() => { req.emit('data', Buffer.from(JSON.stringify(event))); req.emit('end'); }, 0);
    return req;
  }
  const HOUR = 60 * 60 * 1000;
  // Resend's created_at format, e.g. "2026-04-03 22:13:42.674981+00".
  const ago = (h) => new Date(Date.now() - h * HOUR).toISOString().replace('T', ' ').replace('Z', '+00');
  const sent = (over) => ({
    id: 'e_x', to: ['lead@x.ca'], from: 'BlueChip <hi@bc.ca>', subject: 'Following up on your Org Pulse result',
    created_at: ago(2), last_event: 'scheduled', scheduled_at: 'soon', ...over,
  });

  // Fake Resend: GET /emails serves `pages` in order (cursor = last id of the page),
  // POST /emails/:id/cancel and POST /emails (schedule) succeed. Every call is recorded.
  function resendFake(pages) {
    return vi.fn(async (url, init = {}) => {
      const u = new URL(String(url));
      const method = init.method || 'GET';
      if (u.hostname === 'api.resend.com' && u.pathname === '/emails' && method === 'GET') {
        const after = u.searchParams.get('after');
        const idx = after ? pages.findIndex(p => p.length && p[p.length - 1].id === after) + 1 : 0;
        const data = pages[idx] || [];
        return { ok: true, status: 200, text: async () => '', json: async () => ({ object: 'list', has_more: idx < pages.length - 1, data }) };
      }
      return { ok: true, status: 200, text: async () => '', json: async () => ({ id: 'scheduled_1' }) };
    });
  }
  const cancels = () => global.fetch.mock.calls
    .map(c => String(c[0]).match(/^https:\/\/api\.resend\.com\/emails\/([^/]+)\/cancel$/))
    .filter(Boolean).map(m => decodeURIComponent(m[1]));
  const schedules = () => global.fetch.mock.calls
    .filter(c => String(c[0]) === 'https://api.resend.com/emails' && c[1]?.method === 'POST')
    .map(c => JSON.parse(c[1].body));
  const notionCalls = () => global.fetch.mock.calls.filter(c => String(c[0]).includes('notion'));

  it('BOOKING_CREATED cancels every pending BlueChip follow-up addressed to the booker, and nothing else', async () => {
    global.fetch = resendFake([[
      sent({ id: 'nudge_1' }),
      sent({ id: 'cfu_1', subject: 'About your cancelled Clarity Call', created_at: ago(30) }),
      sent({ id: 'delivered_1', last_event: 'delivered' }),
      sent({ id: 'other_person', to: ['someone@else.ca'] }),
      sent({ id: 'other_sender', from: 'x@evil.ca' }),
      sent({ id: 'other_subject', subject: 'Your registration' }),
      sent({ id: 'group', to: ['lead@x.ca', 'b@x.ca'] }),
    ]]);
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'u1', attendees: [{ email: 'Lead@X.ca ' }] } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, pendingFound: 2, cancelled: 2, searchComplete: true });
    expect(cancels().sort()).toEqual(['cfu_1', 'nudge_1']);
    expect(notionCalls()).toHaveLength(0);
  });

  it('BOOKING_CREATED pages back through the lookback window and stops once a page is older', async () => {
    const filler = (n, h) => Array.from({ length: n }, (_, i) => sent({ id: `f${h}_${i}`, to: ['z@z.ca'], created_at: ago(h) }));
    global.fetch = resendFake([
      filler(3, 1),
      [sent({ id: 'nudge_2nd_page', created_at: ago(20) }), ...filler(2, 20)],
      filler(3, 80),
      [sent({ id: 'never_reached', created_at: ago(90) })],
    ]);
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { attendees: [{ email: 'lead@x.ca' }] } }), res);
    expect(cancels()).toEqual(['nudge_2nd_page']);
    const listCalls = global.fetch.mock.calls.filter(c => String(c[0]).startsWith('https://api.resend.com/emails?'));
    expect(listCalls).toHaveLength(3);
  });

  it('forged or missing data does nothing harmful', async () => {
    global.fetch = resendFake([[sent({ id: 'nudge_1' })]]);
    // No attendee email: no lookup, no cancel.
    const r1 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'u1' } }), r1);
    expect(r1.body).toMatchObject({ error: 'missing_attendee_email' });
    // Something that is not an address is refused.
    const r2 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { attendees: [{ email: '*' }] } }), r2);
    expect(r2.body).toMatchObject({ error: 'missing_attendee_email' });
    // Cancelled booking without a known diagnostic in the notes: no follow-up.
    const r3 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CANCELLED', payload: { attendees: [{ email: 'lead@x.ca' }], responses: { notes: { value: 'Diagnostic: not-a-real-one | Total: 42/100' } } } }), r3);
    expect(r3.body).toMatchObject({ followupScheduled: false, reason: 'no_diagnostic_context' });
    // Cancelled booking with no email at all.
    const r4 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CANCELLED', payload: { additionalNotes: 'Diagnostic: dqi' } }), r4);
    expect(r4.body).toMatchObject({ followupScheduled: false, reason: 'missing_attendee_email' });
    expect(cancels()).toHaveLength(0);
    expect(schedules()).toHaveLength(0);
    expect(notionCalls()).toHaveLength(0);
  });

  it('rejects a webhook with a bad signature when CAL_WEBHOOK_SECRET is set', async () => {
    process.env.CAL_WEBHOOK_SECRET = 'whsec_test';
    try {
      global.fetch = resendFake([[sent({ id: 'nudge_1' })]]);
      const res = mockRes();
      await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { attendees: [{ email: 'lead@x.ca' }] } }, { 'x-cal-signature-256': 'deadbeef' }), res);
      expect(res.statusCode).toBe(401);
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      delete process.env.CAL_WEBHOOK_SECRET;
    }
  });

  it('BOOKING_CANCELLED schedules the +48h follow-up from the booking notes, HTML-escaped', async () => {
    global.fetch = resendFake([[]]);
    const res = mockRes();
    const before = Date.now();
    await calWebhookHandler(calReq({
      triggerEvent: 'BOOKING_CANCELLED',
      payload: {
        uid: 'u9',
        attendees: [{ name: '<img src=x>Pat Lee', email: 'lead@x.ca' }],
        responses: { notes: { value: 'Diagnostic: org-pulse | Result: Exposed | Total: 42/100' } },
      },
    }), res);
    expect(res.body).toMatchObject({ ok: true, event: 'BOOKING_CANCELLED', followupScheduled: true });
    const [email] = schedules();
    expect(email.to).toBe('lead@x.ca');
    expect(email.subject).toBe('About your cancelled Clarity Call');
    expect(email.html).not.toContain('<img');
    const at = Date.parse(email.scheduled_at);
    expect(at - before).toBeGreaterThanOrEqual(48 * HOUR - 1000);
    expect(at - before).toBeLessThanOrEqual(48 * HOUR + 60000);
    expect(notionCalls()).toHaveLength(0);
  });

  it('BOOKING_CANCELLED reads additionalNotes too, and never stacks a second pending follow-up', async () => {
    global.fetch = resendFake([[sent({ id: 'cfu_1', subject: 'About your cancelled Clarity Call' })]]);
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CANCELLED', payload: { attendees: [{ email: 'lead@x.ca' }], additionalNotes: 'Diagnostic: dqi | Tier: uneven' } }), res);
    expect(res.body).toMatchObject({ followupScheduled: false, reason: 'already_pending' });
    expect(schedules()).toHaveLength(0);
  });

  it('BOOKING_RESCHEDULED does nothing and touches no Notion', async () => {
    global.fetch = resendFake([[]]);
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_RESCHEDULED', payload: { uid: 'u3', rescheduleUid: 'u1' } }), res);
    expect(res.body).toMatchObject({ ok: true, rescheduled: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('parseBookingNotes', () => {
  it('whitelists the diagnostic and clamps the rest', () => {
    expect(parseBookingNotes('Diagnostic: org-pulse | Tier: exposed | Total: 42/100')).toEqual({ diagnosticId: 'org-pulse', bandLabel: 'exposed', total: 42 });
    expect(parseBookingNotes('Diagnostic: dqi | Result: Solid <b>x</b> | Total: 999/100')).toEqual({ diagnosticId: 'dqi', bandLabel: 'Solid bxb', total: null });
    expect(parseBookingNotes('Diagnostic: __proto__')).toBeNull();
    expect(parseBookingNotes('Diagnostic: toString')).toBeNull();
    expect(parseBookingNotes('I just want to chat')).toBeNull();
    expect(parseBookingNotes('')).toBeNull();
  });
});
