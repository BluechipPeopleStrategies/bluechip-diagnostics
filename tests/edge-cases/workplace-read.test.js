import { describe, it, expect } from 'vitest';
import { matchArchetype } from '../../src/lib/scoring.js';
import diagnostic from '../../src/data/workplace-read.json';

describe('Workplace Read edge cases', () => {
  it('has 20 multiple-choice questions', () => {
    expect(diagnostic.questions.length).toBe(20);
    for (const q of diagnostic.questions) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('every archetype can be reached by favoring it on every question', () => {
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

  it('declares tiebreakOrder containing every archetype', () => {
    expect(diagnostic.tiebreakOrder.length).toBe(diagnostic.archetypes.length);
    const ids = new Set(diagnostic.archetypes.map((a) => a.id));
    for (const id of diagnostic.tiebreakOrder) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('every archetype has a distinctness entry', () => {
    for (const arch of diagnostic.archetypes) {
      expect(diagnostic._distinctness[arch.id]).toBeTruthy();
    }
  });
});
