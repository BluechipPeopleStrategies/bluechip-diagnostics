import { describe, it, expect } from 'vitest';
import { CTA_COPY, getCtaCopy, bandLabelToKey } from '../src/data/ctaCopy.js';

describe('bandLabelToKey', () => {
  it('slugifies a band label into a copy key', () => {
    expect(bandLabelToKey('Pressure building')).toBe('pressure-building');
    expect(bandLabelToKey('Decision drag')).toBe('decision-drag');
    expect(bandLabelToKey('Mixed signal')).toBe('mixed-signal');
    expect(bandLabelToKey('Healthy')).toBe('healthy');
    expect(bandLabelToKey('Calibrated')).toBe('calibrated');
  });

  it('returns empty string for non-strings', () => {
    expect(bandLabelToKey(null)).toBe('');
    expect(bandLabelToKey(undefined)).toBe('');
  });
});

describe('getCtaCopy', () => {
  it('returns archetype-keyed copy for the archetype diagnostics', () => {
    const friend = getCtaCopy('supervisor-blind-spot', 'friend');
    expect(friend.headline).toMatch(/being liked is not the same as being trusted/i);
    expect(friend.button).toBeTruthy();
  });

  it('returns band-keyed copy for the scored diagnostics', () => {
    const drag = getCtaCopy('dqi', 'decision-drag');
    expect(drag.headline).toMatch(/decisions are taking longer/i);
  });

  it('fills the {lowest_dimension} token in Org Pulse copy', () => {
    const filled = getCtaCopy('org-pulse', 'pressure-building', { lowestDimension: 'Accountability' });
    expect(filled.headline).toContain('Accountability');
    expect(filled.body).toContain('Accountability');
    expect(filled.headline).not.toContain('{lowest_dimension}');
  });

  it('falls back to a readable phrase when lowestDimension is missing', () => {
    const filled = getCtaCopy('org-pulse', 'pressure-building');
    expect(filled.headline).toContain('your lowest dimension');
    expect(filled.headline).not.toContain('{lowest_dimension}');
  });

  it('returns null for an unknown diagnostic or result so the caller can use the generic CTA', () => {
    expect(getCtaCopy('nope', 'whatever')).toBeNull();
    expect(getCtaCopy('supervisor-blind-spot', 'not-a-real-archetype')).toBeNull();
    expect(getCtaCopy('supervisor-blind-spot', null)).toBeNull();
  });

  it('has copy for every supervisor archetype and both scored bands set', () => {
    expect(Object.keys(CTA_COPY['supervisor-blind-spot'])).toHaveLength(8);
    expect(Object.keys(CTA_COPY['workplace-read'])).toHaveLength(5);
    expect(Object.keys(CTA_COPY['dqi'])).toHaveLength(3);
    expect(Object.keys(CTA_COPY['org-pulse'])).toHaveLength(3);
  });

  it('uses no em dashes in any CTA copy', () => {
    const all = JSON.stringify(CTA_COPY);
    expect(all).not.toContain('—');
  });
});
