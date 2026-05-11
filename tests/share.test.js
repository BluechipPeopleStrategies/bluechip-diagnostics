import { describe, it, expect } from 'vitest';
import { encodeResult, decodeResult } from '../src/lib/share.js';

describe('share encoding', () => {
  it('round-trips a score result', () => {
    const original = { type: 'score', label: 'Mixed signal (62/100)' };
    const encoded = encodeResult(original);
    expect(decodeResult(encoded)).toEqual(original);
  });

  it('round-trips an archetype result', () => {
    const original = { type: 'archetype', label: 'the-fire-fighter' };
    expect(decodeResult(encodeResult(original))).toEqual(original);
  });

  it('returns null for malformed input', () => {
    expect(decodeResult('!!!not-base64!!!')).toBe(null);
  });

  it('handles labels containing colons', () => {
    const original = { type: 'score', label: 'Tier: 3/5' };
    expect(decodeResult(encodeResult(original))).toEqual(original);
  });
});
