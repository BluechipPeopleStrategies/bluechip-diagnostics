/* global process, global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import submitHandler from '../api/submit.js';
import leadHandler from '../api/lead.js';
import { resetRateLimit } from '../api/_lib/rate-limit.js';
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
  resetRateLimit();
  process.env.RESEND_API_KEY = 're_test';
  process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
  process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
  // Present on purpose: even with Notion still configured in Vercel, nothing may write to it.
  process.env.NOTION_API_KEY = 'secret_test';
  process.env.NOTION_DATABASE_ID = 'db_test';
  process.env.NOTION_CONTACT_DATABASE_ID = 'db_contact_test';
  process.env.OPENPHONE_API_KEY = 'op_test';
  process.env.OPENPHONE_FROM = '+15875550000';
  process.env.LEAD_NOTIFY_PHONE = '+15875550123';
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
  const body = { diagnosticId: 'dqi', email: 'pat@example.com', name: 'Pat Doe', resultLabel: 'Mixed signal (61/100)', orgSize: '11-50', sector: 'municipal' };

  it('sends result email, schedules no nudge, notifies Thomas with Lead-Data, never touches Notion', async () => {
    const res = mockRes();
    await submitHandler({ method: 'POST', body }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, emailSent: true, nudgeScheduled: false, leadNotificationSent: true });
    expect(resendCalls().some(s => s.scheduled_at)).toBe(false);
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const note = resendCalls().find(s => s.to === 't@bc.ca');
    expect(note.reply_to).toBe('pat@example.com');
    expect(parseLeadDataBlock(note.html)).toMatchObject({
      kind: 'diagnostic', diagnostic: 'dqi', name: 'Pat Doe', email: 'pat@example.com', band: 'Mixed signal', score: '61',
      org_size: '11-50', sector: 'municipal', visitor_email_sent: 'yes', nudge_scheduled: 'no', spam_trap: 'no',
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

describe('contact form and chat (both post to /api/lead): no Notion row', () => {
  it('contact form: one auto-reply to the sender (Oct 9), after the lead is captured', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'Jane Doe', need: 'Question about the plan', contact: 'jane@acme.org', consent: false, source: 'contact form' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, emailSent: true, autoReplySent: true });
    const toVisitor = resendCalls().filter(s => s.to === 'jane@acme.org');
    expect(toVisitor).toHaveLength(1);
    expect(toVisitor[0].subject).toBe("We've got your message");
    expect(toVisitor[0].reply_to).toBe('hello@bluechip-people-strategies.com');
    expect(toVisitor[0].html).toContain('Hi Jane,');
    expect(toVisitor[0].html).toContain('#chat');
    expect(toVisitor[0].html).not.toMatch(/—/);
  });

  it('contact form: no auto-reply when the address is not a single plain email', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'Jane', need: 'Hi', contact: 'a@x.ca,b@y.ca', consent: false, source: 'contact form' } }, res);
    expect(res.body).toMatchObject({ ok: true, autoReplySent: false });
    expect(resendCalls().some(s => String(s.to).includes('a@x.ca'))).toBe(false);
  });

  it('chat widget: text + email copy with Lead-Data, no Notion, no notionWritten in the response', async () => {
    const res = mockRes();
    await leadHandler({ method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: '7805551234', email: 'j@x.ca', consent: false, source: 'homepage chat' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, smsSent: true, confirmationSent: false, emailSent: true, autoReplySent: false });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const mail = resendCalls()[0];
    expect(parseLeadDataBlock(mail.html)).toMatchObject({ kind: 'chat', name: 'Jane', email: 'j@x.ca', text_alert_sent: 'yes', spam_trap: 'no', page: 'homepage chat' });
  });
});
