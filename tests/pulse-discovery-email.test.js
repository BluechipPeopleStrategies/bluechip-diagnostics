import { beforeEach, it, expect, vi } from 'vitest';
import { handleAiCheckResults } from '../api/_lib/ai-check-results.js';
import { parseLeadDataBlock } from '../api/_emails/lead-data.js';
const body = { email: 'visitor@example.com', pulseVersion: 'ai-pulse-discovery-v1', shareCompletedCheck: true, sharingNoticeVersion: 'ai-pulse-discovery-results-v1', pulse: { version: 'ai-pulse-discovery-v1', families: ['knowledge','voice','social'], answers: { findDocs: 'friction', dictation: 'works', socialDrafts: 'aspire', records: 'unknown', malicious: '<script>bad</script>' }, help: { findDocs: 'underused' }, tools: 'm365', information: 'internal' }, computedResult: { hours: 99999 } };
const response = () => ({ statusCode: 0, body: null, status(c) { this.statusCode=c; return this; }, json(v) { this.body=v; return this; } });
beforeEach(() => vi.stubEnv('BLUECHIP_NOTIFY_EMAIL','owner@example.com'));
it('shares a bounded escaped optional note only under the new disclosed request', async () => {
  const sendEmail=vi.fn(async()=>true),res=response();
  await handleAiCheckResults({...body,sharingNoticeVersion:'ai-pulse-discovery-results-v2',pulse:{...body.pulse,note:'<img src=x onerror=alert(1)> Keep track of renewals'}},res,{sendEmail});
  expect(res.statusCode).toBe(200);
  const owner=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to==='owner@example.com');
  const record=parseLeadDataBlock(owner.html);
  expect(record.check_answers).toContain('Keep track of renewals');
  expect(record.check_sharing_notice).toBe('ai-pulse-discovery-results-v2');
  expect(owner.html).not.toContain('<img src=x onerror=');
});
it('continues accepting the older notice without adding a new free-text field to it', async () => {
  const sendEmail=vi.fn(async()=>true),res=response();
  await handleAiCheckResults({...body,pulse:{...body.pulse,note:'Do not share this under an old notice'}},res,{sendEmail});
  expect(res.statusCode).toBe(200);
  const owner=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to==='owner@example.com');
  expect(parseLeadDataBlock(owner.html).check_answers).not.toContain('Do not share this');
});
it('sends a server-built qualitative snapshot and full disclosed owner record', async () => {
  const sendEmail=vi.fn(async()=>true),res=response(); await handleAiCheckResults(body,res,{sendEmail});
  expect(res.statusCode).toBe(200); expect(res.body).toMatchObject({ emailSent:true,leadNotificationSent:true,nudgeScheduled:false });
  const visitor=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to===body.email),owner=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to==='owner@example.com');
  expect(visitor.html).toContain('Your AI starting points'); expect(visitor.html).not.toContain('99999'); expect(visitor.html).not.toContain('<script>bad');
  const record=parseLeadDataBlock(owner.html); expect(record.check_sharing_notice).toBe(body.sharingNoticeVersion); expect(record.check_answers).toContain('Our way of drafting works well'); expect(record.check_answers).toContain('I would need to ask the team'); expect(record.check_result_snapshot).toContain('socialDrafts'); expect(record.check_result_snapshot).not.toContain('malicious');
});
it.each([{shareCompletedCheck:false},{sharingNoticeVersion:'old'},{pulseVersion:'invented'}])('rejects undisclosed or unsupported requests before sending: %j',async change=>{
  const sendEmail=vi.fn(async()=>true),res=response(); await handleAiCheckResults({...body,...change},res,{sendEmail}); expect(res.statusCode).toBe(400); expect(sendEmail).not.toHaveBeenCalled();
});
it('does not claim completion when owner capture fails',async()=>{const res=response();await handleAiCheckResults(body,res,{sendEmail:vi.fn(async({to})=>to!=='owner@example.com')});expect(res.statusCode).toBe(502);expect(res.body).toMatchObject({emailSent:true,leadNotificationSent:false,ok:false});});
it('suppresses the visitor on honeypot while keeping a flagged owner record',async()=>{const sendEmail=vi.fn(async()=>true),res=response();await handleAiCheckResults({...body,bc_hp_trap:'filled'},res,{sendEmail});expect(sendEmail).toHaveBeenCalledTimes(1);expect(sendEmail.mock.calls[0][0].to).toBe('owner@example.com');expect(res.body.emailSent).toBe(false);});

it('emails the same task-specific answer that was chosen and keeps unknown separate',async()=>{
 const sendEmail=vi.fn(async()=>true),res=response();
 await handleAiCheckResults({...body,pulse:{...body.pulse,families:['priorities','people'],answers:{weeklyPriorities:'works',hrStartingPoints:'unknown'}}},res,{sendEmail});
 const owner=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to==='owner@example.com');
 const record=parseLeadDataBlock(owner.html);
 expect(record.check_answers).toContain('Which best describes how your team sets priorities?: People know what to work on first');
 expect(record.check_answers).toContain('Which best describes onboarding and routine staff questions?: I would need to ask the team');
 const visitor=sendEmail.mock.calls.map(([v])=>v).find(v=>v.to===body.email);
 expect(visitor.html).toContain('These were marked unsure, not counted as needs');
 expect(visitor.html).not.toContain('C$48,000');
});
