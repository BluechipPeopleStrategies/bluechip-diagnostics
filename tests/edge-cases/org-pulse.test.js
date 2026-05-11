import { describe, it, expect } from 'vitest';
import { scoreLikert } from '../../src/lib/scoring.js';
import diagnostic from '../../src/data/org-pulse.json';

function maxAnswers(d) {
  const out = {};
  for (const q of d.questions) {
    if (q.type === 'likert-5') out[q.id] = q.reverseScored ? 1 : 5;
  }
  return out;
}
function minAnswers(d) {
  const out = {};
  for (const q of d.questions) {
    if (q.type === 'likert-5') out[q.id] = q.reverseScored ? 5 : 1;
  }
  return out;
}

describe('Org Pulse edge cases', () => {
  it('produces score 100 / Healthy when every answer is in the strongest direction', () => {
    const r = scoreLikert(diagnostic, maxAnswers(diagnostic));
    expect(r.total).toBe(100);
    expect(r.totalBand.label).toBe('Healthy');
  });

  it('produces score 0 / Pressure building when every answer is in the weakest direction', () => {
    const r = scoreLikert(diagnostic, minAnswers(diagnostic));
    expect(r.total).toBe(0);
    expect(r.totalBand.label).toBe('Pressure building');
  });

  it('has 25 likert-5 questions distributed across 5 dimensions, 5 per dimension', () => {
    const counts = {};
    let total = 0;
    for (const q of diagnostic.questions) {
      if (q.type !== 'likert-5') continue;
      total += 1;
      counts[q.dimension] = (counts[q.dimension] || 0) + 1;
    }
    expect(total).toBe(25);
    expect(diagnostic.dimensions.length).toBe(5);
    for (const dim of diagnostic.dimensions) {
      expect(counts[dim.id]).toBe(5);
    }
  });

  it('every dimension has a distinctness entry', () => {
    for (const dim of diagnostic.dimensions) {
      expect(diagnostic._distinctness[dim.id]).toBeTruthy();
    }
  });

  it('every dimension has 3 score bands with gap-free coverage 0-100', () => {
    for (const dim of diagnostic.dimensions) {
      expect(dim.scoreBands.length).toBe(3);
      expect(dim.scoreBands[0].min).toBe(0);
      expect(dim.scoreBands[dim.scoreBands.length - 1].max).toBe(100);
    }
  });
});
