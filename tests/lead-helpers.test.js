import { describe, it, expect } from 'vitest';
import { isHoneypot, sanitizeLead, validateLead, formatLeadSms } from '../api/_lib/lead-helpers.js';

describe('isHoneypot', () => {
  it('is true when company is filled', () => {
    expect(isHoneypot({ company: 'Acme' })).toBe(true);
  });
  it('is false when company is empty or missing', () => {
    expect(isHoneypot({ company: '' })).toBe(false);
    expect(isHoneypot({})).toBe(false);
  });
});

describe('sanitizeLead', () => {
  it('trims and defaults missing fields to empty string', () => {
    const out = sanitizeLead({ name: '  Jane  ', need: 'help', contact: 'jane@x.ca' });
    expect(out).toEqual({ name: 'Jane', need: 'help', contact: 'jane@x.ca', source: '', consent: false });
  });
  it('captures texting consent as a boolean', () => {
    expect(sanitizeLead({ name: 'Jane', need: 'help', contact: 'x', consent: true }).consent).toBe(true);
    expect(sanitizeLead({ name: 'Jane', need: 'help', contact: 'x', consent: 'true' }).consent).toBe(true);
    expect(sanitizeLead({ name: 'Jane', need: 'help', contact: 'x' }).consent).toBe(false);
  });
  it('caps field lengths', () => {
    const out = sanitizeLead({ name: 'a'.repeat(200), need: 'b'.repeat(2000), contact: 'c'.repeat(300), source: 'd'.repeat(200) });
    expect(out.name.length).toBe(120);
    expect(out.need.length).toBe(1500);
    expect(out.contact.length).toBe(200);
    expect(out.source.length).toBe(100);
  });
});

describe('validateLead', () => {
  it('ok when all required present', () => {
    expect(validateLead({ name: 'Jane', need: 'help', contact: 'x@y.ca' })).toEqual({ ok: true });
  });
  it('fails when a required field is empty', () => {
    expect(validateLead({ name: '', need: 'help', contact: 'x@y.ca' })).toEqual({ ok: false, error: 'missing_required_fields' });
  });
});

describe('formatLeadSms', () => {
  it('renders the lead with source and consent', () => {
    const msg = formatLeadSms({ name: 'Jane Doe', need: 'Termination help', contact: 'jane@x.ca', source: 'homepage chat', consent: true });
    expect(msg).toContain('New BlueChip lead');
    expect(msg).toContain('Name: Jane Doe');
    expect(msg).toContain('Need: Termination help');
    expect(msg).toContain('Contact: jane@x.ca');
    expect(msg).toContain('Texting consent: yes');
    expect(msg).toContain('(from homepage chat)');
  });
  it('marks missing consent as NO', () => {
    expect(formatLeadSms({ name: 'Jane', need: 'help', contact: 'x', source: '', consent: false })).toContain('Texting consent: NO');
  });
  it('omits the source line when source is empty', () => {
    const msg = formatLeadSms({ name: 'Jane', need: 'help', contact: 'x@y.ca', source: '' });
    expect(msg).not.toContain('(from');
  });
});
