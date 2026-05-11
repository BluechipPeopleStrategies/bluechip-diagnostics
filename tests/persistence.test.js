import { describe, it, expect, beforeEach } from 'vitest';
import { saveState, loadState, clearState } from '../src/lib/persistence.js';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saves and loads state', () => {
    saveState('org-pulse', { answers: { q1: 5 }, currentIndex: 2 });
    expect(loadState('org-pulse')).toEqual({ answers: { q1: 5 }, currentIndex: 2 });
  });

  it('returns null when nothing saved', () => {
    expect(loadState('org-pulse')).toBe(null);
  });

  it('clears state', () => {
    saveState('org-pulse', { answers: { q1: 5 } });
    clearState('org-pulse');
    expect(loadState('org-pulse')).toBe(null);
  });

  it('isolates state per slug', () => {
    saveState('org-pulse', { answers: { q1: 5 } });
    saveState('dqi', { answers: { q1: 1 } });
    expect(loadState('org-pulse').answers.q1).toBe(5);
    expect(loadState('dqi').answers.q1).toBe(1);
  });
});
