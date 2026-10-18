import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleAiCheckResults } from '../api/_lib/ai-check-results.js';
import { parseLeadDataBlock } from '../api/_emails/lead-data.js';

const body = {
  email: 'visitor@example.com', include: 'estimate',
  answers: { orgType: 'professional', areas: ['correspondence'], toolsToday: ['m365'], aiTools: ['none'], information: ['public'], protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone', orgSize: '11-50', owner: 'exec', heldBack: ['nothing'], feel: 'keen', timing: 'thisMonth' },
  areaInputs: { correspondence: { hours: 5, people: 2 } },
  rate: 40, weeks: 48,
  shareCompletedCheck: true, sharingNoticeVersion: 'ai-pulse-results-v2',
};
const response = () => ({ statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } });

beforeEach(() => { vi.stubEnv('BLUECHIP_NOTIFY_EMAIL', 'owner@example.com'); });

describe('disclosed completion sharing', () => {
  it('includes the sanitized answers and computed result in the owner record after disclosed sharing', async () => {
    const sendEmail = vi.fn(async () => true);
    const res = response();
    await handleAiCheckResults(body, res, { sendEmail });
    const owner = sendEmail.mock.calls.map(([v]) => v).find(v => v.to === 'owner@example.com');
    const data = parseLeadDataBlock(owner.html);
    expect(data.check_sharing_notice).toBe('ai-pulse-results-v2');
    expect(data.check_answers).toContain('Professional services');
    expect(data.check_answers).toContain('Emails and correspondence');
    expect(data.check_answers).toContain('Microsoft 365');
    expect(data.check_result_details).toContain('40');
    expect(data.check_result_details).toContain('48');
    expect(owner.html).toContain('Completed AI Pulse answers');
    // The visitor's own copy still honors their separate inclusion preference.
    expect(sendEmail.mock.calls.find(([v]) => v.to === body.email)[0].html).not.toContain('Your answers');
  });

  it('does not silently extend sharing for a client without the new notice', async () => {
    const sendEmail = vi.fn(async () => true);
    await handleAiCheckResults({ ...body, shareCompletedCheck: false }, response(), { sendEmail });
    const owner = sendEmail.mock.calls.map(([v]) => v).find(v => v.to === 'owner@example.com');
    expect(parseLeadDataBlock(owner.html).check_answers).toBeUndefined();
  });

  it('reports a failed owner record even if the visitor email was accepted', async () => {
    const sendEmail = vi.fn(async ({ to }) => to !== 'owner@example.com');
    const res = response();
    await handleAiCheckResults(body, res, { sendEmail });
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ ok: false, emailSent: true, leadNotificationSent: false });
  });

  it('does not report a visitor email as sent when the honeypot suppressed it', async () => {
    const sendEmail = vi.fn(async () => false);
    const res = response();
    await handleAiCheckResults({ ...body, bc_hp_trap: 'unexpected autofill' }, res, { sendEmail });
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ ok: false, emailSent: false, leadNotificationSent: false });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
