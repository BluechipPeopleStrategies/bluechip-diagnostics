import { describe, it, expect } from 'vitest';
import { scoreLikert, matchArchetype, applyScoreBand } from '../src/lib/scoring.js';

const likertFixture = {
  id: 'test',
  outputPattern: 'score-and-dimensions',
  dimensions: [
    {
      id: 'a',
      label: 'A',
      scoreBands: [
        { min: 0, max: 50, tier: 'low' },
        { min: 50, max: 100, tier: 'high' },
      ],
    },
    {
      id: 'b',
      label: 'B',
      scoreBands: [
        { min: 0, max: 50, tier: 'low' },
        { min: 50, max: 100, tier: 'high' },
      ],
    },
  ],
  questions: [
    { id: 'q1', dimension: 'a', type: 'likert-5', reverseScored: false },
    { id: 'q2', dimension: 'a', type: 'likert-5', reverseScored: false },
    { id: 'q3', dimension: 'b', type: 'likert-5', reverseScored: true },
    { id: 'q4', dimension: 'b', type: 'likert-5', reverseScored: false },
  ],
  scoring: {
    method: 'weighted-dimension-sum',
    totalRange: [0, 100],
    totalBands: [
      { min: 0, max: 50, label: 'Pressure' },
      { min: 50, max: 100, label: 'Healthy' },
    ],
  },
};

describe('scoreLikert', () => {
  it('returns 100 for max answers (with reverse-scoring honored)', () => {
    const answers = { q1: 5, q2: 5, q3: 1, q4: 5 };
    const result = scoreLikert(likertFixture, answers);
    expect(result.total).toBe(100);
    expect(result.perDimension.a).toBe(100);
    expect(result.perDimension.b).toBe(100);
  });

  it('returns 0 for min answers (with reverse-scoring honored)', () => {
    const answers = { q1: 1, q2: 1, q3: 5, q4: 1 };
    const result = scoreLikert(likertFixture, answers);
    expect(result.total).toBe(0);
    expect(result.perDimension.a).toBe(0);
    expect(result.perDimension.b).toBe(0);
  });

  it('handles split: A all 5s, B all 1s (with reverse on q3)', () => {
    const answers = { q1: 5, q2: 5, q3: 5, q4: 1 };
    const result = scoreLikert(likertFixture, answers);
    expect(result.perDimension.a).toBe(100);
    expect(result.perDimension.b).toBe(0);
    expect(result.total).toBe(50);
  });

  it('maps total to the right band', () => {
    expect(scoreLikert(likertFixture, { q1: 5, q2: 5, q3: 1, q4: 5 }).totalBand.label).toBe('Healthy');
    expect(scoreLikert(likertFixture, { q1: 1, q2: 1, q3: 5, q4: 1 }).totalBand.label).toBe('Pressure');
  });
});

const archetypeFixture = {
  id: 'arch-test',
  outputPattern: 'archetype-match',
  archetypes: [
    { id: 'fire-fighter', name: 'Fire Fighter' },
    { id: 'coach', name: 'Coach' },
    { id: 'friend', name: 'Friend' },
  ],
  tiebreakOrder: ['fire-fighter', 'coach', 'friend'],
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      options: [
        { value: 'a', weights: { 'fire-fighter': 1, coach: 0, friend: 0 } },
        { value: 'b', weights: { 'fire-fighter': 0, coach: 1, friend: 0 } },
        { value: 'c', weights: { 'fire-fighter': 0, coach: 0, friend: 1 } },
      ],
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      options: [
        { value: 'a', weights: { 'fire-fighter': 1, coach: 0, friend: 0 } },
        { value: 'b', weights: { 'fire-fighter': 0, coach: 1, friend: 0 } },
      ],
    },
  ],
};

describe('matchArchetype', () => {
  it('picks the highest-weighted archetype', () => {
    const result = matchArchetype(archetypeFixture, { q1: 'a', q2: 'a' });
    expect(result.archetypeId).toBe('fire-fighter');
    expect(result.scores['fire-fighter']).toBe(2);
  });

  it('uses tiebreakOrder on ties', () => {
    const result = matchArchetype(archetypeFixture, { q1: 'a', q2: 'b' });
    expect(result.archetypeId).toBe('fire-fighter');
  });

  it('is deterministic', () => {
    const r1 = matchArchetype(archetypeFixture, { q1: 'b', q2: 'a' });
    const r2 = matchArchetype(archetypeFixture, { q1: 'b', q2: 'a' });
    expect(r1.archetypeId).toBe(r2.archetypeId);
  });
});

describe('applyScoreBand', () => {
  const bands = [
    { min: 0, max: 50, label: 'Low' },
    { min: 50, max: 75, label: 'Mid' },
    { min: 75, max: 100, label: 'High' },
  ];

  it('returns the matching band', () => {
    expect(applyScoreBand(bands, 30).label).toBe('Low');
    expect(applyScoreBand(bands, 60).label).toBe('Mid');
    expect(applyScoreBand(bands, 90).label).toBe('High');
  });

  it('treats the lower bound as inclusive', () => {
    expect(applyScoreBand(bands, 50).label).toBe('Mid');
    expect(applyScoreBand(bands, 75).label).toBe('High');
  });

  it('treats the top of the last band as inclusive (100)', () => {
    expect(applyScoreBand(bands, 100).label).toBe('High');
  });

  it('returns null for out-of-range scores', () => {
    expect(applyScoreBand(bands, -1)).toBe(null);
    expect(applyScoreBand(bands, 101)).toBe(null);
  });
});
