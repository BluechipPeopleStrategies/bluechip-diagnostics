import { describe, it, expect } from 'vitest';
import {
  computeRange, capRowHours, roundHoursLabel, roundDollars, money,
  toggleMulti, peopleCapForOrgSize, rateForArea, suggestedAreas, bandLine,
  tailoredLines, questions, HOUR_CAP_PER_AREA, HOUR_CAP_TOTAL,
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
    Object.values(rateForArea('correspondence')).forEach(() => {});
    const rate = rateForArea('meetings');
    expect(rate).not.toHaveProperty('high');
    expect(Object.keys(rate).sort()).toEqual(['label', 'likely', 'low', 'sources'].sort());
  });
});

describe('caps', () => {
  it('caps a single row at 20 hours a week per area', () => {
    const { rows, capped } = capRowHours([{ area: 'correspondence', hours: 25, people: 1 }]);
    expect(rows[0].hours).toBe(HOUR_CAP_PER_AREA);
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
  it('caps people at the team size from question 8', () => {
    expect(peopleCapForOrgSize('1-10')).toBe(10);
    expect(peopleCapForOrgSize('500+')).toBe(1000);
    const { rows, peopleCapped } = computeRange([{ area: 'correspondence', hours: 5, people: 999 }], '1-10');
    expect(rows[0].people).toBe(10);
    expect(peopleCapped).toBe(true);
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
  it('formats money with the C$ prefix and thousands separators', () => {
    expect(money(9600)).toBe('C$9,600');
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

describe('suggested areas and the band line', () => {
  it('suggests up to three areas the visitor did not already pick', () => {
    const areas = suggestedAreas('professional', ['correspondence']);
    expect(areas).not.toContain('correspondence');
    expect(areas.length).toBeLessThanOrEqual(3);
  });
  it('picks the right band line for low/likely against the 5-hour threshold', () => {
    expect(bandLine(6, 8)).toMatch(/even the low end/);
    expect(bandLine(3, 6)).toMatch(/your range crosses/);
    expect(bandLine(1, 2)).toMatch(/may not be the right next step/);
  });
});

describe('tailored lines', () => {
  it('shows the sensitive add-on when information includes a sensitive category', () => {
    const lines = tailoredLines({ information: ['payroll'] });
    expect(lines[0]).toMatch(/private or approved tools/);
  });
  it('never shows more than one Q4 line plus up to two Q9-Q12 lines (max 3 total, plus the sensitive add-on)', () => {
    const lines = tailoredLines({
      information: ['payroll'],
      aiTools: ['chatgpt'],
      heldBack: ['triedDidntStick', 'budget'],
      owner: 'nobody',
    });
    expect(lines.length).toBeLessThanOrEqual(4);
  });
  it('returns no lines for a neutral answer set', () => {
    expect(tailoredLines({})).toEqual([]);
  });
});
