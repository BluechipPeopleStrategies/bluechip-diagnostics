import { describe, it, expect } from 'vitest';
import {
  parseCalcParams, buildCalcPrefill, prefillFor, hasCheckProgress,
  CALC_TASK_AREA, CALC_TASK_KEYS, CALC_SEATS, SEAT_ORG_TYPE,
} from '../src/lib/calcPrefill';
import { AREAS, questions } from '../src/lib/aiOpportunity';

const parse = (qs) => parseCalcParams(qs);

describe('parseCalcParams: reading and validating the URL', () => {
  it('reads the worked example', () => {
    expect(parse('?src=calc&seat=clerk&tasks=minutes,email,payroll&hours=4,6,3&people=2')).toEqual({
      seat: 'clerk',
      tasks: [{ key: 'minutes', hours: 4 }, { key: 'email', hours: 6 }, { key: 'payroll', hours: 3 }],
      people: 2,
    });
  });
  it('returns null unless src=calc', () => {
    expect(parse('')).toBeNull();
    expect(parse('?seat=clerk&tasks=email&hours=3')).toBeNull();
    expect(parse('?src=other&tasks=email&hours=3')).toBeNull();
    expect(parse('?src=CALC&tasks=email&hours=3')).toBeNull();
  });
  it('accepts a URLSearchParams too', () => {
    expect(parse(new URLSearchParams('src=calc&seat=hr'))).toEqual({ seat: 'hr', tasks: [], people: null });
  });
  it('accepts every seat and ignores an unknown one', () => {
    CALC_SEATS.forEach(s => expect(parse(`?src=calc&seat=${s}`).seat).toBe(s));
    expect(parse('?src=calc&seat=ceo').seat).toBeNull();
    expect(parse('?src=calc&seat=').seat).toBeNull();
    expect(parse('?src=calc&seat=<script>').seat).toBeNull();
  });
  it('drops unknown task keys together with their hours, so the others stay aligned', () => {
    const p = parse('?src=calc&tasks=email,bogus,reports&hours=3,9,5');
    expect(p.tasks).toEqual([{ key: 'email', hours: 3 }, { key: 'reports', hours: 5 }]);
  });
  it('keeps only the first nine entries and drops repeated tasks', () => {
    const keys = ['email', 'reports', 'minutes', 'agendas', 'research', 'findProc', 'updProc', 'policies', 'onboarding', 'postings'];
    const p = parse(`?src=calc&tasks=${keys.join(',')}&hours=1,1,1,1,1,1,1,1,1,1`);
    expect(p.tasks).toHaveLength(9);
    expect(p.tasks.map(t => t.key)).not.toContain('postings');
    expect(parse('?src=calc&tasks=email,email&hours=2,7').tasks).toEqual([{ key: 'email', hours: 2 }]);
  });
  it('treats hours outside 0-40, non-integers and missing values as unknown (null)', () => {
    const p = parse('?src=calc&tasks=email,reports,minutes,agendas,research&hours=41,-1,2.5,abc');
    expect(p.tasks.map(t => t.hours)).toEqual([null, null, null, null, null]);
    expect(parse('?src=calc&tasks=email,reports&hours=0,40').tasks.map(t => t.hours)).toEqual([0, 40]);
  });
  it('ignores extra hours and tolerates whitespace', () => {
    expect(parse('?src=calc&tasks=email&hours=3,4,5').tasks).toEqual([{ key: 'email', hours: 3 }]);
    expect(parse('?src=calc&tasks=%20email%20&hours=%203').tasks).toEqual([{ key: 'email', hours: 3 }]);
  });
  it('accepts people 1-500 only', () => {
    expect(parse('?src=calc&people=1').people).toBe(1);
    expect(parse('?src=calc&people=500').people).toBe(500);
    ['0', '501', '-3', '2.5', 'abc', '', '99999999'].forEach(v => expect(parse(`?src=calc&people=${v}`).people).toBeNull());
  });
  it('survives junk', () => {
    expect(parse('?src=calc&tasks=,,,&hours=,,,&people=')).toEqual({ seat: null, tasks: [], people: null });
    expect(parse('?src=calc&tasks=__proto__,constructor&hours=1,2').tasks).toEqual([]);
  });
});

describe('task to area mapping table', () => {
  const areaValues = AREAS.map(([v]) => v);
  it('only points at real Q2 areas', () => {
    Object.values(CALC_TASK_AREA).forEach(a => expect(areaValues).toContain(a));
  });
  it('never points at the Other or Not sure tiles', () => {
    Object.values(CALC_TASK_AREA).forEach(a => expect(['otherArea', 'notSureArea']).not.toContain(a));
  });
  it('covers every calculator task except the two with no good match', () => {
    const unmapped = CALC_TASK_KEYS.filter(k => !CALC_TASK_AREA[k]).sort();
    expect(unmapped).toEqual(['files', 'payroll']);
    expect(Object.keys(CALC_TASK_AREA).filter(k => !CALC_TASK_KEYS.includes(k))).toEqual([]);
  });
  it('has the 26 calculator tasks', () => {
    expect(CALC_TASK_KEYS).toHaveLength(26);
  });
  it('maps the seats: municipal seats only', () => {
    expect(SEAT_ORG_TYPE).toEqual({ cao: 'municipal', council: 'municipal', clerk: 'municipal' });
    const orgOptions = questions.find(q => q.id === 'orgType').options.map(o => o[0]);
    expect(orgOptions).toContain('municipal');
  });
});

describe('buildCalcPrefill', () => {
  const build = (qs) => buildCalcPrefill(parse(qs));
  it('returns null without valid params', () => {
    expect(buildCalcPrefill(null)).toBeNull();
  });
  it('pre-answers the worked example and starts at the first open question', () => {
    const p = build('?src=calc&seat=clerk&tasks=minutes,email,payroll&hours=4,6,3&people=2');
    expect(p.answers).toEqual({ orgType: 'municipal', areas: ['meetingNotes', 'correspondence'] });
    expect(p.areaInputs).toEqual({ meetingNotes: { hours: 4, people: 2 }, correspondence: { hours: 6, people: 2 } });
    expect(p.mapped).toBe(2);
    expect(p.skipped).toBe(1);
    expect(p.carried).toBe(true);
    expect(questions[p.startIndex].id).toBe('toolsToday');
  });
  it('sums hours for tasks that share an area and caps at 25', () => {
    const p = build('?src=calc&tasks=minutes,email,reports,agendas,packages&hours=2,3,4,5,6');
    expect(p.areaInputs.reports.hours).toBe(15); // reports + agendas + packages
    const q = build('?src=calc&tasks=reports,agendas,packages&hours=15,15,15');
    expect(q.areaInputs.reports.hours).toBe(25);
    expect(q.mapped).toBe(3);
  });
  it('starts at question 1 when the seat gives no organization type', () => {
    const p = build('?src=calc&seat=hr&tasks=email&hours=3');
    expect(p.answers.orgType).toBeUndefined();
    expect(p.startIndex).toBe(0);
    const smb = build('?src=calc&seat=smb&tasks=email&hours=3');
    expect(smb.answers.orgType).toBeUndefined();
  });
  it('skips zero-hour tasks and unmapped tasks, and counts them', () => {
    const p = build('?src=calc&tasks=email,files,payroll,reports&hours=0,5,5,2');
    expect(p.answers.areas).toEqual(['reports']);
    expect(p.mapped).toBe(1);
    expect(p.skipped).toBe(3);
  });
  it('keeps an area whose hours were missing at the check default of 5', () => {
    const p = build('?src=calc&tasks=email,reports&hours=');
    expect(p.answers.areas).toEqual(['correspondence', 'reports']);
    expect(p.areaInputs.correspondence).toEqual({ hours: 5, people: 1 });
  });
  it('uses 1 person when people is missing or invalid', () => {
    expect(build('?src=calc&tasks=email&hours=3&people=900').areaInputs.correspondence.people).toBe(1);
  });
  it('picks at most six areas and skips the rest', () => {
    const p = build('?src=calc&tasks=email,reports,minutes,research,findProc,policies,onboarding,scheduling&hours=1,1,1,1,1,1,1,1');
    expect(p.answers.areas).toHaveLength(6);
    expect(p.answers.areas).not.toContain('hiring');
    expect(p.mapped).toBe(6);
    expect(p.skipped).toBe(2);
  });
  it('still allows a task whose area is already picked once six are in', () => {
    const p = build('?src=calc&tasks=email,reports,minutes,research,findProc,policies,agendas&hours=1,1,1,1,1,1,2');
    expect(p.answers.areas).toHaveLength(6);
    expect(p.areaInputs.reports.hours).toBe(3);
    expect(p.skipped).toBe(0);
  });
  it('carries nothing when no seat and no task maps', () => {
    const p = build('?src=calc&tasks=payroll,files&hours=3,3');
    expect(p.carried).toBe(false);
    expect(p.answers).toEqual({});
    expect(p.startIndex).toBe(0);
    expect(p.skipped).toBe(2);
  });
  it('produces only values the check itself accepts', () => {
    const p = build('?src=calc&seat=cao&tasks=speeches,quotes,grants,staffQ,time&hours=3,3,3,3,3&people=4');
    const orgs = questions.find(q => q.id === 'orgType').options.map(o => o[0]);
    const areas = questions.find(q => q.id === 'areas').options.map(o => o[0]);
    expect(orgs).toContain(p.answers.orgType);
    p.answers.areas.forEach(a => expect(areas).toContain(a));
  });
});

describe('resume wins', () => {
  const qs = '?src=calc&seat=clerk&tasks=email&hours=3&people=2';
  it('pre-fills when there is no saved session', () => {
    expect(prefillFor(qs, null)).not.toBeNull();
  });
  it('pre-fills over a blank saved session (the page was only opened)', () => {
    expect(prefillFor(qs, { v: 1, answers: {}, qIndex: 0, step: 'questions', areaInputs: {} })).not.toBeNull();
  });
  it('ignores the params when a saved session has answers, a later question or a result', () => {
    expect(prefillFor(qs, { v: 1, answers: { orgType: 'trades' }, qIndex: 0, step: 'questions' })).toBeNull();
    expect(prefillFor(qs, { v: 1, answers: {}, qIndex: 3, step: 'questions' })).toBeNull();
    expect(prefillFor(qs, { v: 1, answers: {}, qIndex: 0, step: 'result' })).toBeNull();
  });
  it('hasCheckProgress is false for nothing and for a blank session', () => {
    expect(hasCheckProgress(null)).toBe(false);
    expect(hasCheckProgress({ answers: {}, qIndex: 0, step: 'questions' })).toBe(false);
  });
  it('returns null without src=calc whatever the session', () => {
    expect(prefillFor('', null)).toBeNull();
  });
});
