import { describe, it, expect } from 'vitest';
import { buildClarityCallUrl } from '../src/lib/clarityCallUrl';

describe('buildClarityCallUrl', () => {
  const baseUrl = 'https://cal.com/thomas-slifka/clarity-call-free';

  it('appends diagnostic, tier, and total into the notes query param', () => {
    const url = buildClarityCallUrl({
      baseUrl,
      diagnosticId: 'org-pulse',
      tier: 'exposed',
      total: 42,
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(baseUrl);
    const notes = parsed.searchParams.get('notes');
    expect(notes).toContain('Diagnostic: org-pulse');
    expect(notes).toContain('Tier: exposed');
    expect(notes).toContain('Total: 42/100');
  });

  it('omits fields that are null or undefined from the notes', () => {
    const url = buildClarityCallUrl({
      baseUrl,
      diagnosticId: 'supervisor-blind-spot',
      tier: null,
      total: null,
    });
    const notes = new URL(url).searchParams.get('notes');
    expect(notes).toContain('Diagnostic: supervisor-blind-spot');
    expect(notes).not.toContain('Tier:');
    expect(notes).not.toContain('Total:');
  });

  it('returns the bare base URL when baseUrl is missing', () => {
    const url = buildClarityCallUrl({
      baseUrl: '',
      diagnosticId: 'dqi',
      tier: 'uneven',
      total: 60,
    });
    expect(url).toBe('');
  });

  it('URL-encodes spaces and special characters in the notes', () => {
    const url = buildClarityCallUrl({
      baseUrl,
      diagnosticId: 'workplace-read',
      tier: 'healthy & strong',
      total: 88,
    });
    const raw = url.split('?notes=')[1];
    expect(raw).not.toContain(' ');
    expect(raw).not.toContain('&');
    const notes = new URL(url).searchParams.get('notes');
    expect(notes).toContain('healthy & strong');
  });
});
