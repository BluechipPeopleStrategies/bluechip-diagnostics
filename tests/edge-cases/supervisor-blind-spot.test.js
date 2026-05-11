import { describe, it, expect } from 'vitest';
import { matchArchetype } from '../../src/lib/scoring.js';
import diagnostic from '../../src/data/supervisor-blind-spot.json';

describe('Supervisor Blind Spot edge cases', () => {
  it('has 8 multiple-choice questions and 8 archetypes', () => {
    expect(diagnostic.questions.length).toBe(8);
    expect(diagnostic.archetypes.length).toBe(8);
    for (const q of diagnostic.questions) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('every archetype can be reached by favoring it on every question that offers it', () => {
    for (const arch of diagnostic.archetypes) {
      const answers = {};
      for (const q of diagnostic.questions) {
        const opt = q.options.find((o) => (o.weights?.[arch.id] || 0) > 0);
        if (opt) answers[q.id] = opt.value;
      }
      const r = matchArchetype(diagnostic, answers);
      expect(r.archetypeId).toBe(arch.id);
    }
  });

  it('every archetype has a cheatCode with 5 moves', () => {
    for (const arch of diagnostic.archetypes) {
      expect(Array.isArray(arch.cheatCode)).toBe(true);
      expect(arch.cheatCode.length).toBe(5);
    }
  });

  it('declares tiebreakOrder containing every archetype', () => {
    expect(diagnostic.tiebreakOrder.length).toBe(diagnostic.archetypes.length);
    const ids = new Set(diagnostic.archetypes.map((a) => a.id));
    for (const id of diagnostic.tiebreakOrder) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
