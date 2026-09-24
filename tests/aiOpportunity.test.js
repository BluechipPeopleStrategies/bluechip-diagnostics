import { describe, it, expect } from 'vitest';
import {
  computeRange, capRowHours, roundHoursLabel, roundDollars, money, formatHours,
  toggleMulti, peopleCapForOrgSize, orgSizeMidpoint, rateForArea, suggestedAreas,
  tailoredLines, questions, HOUR_CAP_PER_AREA, HOUR_CAP_TOTAL, PEOPLE_MAX_BEFORE_ORG_SIZE,
  lowerFirst, joinList, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
} from '../src/lib/aiOpportunity';

describe('range maths', () => {
  it('multiplies hours x people x the low/likely net rate for the row area', () => {
    const { low, likely, rows } = computeRange([{ area: 'correspondence', hours: 5, people: 2 }], '11-50');
    expect(rows[0].people).toBe(2);
    expect(low).toBeCloseTo(5 * 2 * 0.12, 6);
    expect(likely).toBeCloseTo(5 * 2 * 0.22, 6);
  });
  it('sums multiple rows', () => {
    const { low, likely } = computeRange([
      { area: 'correspondence', hours: 5, people: 1 },
      { area: 'reports', hours: 3, people: 2 },
    ], '11-50');
    expect(low).toBeCloseTo(5 * 1 * 0.12 + 3 * 2 * 0.08, 6);
    expect(likely).toBeCloseTo(5 * 1 * 0.22 + 3 * 2 * 0.18, 6);
  });
  it('uses the floor rate for areas with no direct study match', () => {
    expect(rateForArea('scheduling')).toEqual(rateForArea('notSureArea'));
    expect(rateForArea('scheduling').low).toBe(0.05);
  });
  it('never uses a high rate, only low and likely', () => {
    const rate = rateForArea('meetings');
    expect(rate).not.toHaveProperty('high');
    expect(Object.keys(rate).sort()).toEqual(['label', 'likely', 'low', 'sources'].sort());
  });
  it('falls back to a 500-person cap when org size is not answered yet (still on Q2)', () => {
    const { rows } = computeRange([{ area: 'correspondence', hours: 5, people: 999 }], undefined);
    expect(rows[0].people).toBe(PEOPLE_MAX_BEFORE_ORG_SIZE);
  });
});

describe('caps', () => {
  it('caps a single row at 25 hours a week per area', () => {
    const { rows, capped } = capRowHours([{ area: 'correspondence', hours: 40, people: 1 }]);
    expect(rows[0].hours).toBe(HOUR_CAP_PER_AREA);
    expect(HOUR_CAP_PER_AREA).toBe(25);
    expect(capped).toBe(true);
  });
  it('leaves rows under the caps untouched', () => {
    const { rows, capped } = capRowHours([{ hours: 5 }, { hours: 10 }]);
    expect(rows.map(r => r.hours)).toEqual([5, 10]);
    expect(capped).toBe(false);
  });
  it('scales every row proportionally when the total exceeds 30 hours a week', () => {
    const { rows, capped } = capRowHours([{ hours: 20 }, { hours: 20 }]);
    const total = rows.reduce((s, r) => s + r.hours, 0);
    expect(total).toBeCloseTo(HOUR_CAP_TOTAL, 6);
    expect(rows[0].hours).toBeCloseTo(rows[1].hours, 6);
    expect(capped).toBe(true);
  });
  it('caps people at the team size from question 7 once it is known', () => {
    expect(peopleCapForOrgSize('1-10')).toBe(10);
    expect(peopleCapForOrgSize('500+')).toBe(1000);
    const { rows, peopleCapped } = computeRange([{ area: 'correspondence', hours: 5, people: 999 }], '1-10');
    expect(rows[0].people).toBe(10);
    expect(peopleCapped).toBe(true);
  });
});

describe('org size midpoints (headcount defaults and plan-page carry-over)', () => {
  it('gives a clean representative headcount per band', () => {
    expect(orgSizeMidpoint('1-10')).toBe(5);
    expect(orgSizeMidpoint('51-200')).toBe(100);
    expect(orgSizeMidpoint('500+')).toBe(500);
  });
  it('defaults to 25 when org size is unknown', () => {
    expect(orgSizeMidpoint(undefined)).toBe(25);
  });
});

describe('carry-over to the plan page', () => {
  it('sums and caps per-person hours across picked areas, clamped to the plan-page slider range', () => {
    expect(perPersonHoursForCarry([{ area: 'correspondence', hours: 3 }])).toBe(3);
    expect(perPersonHoursForCarry([{ area: 'correspondence', hours: 0.2 }])).toBe(0.5);
    expect(perPersonHoursForCarry([{ area: 'correspondence', hours: 25 }, { area: 'reports', hours: 25 }])).toBeLessThanOrEqual(10);
  });
});

describe('display rounding', () => {
  it('rounds hours to whole numbers', () => {
    expect(roundHoursLabel(4.4)).toBe('4');
    expect(roundHoursLabel(4.6)).toBe('5');
  });
  it('shows "under 1" instead of 0 for a sub-hour result', () => {
    expect(roundHoursLabel(0.4)).toBe('under 1');
    expect(roundHoursLabel(0)).toBe('0');
  });
  it('rounds dollars to the nearest C$100', () => {
    expect(roundDollars(9640)).toBe(9600);
    expect(roundDollars(9660)).toBe(9700);
  });
  it('rounds dollars to the nearest C$1,000 above C$100k', () => {
    expect(roundDollars(104200)).toBe(104000);
    expect(roundDollars(104600)).toBe(105000);
  });
  it('formats money with the C$ prefix and thousands separators', () => {
    expect(money(9600)).toBe('C$9,600');
  });
  it('caps the display cap constant at 10,000 hours', () => {
    expect(HOURS_DISPLAY_CAP).toBe(10000);
  });
});

describe('hour pluralization (formatHours)', () => {
  it('shows a half hour as "0.5 hours"', () => {
    expect(formatHours(0.5)).toBe('0.5 hours');
  });
  it('singularizes exactly one hour', () => {
    expect(formatHours(1)).toBe('1 hour');
  });
  it('pluralizes two or more hours', () => {
    expect(formatHours(2)).toBe('2 hours');
    expect(formatHours(1.5)).toBe('1.5 hours');
  });
  it('rounds to the nearest half hour', () => {
    expect(formatHours(1.24)).toBe('1 hour');
    expect(formatHours(1.26)).toBe('1.5 hours');
  });
  it('adds a thousands separator for large totals (e.g. hours a year across a big team)', () => {
    expect(formatHours(23040)).toBe('23,040 hours');
  });
});

describe('multi-select state', () => {
  const q = questions.find(q => q.id === 'areas');
  it('adds a pick', () => {
    expect(toggleMulti([], 'correspondence', q.options, q.maxPicks)).toEqual(['correspondence']);
  });
  it('removes an existing pick', () => {
    expect(toggleMulti(['correspondence', 'reports'], 'correspondence', q.options, q.maxPicks)).toEqual(['reports']);
  });
  it('stops adding once the pick cap is reached', () => {
    const four = ['correspondence', 'reports', 'meetingNotes', 'findingInfo'];
    expect(toggleMulti(four, 'scheduling', q.options, q.maxPicks)).toEqual(four);
  });
  it('picking the exclusive option clears every other pick', () => {
    expect(toggleMulti(['correspondence', 'reports'], 'notSureArea', q.options, q.maxPicks)).toEqual(['notSureArea']);
  });
  it('picking a normal option clears a standing exclusive pick', () => {
    expect(toggleMulti(['notSureArea'], 'correspondence', q.options, q.maxPicks)).toEqual(['correspondence']);
  });
});

describe('the check is 11 questions (Q5 workload merged into Q2)', () => {
  it('has 11 questions, numbered 1 to 11', () => {
    expect(questions.length).toBe(11);
    expect(questions.map(q => q.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it('no longer has a standalone workload question', () => {
    expect(questions.find(q => q.id === 'workload')).toBeUndefined();
  });
});

describe('suggested areas', () => {
  it('suggests up to three areas the visitor did not already pick', () => {
    const areas = suggestedAreas('professional', ['correspondence']);
    expect(areas).not.toContain('correspondence');
    expect(areas.length).toBeLessThanOrEqual(3);
  });
});

describe('sentence casing and list join for area names', () => {
  it('lowercases only the first character', () => {
    expect(lowerFirst('Emails and correspondence')).toBe('emails and correspondence');
    expect(lowerFirst('Proposals, quotes and grant applications')).toBe('proposals, quotes and grant applications');
  });
  it('joins a single item as-is', () => {
    expect(joinList(['finding information'])).toBe('finding information');
  });
  it('joins two items with a comma before "and" (an item may already contain an internal comma)', () => {
    expect(joinList(['proposals, quotes and grant applications', 'finding information']))
      .toBe('proposals, quotes and grant applications, and finding information');
  });
  it('joins three or more items with a serial comma', () => {
    expect(joinList(['a', 'b', 'c'])).toBe('a, b, and c');
  });
  it('returns an empty string for no items', () => {
    expect(joinList([])).toBe('');
  });
});

describe('tailored lines: at most one, sensitive wins outright', () => {
  it('shows only the sensitive add-on when information includes a sensitive category, even with other signals present', () => {
    const lines = tailoredLines({ information: ['payroll'], aiTools: ['chatgpt'], heldBack: ['triedDidntStick'] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/private or approved tools/);
  });
  it('falls back to the Q4 AI-tools line when nothing is sensitive', () => {
    const lines = tailoredLines({ aiTools: ['copilot'] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/licences or features/);
  });
  it('falls back to a single held-back/owner/feel/timing line when neither applies', () => {
    const lines = tailoredLines({ heldBack: ['budget'] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/software cost/);
  });
  it('returns no lines for a neutral answer set', () => {
    expect(tailoredLines({})).toEqual([]);
  });
});
