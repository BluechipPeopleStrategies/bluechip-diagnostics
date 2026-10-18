import { describe, it, expect } from 'vitest';
import { freshPulse, restorePulse, pulseQuestions, pulseSnapshot, PULSE_VERSION, SCALE, FAMILIES } from '../src/lib/pulseDiscovery.js';

describe('short discovery Pulse', () => {
  it('keeps an optional note bounded and separate from the opportunity calculation', () => {
    const r = pulseSnapshot({ ...freshPulse(), note: '  A'.repeat(700) });
    expect(r.note).toHaveLength(600);
    expect(r.note.startsWith('A')).toBe(true);
    expect(r.opportunities).toEqual([]);
    expect(r.startingPoint).toBeNull();
    expect(restorePulse({ ...freshPulse(), note: { text: 'bad' } }).note).toBe('');
  });
  it('starts with three examples while retaining every selected work area for later exploration', () => {
    const state = { ...freshPulse(), families: FAMILIES.map(f => f.id) };
    expect(pulseQuestions(state)).toHaveLength(3);
    expect(restorePulse(state).families).toHaveLength(10);
    const industry = { ...freshPulse(), families: ['industry'], answers: { industryBrief: 'unknown' } };
    expect(pulseQuestions(industry)[0].id).toBe('industryBrief');
    expect(pulseSnapshot(industry).uncertain.map(o => o.id)).toEqual(['industryBrief']);
    expect(pulseSnapshot(industry).opportunities).toEqual([]);
  });
  it('keeps all six choices and distinct statuses without deriving hours', () => {
    const s = { ...freshPulse(), families: ['knowledge','voice','inbox','documents','social','operations'], answers: { findDocs: 'friction', dictation: 'works', socialDrafts: 'aspire', reports: 'unknown', records: 'na' } };
    const r = pulseSnapshot(restorePulse(s));
    expect(restorePulse(s).families).toHaveLength(6);
    expect(r.opportunities.map(o => o.id)).toEqual(['findDocs']);
    expect(r.future.map(o => o.id)).toEqual(['socialDrafts']);
    expect(r.covered.map(o => o.id)).toEqual(['dictation']);
    expect(r.uncertain.map(o => o.id)).toEqual(['reports']);
    expect(r.notApplicable.map(o => o.id)).toEqual(['records']);
    expect(r).not.toHaveProperty('hours');
    expect(r).not.toHaveProperty('score');
  });
  it('resets old sessions and narrows malformed current sessions', () => {
    expect(restorePulse({ version: 'old-calculator', hours: 999 })).toEqual(freshPulse());
    const clean = restorePulse({ version: PULSE_VERSION, screen: 'fake', questionIndex: -1, families: 'bad', answers: { findDocs: 'injected', dictation: 'works', invented: 'friction' }, help: null, tools: '<script>', information: 'unknown', priority: 'invented' });
    expect(clean.screen).toBe('intro'); expect(clean.questionIndex).toBe(0);
    expect(clean.families).toEqual([]); expect(clean.answers).toEqual({ dictation: 'works' }); expect(clean.tools).toBe('');
    expect(restorePulse({ version: PULSE_VERSION, answers: null, families: null })).toBeTruthy();
  });
  it('has a fixed transparent scale example independent of answers', () => {
    expect(SCALE).toMatchObject({ people: 10, hours: 2.5, weeks: 48, rate: 40, teamHours: 25, annualHours: 1200, annualValue: 48000 });
    const r = pulseSnapshot(freshPulse()); expect(r.opportunities).toEqual([]); expect(r.startingPoint).toBeNull(); expect(r.unexplored).toHaveLength(20);
  });
});
