/* global process, global, Buffer */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import submitHandler from '../api/submit.js';
import contactHandler from '../api/contact.js';
import leadHandler from '../api/lead.js';
import calWebhookHandler from '../api/cal-webhook.js';
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
const notionWrites = () =>
  global.fetch.mock.calls.filter(c => String(c[0]).includes('notion') && !String(c[0]).endsWith('/query'));

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

describe('cal-webhook: reads legacy Notion rows, never writes', () => {
  function calReq(event) {
    const req = new EventEmitter();
    req.method = 'POST';
    req.headers = {};
    setTimeout(() => { req.emit('data', Buffer.from(JSON.stringify(event))); req.emit('end'); }, 0);
    return req;
  }
  const legacyRow = {
    id: 'page_1',
    properties: {
      Email: { email: 'old@x.ca' }, Name: { title: [{ text: { content: 'Old Lead' } }] },
      'Nudge Email ID': { rich_text: [{ text: { content: 'nudge_1' } }] },
    },
  };

  it('BOOKING_CREATED for a legacy lead cancels its pending nudge without patching Notion', async () => {
    global.fetch = okFetch({ results: [legacyRow] });
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'u1', attendees: [{ email: 'old@x.ca' }] } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ matched: true, nudgeCancelled: true });
    expect(notionWrites()).toHaveLength(0);
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('/emails/nudge_1/cancel'))).toBe(true);
  });

  it('BOOKING_CREATED for an unknown attendee creates no Notion row', async () => {
    global.fetch = okFetch({ results: [] });
    const res = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'u2', attendees: [{ email: 'new@x.ca' }] } }), res);
    expect(res.body).toMatchObject({ ok: true, matched: false });
    expect(notionWrites()).toHaveLength(0);
  });

  it('BOOKING_CANCELLED and BOOKING_RESCHEDULED write nothing to Notion', async () => {
    global.fetch = okFetch({ results: [legacyRow], id: 'followup_1' });
    const res1 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_CANCELLED', payload: { uid: 'u1' } }), res1);
    expect(res1.body).toMatchObject({ cancelled: true, followupScheduled: true });
    const res2 = mockRes();
    await calWebhookHandler(calReq({ triggerEvent: 'BOOKING_RESCHEDULED', payload: { uid: 'u3', rescheduleUid: 'u1' } }), res2);
    expect(res2.body).toMatchObject({ ok: true, rescheduled: true });
    expect(notionWrites()).toHaveLength(0);
  });
});
