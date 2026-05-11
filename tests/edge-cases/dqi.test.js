import { describe, it, expect } from 'vitest';
import { scoreLikert, matchArchetype } from '../../src/lib/scoring.js';
import diagnostic from '../../src/data/dqi.json';

describe('DQI edge cases', () => {
  it('has 16 likert-5 questions across 4 dimensions and 2 multiple-choice', () => {
    const likert = diagnostic.questions.filter((q) => q.type === 'likert-5');
    const mc = diagnostic.questions.filter((q) => q.type === 'multiple-choice');
    expect(likert.length).toBe(16);
    expect(mc.length).toBe(2);
    expect(diagnostic.dimensions.length).toBe(4);
  });

  it('produces a deterministic archetype for an MC-only answer set favoring one archetype', () => {
    for (const arch of diagnostic.archetypes) {
      const answers = {};
      for (const q of diagnostic.questions) {
        if (q.type !== 'multiple-choice') continue;
        const opt = q.options.find((o) => (o.weights?.[arch.id] || 0) > 0);
        if (opt) answers[q.id] = opt.value;
      }
      const r = matchArchetype(diagnostic, answers);
      expect(r.archetypeId).toBe(arch.id);
    }
  });

  it('score component handles max and min likert answers', () => {
    const allMax = {};
    const allMin = {};
    for (const q of diagnostic.questions) {
      if (q.type !== 'likert-5') continue;
      allMax[q.id] = q.reverseScored ? 1 : 5;
      allMin[q.id] = q.reverseScored ? 5 : 1;
    }
    expect(scoreLikert(diagnostic, allMax).total).toBe(100);
    expect(scoreLikert(diagnostic, allMin).total).toBe(0);
  });

  it('declares tiebreakOrder containing every archetype', () => {
    expect(diagnostic.tiebreakOrder.length).toBe(diagnostic.archetypes.length);
    const ids = new Set(diagnostic.archetypes.map((a) => a.id));
    for (const id of diagnostic.tiebreakOrder) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
