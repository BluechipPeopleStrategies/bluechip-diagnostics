/* global process, global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/submit.js';
import { cleanAiCheckInput, buildAiCheckResultsEmail } from '../api/_emails/ai-opportunity-check.js';

// Every network call is a vi.fn: nothing here reaches Resend or Notion.
function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

const ANSWERS = {
  orgType: 'professional', areas: ['correspondence', 'proposals'], toolsToday: ['m365'], aiTools: ['none'],
  information: ['public'], protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone', orgSize: '11-50',
  owner: 'exec', heldBack: ['nothing'], feel: 'variesFeel', timing: 'thisMonth',
};
const BODY = {
  diagnosticId: 'ai-opportunity-check', email: 'pat@example.com', include: 'estimate', answers: ANSWERS,
  areaInputs: { correspondence: { hours: 5, people: 1 }, proposals: { hours: 5, people: 1 } }, rate: 40, weeks: 48, headcount: null,
  bc_hp_trap: '',
};

const resendCalls = () => global.fetch.mock.calls.filter(c => String(c[0]).includes('resend')).map(c => JSON.parse(c[1].body));

describe('submit handler: AI Opportunity Check results email', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.BLUECHIP_FROM_EMAIL = 'hi@bc.ca';
    process.env.BLUECHIP_NOTIFY_EMAIL = 't@bc.ca';
    process.env.NOTION_API_KEY = 'secret_test';
    process.env.NOTION_DATABASE_ID = 'db_test';
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '', json: async () => ({ id: 'x' }) }));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('emails the visitor their estimate and tells Thomas; no nudge, no Notion write', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: BODY }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, emailSent: true, nudgeScheduled: false });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(false);
    const sends = resendCalls();
    expect(sends).toHaveLength(2);
    expect(sends.some(s => s.scheduled_at)).toBe(false);
    const visitor = sends.find(s => s.to === 'pat@example.com');
    expect(visitor.subject).toBe('Your AI Opportunity Check results');
    expect(visitor.html).toMatch(/About 1 to 2 hours a week/);
    expect(visitor.html).toMatch(/36 min to 1.1 hrs\/week/);
    expect(visitor.html).toMatch(/24 to 54 min\/week/);
    expect(visitor.html).not.toMatch(/Your answers/);
    const note = sends.find(s => s.to === 't@bc.ca');
    expect(note.reply_to).toBe('pat@example.com');
    expect(note.html).toMatch(/the estimate only/);
    expect(note.html).toMatch(/this email is the record/);
  });

  it('includes the answers only when asked', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { ...BODY, include: 'answers' } }, res);
    const visitor = resendCalls().find(s => s.to === 'pat@example.com');
    expect(visitor.html).toMatch(/Your answers/);
    expect(visitor.html).toMatch(/Depends on the day/);
  });

  it('builds the email only from known option values; tampered text and fields are ignored or escaped', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: {
      ...BODY, include: 'answers', html: '<h1>spam</h1>', subject: 'Win a prize',
      answers: { ...ANSWERS, orgType: '<script>x</script>', areas: ['otherArea', 'bogus'] },
      areaInputs: { otherArea: { hours: 999, people: 1e9, label: '<a href=evil>click</a>' } },
    } }, res);
    const visitor = resendCalls().find(s => s.to === 'pat@example.com');
    expect(visitor.subject).toBe('Your AI Opportunity Check results');
    expect(visitor.html).not.toMatch(/<script|<h1>spam|<a href=evil/);
    expect(visitor.html).not.toMatch(/bogus/);
    expect(visitor.html).toMatch(/a href=evilclick\/a/); // angle brackets stripped, text kept
  });

  it('honeypot filled: no email to the address given, but a flagged copy to Thomas', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { ...BODY, bc_hp_trap: 'filled by a bot' } }, res);
    expect(res.statusCode).toBe(200);
    const sends = resendCalls();
    expect(sends).toHaveLength(1);
    expect(sends[0].to).toBe('t@bc.ca');
    expect(sends[0].subject).toMatch(/^\[Check: spam trap\]/);
  });

  it('rejects a missing or malformed email without sending anything', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { ...BODY, email: 'not-an-email' } }, res);
    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports failure when neither email could be sent', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'down' }));
    const res = mockRes();
    await handler({ method: 'POST', body: BODY }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body.ok).toBe(false);
  });

  it('other diagnostics still take their existing path', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { diagnosticId: 'dqi', email: 'pat@example.com', resultLabel: 'Band (50/100)' } }, res);
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('notion'))).toBe(true);
  });
});

describe('cleanAiCheckInput', () => {
  it('clamps numbers and caps the areas at six', () => {
    const input = cleanAiCheckInput({
      answers: { areas: ['correspondence', 'reports', 'meetingNotes', 'findingInfo', 'scheduling', 'invoicing', 'hiring'] },
      areaInputs: { correspondence: { hours: 80, people: -3 } }, rate: 9999, weeks: 3, headcount: 100000,
    });
    expect(input.answers.areas).toHaveLength(6);
    expect(input.areaInputs.correspondence).toEqual({ hours: 25, people: 0 });
    expect(input.rate).toBe(250);
    expect(input.weeks).toBe(20);
    expect(input.headcount).toBe(500);
  });

  it('the built email has no em dashes', () => {
    const { html } = buildAiCheckResultsEmail(cleanAiCheckInput({ ...BODY, include: 'answers' }));
    expect(html).not.toMatch(/—/);
  });
});
