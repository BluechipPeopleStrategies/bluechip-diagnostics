import { describe, it, expect } from 'vitest';
import { scoreLikert, matchArchetype } from '../src/lib/scoring.js';
import dqi from '../src/data/dqi.json';

// Decision Quality Index archetype rule (2026-10-09): the Calibrator is the result of a Calibrated
// total score; otherwise the decision trap named in Q17 and Q18 wins, and a tie between two traps
// goes to the one the person gives as the diagnosis of a decision they got wrong (Q18).
const likert = dqi.questions.filter(q => q.type === 'likert-5');
function answersFor(target, q17 = 'a', q18 = 'a') {
  const a = { q17, q18 };
  for (const q of likert) a[q.id] = q.reverseScored ? 6 - target : target; // target = the scored value, 1..5
  return a;
}
const run = (answers) => {
  const score = scoreLikert(dqi, answers);
  return { score, arch: matchArchetype(dqi, answers, score) };
};

describe('DQI archetype is consistent with the score', () => {
  it('a perfect score is the Calibrator, whatever the two trap questions say', () => {
    for (const [q17, q18] of [['a', 'a'], ['b', 'c'], ['d', 'd']]) {
      const { score, arch } = run(answersFor(5, q17, q18));
      expect(score.total).toBe(100);
      expect(score.totalBand.label).toBe('Calibrated');
      expect(arch.archetypeId).toBe('calibrated-decider');
    }
  });

  it('the Calibrator is reachable and only from a Calibrated band', () => {
    const seen = new Set();
    for (const target of [1, 2, 3, 4, 5]) {
      for (const q17 of 'abcd') for (const q18 of 'abcd') {
        const { score, arch } = run(answersFor(target, q17, q18));
        seen.add(arch.archetypeId);
        expect(arch.archetypeId === 'calibrated-decider').toBe(score.totalBand.label === 'Calibrated');
      }
    }
    expect([...seen].sort()).toEqual(['analyst', 'calibrated-decider', 'consensus-seeker', 'gut-caller', 'loudest-voice']);
  });

  it('below Calibrated, two matching answers name the trap', () => {
    expect(run(answersFor(3, 'a', 'a')).arch.archetypeId).toBe('gut-caller');
    expect(run(answersFor(3, 'd', 'd')).arch.archetypeId).toBe('loudest-voice');
  });

  it('below Calibrated, a tie goes to Q18, not to a fixed order', () => {
    expect(run(answersFor(3, 'a', 'b')).arch.archetypeId).toBe('analyst');
    expect(run(answersFor(3, 'b', 'a')).arch.archetypeId).toBe('gut-caller');
    expect(run(answersFor(2, 'c', 'd')).arch.archetypeId).toBe('loudest-voice');
    expect(run(answersFor(2, 'd', 'c')).arch.archetypeId).toBe('consensus-seeker');
  });

  it('the old behaviour is unchanged when no score is passed (no override), and for diagnostics without rules', () => {
    expect(matchArchetype(dqi, answersFor(5, 'b', 'b')).archetypeId).toBe('analyst');
    const plain = { archetypes: [{ id: 'x' }, { id: 'y' }], tiebreakOrder: ['y', 'x'], questions: [{ id: 'q', type: 'multiple-choice', options: [{ value: 1, weights: { x: 1 } }, { value: 2, weights: { y: 1 } }] }] };
    expect(matchArchetype(plain, {}).archetypeId).toBe('y');
  });

  it('declares its rules in the bank', () => {
    expect(dqi.archetypeRules).toEqual({ scoreBandOverride: { band: 'Calibrated', archetype: 'calibrated-decider' }, tieBreakQuestion: 'q18' });
    expect(dqi.archetypes.some(a => a.id === 'calibrated-decider')).toBe(true);
  });
});
