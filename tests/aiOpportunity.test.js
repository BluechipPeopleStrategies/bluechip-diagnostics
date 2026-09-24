import { describe, it, expect } from 'vitest';
import {
  computeRange, capRowHours, roundHoursLabel, roundDollars, money, formatHours,
  toggleMulti, peopleCapForOrgSize, orgSizeMidpoint, rateForArea, suggestedAreas,
  tailoredLines, questions, HOUR_CAP_PER_AREA, HOUR_CAP_TOTAL, PEOPLE_MAX_BEFORE_ORG_SIZE,
  lowerFirst, joinList, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
  AREAS, AREA_RATE_MAP, RATE_TABLE, groupedOptions, sanitizeAreaLabel, sanitizeShortText,
  areaLookoutLines, OTHER_AREA_LOOKOUT, crossCuttingCards, nextSteps,
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

describe('the check is 12 questions (protectInfo added after "information")', () => {
  it('has 12 questions, numbered 1 to 12', () => {
    expect(questions.length).toBe(12);
    expect(questions.map(q => q.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('no longer has a standalone workload question', () => {
    expect(questions.find(q => q.id === 'workload')).toBeUndefined();
  });
  it('places the new protectInfo question right after information', () => {
    const infoIndex = questions.findIndex(q => q.id === 'information');
    expect(questions[infoIndex + 1].id).toBe('protectInfo');
  });
});

describe('new Q2 area tiles (2026-09-24)', () => {
  const newAreas = ['writingEditing', 'research', 'spreadsheets', 'socialContent', 'trainingMaterials', 'policies'];
  it('maps each new area to an existing rate bucket, no new numbers', () => {
    expect(AREA_RATE_MAP.writingEditing).toBe('correspondence');
    expect(AREA_RATE_MAP.research).toBe('search');
    expect(AREA_RATE_MAP.spreadsheets).toBe('reports');
    expect(AREA_RATE_MAP.socialContent).toBe('correspondence');
    expect(AREA_RATE_MAP.trainingMaterials).toBe('reports');
    expect(AREA_RATE_MAP.policies).toBe('reports');
    newAreas.forEach(a => expect(rateForArea(a)).toEqual(RATE_TABLE[AREA_RATE_MAP[a]]));
  });
  it('keeps "Not sure yet" as the sole exclusive pick, last in the list', () => {
    const q = questions.find(q => q.id === 'areas');
    expect(AREAS[AREAS.length - 1][0]).toBe('notSureArea');
    expect(q.options[q.options.length - 1]).toEqual(['notSureArea', 'Not sure yet', true]);
    expect(q.options.filter(o => o[2])).toHaveLength(1);
  });
  it('the four-pick cap still holds with the larger option set', () => {
    const q = questions.find(q => q.id === 'areas');
    const four = ['correspondence', 'writingEditing', 'research', 'otherArea'];
    expect(toggleMulti(four, 'policies', q.options, q.maxPicks)).toEqual(four);
  });
  it('"Other (type your own)" uses the floor rate, so it can only understate', () => {
    expect(rateForArea('otherArea')).toEqual(rateForArea('notSureArea'));
    expect(AREA_RATE_MAP.otherArea).toBe('floor');
  });
});

describe('sanitizing visitor-typed text (Other area, Q9 someone-else)', () => {
  it('trims, caps at 60 characters, and strips angle brackets', () => {
    expect(sanitizeAreaLabel('  grant reporting  ')).toBe('grant reporting');
    expect(sanitizeAreaLabel('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    expect(sanitizeAreaLabel('a'.repeat(90)).length).toBe(60);
  });
  it('falls back to "Other work" when empty', () => {
    expect(sanitizeAreaLabel('')).toBe('Other work');
    expect(sanitizeAreaLabel('   ')).toBe('Other work');
    expect(sanitizeAreaLabel(undefined)).toBe('Other work');
  });
  it('sanitizeShortText has no fallback -- an empty optional field stays empty', () => {
    expect(sanitizeShortText('  finance lead  ')).toBe('finance lead');
    expect(sanitizeShortText('')).toBe('');
    expect(sanitizeShortText('<b>x</b>')).toBe('bx/b');
  });
});

describe('grouped options (aiTools)', () => {
  it('buckets the aiTools question into its three named groups plus an ungrouped "None yet"', () => {
    const q = questions.find(q => q.id === 'aiTools');
    const buckets = groupedOptions(q);
    expect(buckets[0].label).toBeNull();
    expect(buckets[0].options.map(o => o[0])).toEqual(['none']);
    const labels = buckets.slice(1).map(b => b.label);
    expect(labels).toEqual(['General assistants', 'Built into Microsoft or Google', 'Meeting and other']);
  });
  it('includes every new AI tool in the general-assistants group', () => {
    const q = questions.find(q => q.id === 'aiTools');
    const general = groupedOptions(q).find(b => b.label === 'General assistants').options.map(o => o[0]);
    ['deepseek', 'kimi', 'perplexity', 'grok', 'metaAi', 'mistral'].forEach(v => expect(general).toContain(v));
  });
  it('a question with no groups renders as a single ungrouped bucket', () => {
    const q = questions.find(q => q.id === 'orgType');
    expect(groupedOptions(q)).toEqual([{ label: null, options: q.options }]);
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
  it('when sensitive info is picked and the team uses DeepSeek or Kimi, names the overseas-storage line instead of the generic sensitive line', () => {
    const lines = tailoredLines({ information: ['health'], aiTools: ['deepseek'] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Some AI tools store what you type on servers outside Canada. It is worth checking where each tool keeps your data before you use it with sensitive information.');
    const kimi = tailoredLines({ information: ['legal'], aiTools: ['kimi'] });
    expect(kimi[0]).toMatch(/servers outside Canada/);
  });
  it('when sensitive info is picked with no formal protection, uses the policy-first line (and it loses to the overseas-tool line if both apply)', () => {
    const lines = tailoredLines({ information: ['student'], protectInfo: ['nothingFormal'] });
    expect(lines).toEqual(['A short written AI-use policy is often the simplest first step to protect sensitive information.']);
    const both = tailoredLines({ information: ['student'], protectInfo: ['noIdeaProtect'], aiTools: ['deepseek'] });
    expect(both[0]).toMatch(/servers outside Canada/);
  });
  it('the plain sensitive line still applies when neither the AI-tool nor the protection condition is met', () => {
    const lines = tailoredLines({ information: ['customer'], aiTools: ['chatgpt'], protectInfo: ['writtenPolicy'] });
    expect(lines[0]).toMatch(/private or approved tools/);
  });
  it('names a neutral outside-guidance line when Q9 owner is "We\'d want outside guidance"', () => {
    const lines = tailoredLines({ owner: 'outsideGuidance' });
    expect(lines).toEqual(['Some teams bring in outside help for their first workflow. Others start with one small workflow in-house and build from there.']);
  });
  it('keeps the "no named owner" line for the renamed "It varies, or no one yet" value', () => {
    const lines = tailoredLines({ owner: 'variesOrNoOne' });
    expect(lines[0]).toMatch(/named owner before the work starts/);
  });
});

describe('"what we\'d look at" area lookout lines', () => {
  it('gives every AREAS value (except the exclusive "not sure yet") its own 2-3 line set', () => {
    for (const [value] of AREAS) {
      if (value === 'notSureArea') continue;
      const lines = areaLookoutLines(value);
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.length).toBeLessThanOrEqual(3);
    }
  });
  it('falls back to the generic Other set for an unlisted area (e.g. a typed-in "Other")', () => {
    expect(areaLookoutLines('otherArea')).toEqual(OTHER_AREA_LOOKOUT);
    expect(areaLookoutLines('somethingNotInTheMap')).toEqual(OTHER_AREA_LOOKOUT);
  });
  it('never names a specific tool or vendor', () => {
    const vendors = /chatgpt|copilot|gemini|claude|deepseek|kimi|perplexity|grok|meta ai|mistral/i;
    for (const [value] of AREAS) {
      areaLookoutLines(value).forEach(line => expect(line).not.toMatch(vendors));
    }
  });
});

describe('cross-cutting "what we\'d look at" cards (up to 2, priority ordered)', () => {
  it('shows Information handling when sensitive info has weak protection', () => {
    const cards = crossCuttingCards({ information: ['health'], protectInfo: ['nothingFormal'] });
    expect(cards[0].title).toBe('Information handling');
  });
  it('does not show Information handling when protection is not weak', () => {
    const cards = crossCuttingCards({ information: ['health'], protectInfo: ['writtenPolicy'] });
    expect(cards.find(c => c.title === 'Information handling')).toBeUndefined();
  });
  it('shows "Tools you already have" when the team uses Copilot or Gemini', () => {
    const cards = crossCuttingCards({ aiTools: ['copilot'] });
    expect(cards.some(c => c.title === 'Tools you already have')).toBe(true);
  });
  it('shows "Who\'ll run it" for low tech comfort or wanting outside guidance', () => {
    expect(crossCuttingCards({ readiness: 'notYetReady' }).some(c => c.title === "Who'll run it")).toBe(true);
    expect(crossCuttingCards({ owner: 'outsideGuidance' }).some(c => c.title === "Who'll run it")).toBe(true);
  });
  it('never returns more than 2 cards, even when every condition matches', () => {
    const cards = crossCuttingCards({
      information: ['health'], protectInfo: ['nothingFormal'],
      aiTools: ['copilot'], readiness: 'notYetReady', owner: 'outsideGuidance',
    });
    expect(cards.length).toBeLessThanOrEqual(2);
    expect(cards[0].title).toBe('Information handling'); // the safety-relevant card wins the priority order
  });
  it('returns an empty array when nothing matches', () => {
    expect(crossCuttingCards({})).toEqual([]);
  });
});

describe('"free next steps" (always exactly 3, tailored and deduplicated)', () => {
  it('always returns exactly 3 steps, even for a neutral answer set', () => {
    expect(nextSteps({}, null)).toHaveLength(3);
  });
  it('leads with a time-the-top-area step when a top area label is given', () => {
    const steps = nextSteps({}, 'emails and correspondence');
    expect(steps[0]).toMatch(/Track the time spent on emails and correspondence for one week/);
  });
  it('includes the write-a-policy step when sensitive info has weak protection', () => {
    const steps = nextSteps({ information: ['health'], protectInfo: ['noIdeaProtect'] }, 'a top area');
    expect(steps.some(s => s.includes('one-page rule'))).toBe(true);
  });
  it('never duplicates a step even if multiple conditions would produce the same one', () => {
    const steps = nextSteps({ information: ['health'], protectInfo: ['nothingFormal'] }, null);
    const unique = new Set(steps);
    expect(unique.size).toBe(steps.length);
  });
  it('never names a specific tool or vendor', () => {
    const vendors = /chatgpt|copilot|gemini|claude|deepseek|kimi|perplexity|grok|meta ai|mistral/i;
    nextSteps({ heldBack: ['notSureStart', 'staffHesitant', 'budget'], owner: 'variesOrNoOne' }, 'a top area')
      .forEach(s => expect(s).not.toMatch(vendors));
  });
});
