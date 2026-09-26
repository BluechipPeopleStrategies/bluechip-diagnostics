import { describe, it, expect } from 'vitest';
import { buildIcs } from '../shared/ics.js';
import { zonedTimeToUtc, formatInTimeZone } from '../shared/tz.js';

describe('zonedTimeToUtc (America/Edmonton)', () => {
  it('resolves an October wall-clock time to MDT (UTC-6)', () => {
    // Oct 14 2026 is inside daylight saving time in Edmonton (MDT ends the first Sunday of
    // November), so 12:00 local should be 18:00 UTC.
    const d = zonedTimeToUtc('2026-10-14T12:00:00', 'America/Edmonton');
    expect(d.toISOString()).toBe('2026-10-14T18:00:00.000Z');
  });

  it('resolves a January wall-clock time to MST (UTC-7), proving this is not a hardcoded offset', () => {
    const d = zonedTimeToUtc('2026-01-14T12:00:00', 'America/Edmonton');
    expect(d.toISOString()).toBe('2026-01-14T19:00:00.000Z');
  });

  it('formatInTimeZone reads back the same wall-clock time it was given', () => {
    const d = zonedTimeToUtc('2026-10-14T12:00:00', 'America/Edmonton');
    const parts = formatInTimeZone(d, 'America/Edmonton', { hour: 'numeric', minute: '2-digit', hour12: true });
    expect(parts.hour).toBe('12');
    expect(parts.minute).toBe('00');
    expect(parts.dayPeriod).toBe('PM');
  });
});

describe('buildIcs', () => {
  const start = zonedTimeToUtc('2026-10-14T12:00:00', 'America/Edmonton');
  const dtstamp = new Date('2026-09-25T00:00:00Z');

  it('emits correct UTC start/end times for America/Edmonton and a 15-minute VALARM', () => {
    const ics = buildIcs({
      uid: 'test-uid@bluechip-people-strategies.com',
      start,
      durationMinutes: 45,
      title: 'Session 1: Routine email, handled',
      description: 'Join here: https://bluechip-people-strategies.com/lunch/live',
      url: 'https://bluechip-people-strategies.com/lunch/live',
      dtstamp,
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261014T180000Z');
    expect(ics).toContain('DTEND:20261014T184500Z'); // 45 minutes later
    expect(ics).toContain('DTSTAMP:20260925T000000Z');
    expect(ics).toContain('SUMMARY:Session 1: Routine email\\, handled');
    expect(ics).toContain('URL:https://bluechip-people-strategies.com/lunch/live');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('ACTION:DISPLAY');
    expect(ics).toContain('END:VALARM');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
    // RFC5545 requires CRLF line endings.
    expect(ics.includes('\r\n')).toBe(true);
  });

  it('escapes commas, semicolons and newlines in TEXT fields', () => {
    const ics = buildIcs({
      uid: 'test-uid-2@bluechip-people-strategies.com',
      start,
      durationMinutes: 45,
      title: 'A, title; with special chars',
      description: 'line one\nline two',
      url: 'https://example.com',
      dtstamp,
    });
    expect(ics).toContain('SUMMARY:A\\, title\\; with special chars');
    expect(ics).toContain('line one\\nline two');
  });

  it('supports a custom alarm lead time', () => {
    const ics = buildIcs({
      uid: 'test-uid-3@bluechip-people-strategies.com',
      start,
      durationMinutes: 45,
      title: 'Custom alarm',
      description: 'desc',
      url: 'https://example.com',
      alarmMinutesBefore: 30,
      dtstamp,
    });
    expect(ics).toContain('TRIGGER:-PT30M');
  });
});
