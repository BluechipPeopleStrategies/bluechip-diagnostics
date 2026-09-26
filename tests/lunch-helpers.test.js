import { describe, it, expect } from 'vitest';
import { isHoneypot, sanitizeRegistration, validateRegistration } from '../api/_lib/lunch-helpers.js';

describe('isHoneypot', () => {
  it('flags a filled trap field', () => {
    expect(isHoneypot({ bc_hp_trap: 'anything' })).toBe(true);
  });
  it('ignores an empty or missing trap field', () => {
    expect(isHoneypot({ bc_hp_trap: '' })).toBe(false);
    expect(isHoneypot({})).toBe(false);
  });
  it('never treats a "company" field as the trap (the old, since-fixed field name)', () => {
    expect(isHoneypot({ company: 'Acme Ltd' })).toBe(false);
  });
});

describe('sanitizeRegistration', () => {
  it('drops unknown topic ids and de-duplicates', () => {
    const clean = sanitizeRegistration({ topics: ['email', 'email', 'not-real', 'privacy'] });
    expect(clean.topics).toEqual(['email', 'privacy']);
  });

  it('only accepts an integer comfort level from 1 to 5', () => {
    expect(sanitizeRegistration({ comfortLevel: 3 }).comfortLevel).toBe(3);
    expect(sanitizeRegistration({ comfortLevel: 0 }).comfortLevel).toBe(null);
    expect(sanitizeRegistration({ comfortLevel: 6 }).comfortLevel).toBe(null);
    expect(sanitizeRegistration({ comfortLevel: '3' }).comfortLevel).toBe(null);
  });

  it('records consent exactly: only a literal boolean true counts as consent', () => {
    expect(sanitizeRegistration({ nextSessionConsent: true }).nextSessionConsent).toBe(true);
    expect(sanitizeRegistration({ nextSessionConsent: false }).nextSessionConsent).toBe(false);
    expect(sanitizeRegistration({}).nextSessionConsent).toBe(false);
    expect(sanitizeRegistration({ nextSessionConsent: 'true' }).nextSessionConsent).toBe(false);
    expect(sanitizeRegistration({ nextSessionConsent: 1 }).nextSessionConsent).toBe(false);
  });

  it('trims and caps free-text fields', () => {
    const clean = sanitizeRegistration({ name: '  Jo  ', oneThing: 'x'.repeat(500) });
    expect(clean.name).toBe('Jo');
    expect(clean.oneThing.length).toBe(220);
  });

  it('defaults page to /lunch', () => {
    expect(sanitizeRegistration({}).page).toBe('/lunch');
  });
});

describe('validateRegistration', () => {
  it('requires a name', () => {
    expect(validateRegistration({ name: '', email: 'a@b.ca' })).toEqual({ ok: false, error: 'missing_name' });
  });
  it('requires a plausible email', () => {
    expect(validateRegistration({ name: 'Jo', email: 'not-an-email' })).toEqual({ ok: false, error: 'invalid_email' });
    expect(validateRegistration({ name: 'Jo', email: '' })).toEqual({ ok: false, error: 'invalid_email' });
  });
  it('passes with a name and a valid email', () => {
    expect(validateRegistration({ name: 'Jo', email: 'jo@example.ca' })).toEqual({ ok: true });
  });
});
