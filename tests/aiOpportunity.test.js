import { describe, it, expect } from 'vitest';
import {
  computeRange, capRowHours, roundHoursLabel, roundDollars, money, formatHours,
  toggleMulti, orgSizeMidpoint, rateForArea, suggestedAreas,
  tailoredLines, questions, HOUR_CAP_PER_AREA, HOUR_CAP_TOTAL, PEOPLE_MAX,
  lowerFirst, joinList, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
  AREAS, AREA_RATE_MAP, RATE_TABLE, groupedOptions, sanitizeAreaLabel, sanitizeShortText,
  areaLookoutLines, OTHER_AREA_LOOKOUT, crossCuttingCards, nextSteps, ORG_AREA_SUGGESTIONS,
  areaHoursRangeLabel, isSingularHourLabel, areaWeeklyLabel, minutesLabel,
  GUARANTEE_NET_HOURS, ILLUSTRATION_RATE, ILLUSTRATION_WEEKS,
} from '../src/lib/aiOpportunity';

describe('range maths', () => {
  it('multiplies hours x people x the low/likely net rate for the row area', () => {
    const { low, likely, rows } = computeRange([{ area: 'correspondence', hours: 5, people: 2 }]);
    expect(rows[0].people).toBe(2);
    expect(low).toBeCloseTo(5 * 2 * 0.12, 6);
    expect(likely).toBeCloseTo(5 * 2 * 0.22, 6);
  });
  it('sums multiple rows', () => {
    const { low, likely } = computeRange([
      { area: 'correspondence', hours: 5, people: 1 },
      { area: 'reports', hours: 3, people: 2 },
    ]);
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
  // Org size (Q7) plays no part in the maths (Thomas, 2026-09-24 correction): computeRange takes
  // only rows, and the flat 500-person cap applies the same whether or not Q7 has been answered.
  it('caps people at a flat 500, with no org-size argument at all', () => {
    const { rows } = computeRange([{ area: 'correspondence', hours: 5, people: 999 }]);
    expect(rows[0].people).toBe(PEOPLE_MAX);
    expect(PEOPLE_MAX).toBe(500);
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
  it('the flat 500-person cap does not change with a large org size (org size does not scale it)', () => {
    const small = computeRange([{ area: 'correspondence', hours: 5, people: 999 }]);
    const large = computeRange([{ area: 'correspondence', hours: 5, people: 999 }]);
    expect(small.rows[0].people).toBe(500);
    expect(large.rows[0].people).toBe(500);
    expect(small.peopleCapped).toBe(true);
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
  it('stops adding once the pick cap (6) is reached', () => {
    const six = ['correspondence', 'reports', 'meetingNotes', 'findingInfo', 'scheduling', 'invoicing'];
    expect(toggleMulti(six, 'hiring', q.options, q.maxPicks)).toEqual(six);
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
  it('the six-pick cap holds with the larger option set', () => {
    const q = questions.find(q => q.id === 'areas');
    const six = ['correspondence', 'writingEditing', 'research', 'otherArea', 'spreadsheets', 'policies'];
    expect(toggleMulti(six, 'socialContent', q.options, q.maxPicks)).toEqual(six);
  });
  it('"Other (type your own)" uses the floor rate, so it can only understate', () => {
    expect(rateForArea('otherArea')).toEqual(rateForArea('notSureArea'));
    expect(AREA_RATE_MAP.otherArea).toBe('floor');
  });
});

describe('"Answering staff questions" area (2026-09-24 org-wide-estimate pass)', () => {
  it('maps to the "Finding information" rate bucket, no new numbers', () => {
    expect(AREA_RATE_MAP.staffQuestions).toBe('search');
    expect(rateForArea('staffQuestions')).toEqual(RATE_TABLE.search);
  });
  it('is a Q2 tile with a label naming policies, onboarding and how-to', () => {
    expect(AREAS.some(([v]) => v === 'staffQuestions')).toBe(true);
    const label = AREAS.find(([v]) => v === 'staffQuestions')[1];
    expect(label).toBe('Answering staff questions (policies, onboarding, how-to)');
  });
  it('is offered as a suggested area for municipal, postsecondary, nonprofit and healthcare orgs', () => {
    ['municipal', 'postsecondary', 'nonprofit', 'healthcare'].forEach(orgType => {
      expect(ORG_AREA_SUGGESTIONS[orgType]).toContain('staffQuestions');
      // Appended as the 4th candidate: only surfaces once one of the top 3 is already picked.
      expect(suggestedAreas(orgType, [])).not.toContain('staffQuestions');
      const firstThreePicked = ORG_AREA_SUGGESTIONS[orgType].slice(0, 3);
      expect(suggestedAreas(orgType, firstThreePicked)).toContain('staffQuestions');
    });
  });
});

describe('Q2 pick limit raised to six (2026-09-24 org-wide-estimate pass)', () => {
  it('maxPicks is 6, and the label says "Pick up to six"', () => {
    const q = questions.find(q => q.id === 'areas');
    expect(q.maxPicks).toBe(6);
    expect(q.label).toBe('Where would you most like time back? Pick up to six.');
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

describe('areaHoursRangeLabel (collapses to one number when equal, never "X to X")', () => {
  it('shows a range when the two values round differently', () => {
    expect(areaHoursRangeLabel(0.6, 1.1)).toBe('0.6 to 1.1');
    expect(areaHoursRangeLabel(1.0, 2.0)).toBe('1.0 to 2.0');
  });
  it('collapses to one number when both values round to the same label', () => {
    expect(areaHoursRangeLabel(0.4, 0.9)).toBe('0.4 to 0.9'); // genuinely different, stays a range
    expect(areaHoursRangeLabel(0.41, 0.44)).toBe('0.4'); // both round to 0.4 -- collapses
    expect(areaHoursRangeLabel(0, 0)).toBe('0');
  });
  it('never produces "under 1 to under 1" -- the bug this helper replaces', () => {
    // Proposals alone at the default 5 hrs x 1 person (reports rate 0.08/0.18): low=0.4, likely=0.9.
    const label = areaHoursRangeLabel(5 * 1 * 0.08, 5 * 1 * 0.18);
    expect(label).not.toMatch(/under 1 to under 1/);
    expect(label).toBe('0.4 to 0.9');
  });
});

describe('isSingularHourLabel (Infy edit, 2026-09-24: "1 hr back a week", not "1 hrs")', () => {
  it('is true only for the collapsed single-value case when that value is exactly 1', () => {
    expect(isSingularHourLabel('1.0')).toBe(true);
  });
  it('is false for any other collapsed value', () => {
    expect(isSingularHourLabel('0.4')).toBe(false);
    expect(isSingularHourLabel('2.0')).toBe(false);
    expect(isSingularHourLabel('0')).toBe(false);
  });
  it('is false for a genuine range, even one that starts or ends at 1', () => {
    expect(isSingularHourLabel('1.0 to 2.0')).toBe(false);
    expect(isSingularHourLabel('0.6 to 1.1')).toBe(false);
  });
});

describe('live-preview sum: correspondence + proposals at the default 5 hrs x 1 person', () => {
  it('reproduces the exact scenario Thomas reported and confirms the sum is correct (not a dropped-area bug)', () => {
    // correspondence (0.12/0.22) + proposals, mapped to "reports" (0.08/0.18): low 0.6+0.4=1.0,
    // likely 1.1+0.9=2.0. Verified this matches the live app via CDP before writing this test --
    // the "under 1 to under 1" report traced to picking a single low-rate area (or lower hours),
    // not a state bug that drops a picked area from the sum.
    const rows = [
      { area: 'correspondence', hours: 5, people: 1 },
      { area: 'proposals', hours: 5, people: 1 },
    ];
    const { low, likely, rows: detail } = computeRange(rows, undefined);
    expect(low).toBeCloseTo(1.0, 6);
    expect(likely).toBeCloseTo(2.0, 6);
    expect(detail).toHaveLength(2); // both picked areas present, none dropped
    expect(areaHoursRangeLabel(low, likely)).toBe('1.0 to 2.0');
  });
});

describe('Q3 (toolsToday) option list, 2026-09-24 revision', () => {
  const q3 = questions.find(q => q.id === 'toolsToday');
  it('has the full list in the specified order, ending with Other then Not sure', () => {
    expect(q3.options.map(o => o[0])).toEqual([
      'm365', 'google', 'accounting', 'hrPayroll', 'industry', 'projectMgmt',
      'chatVideo', 'designDocs', 'toolsOther', 'notSureTools',
    ]);
  });
  it('keeps "Not sure" as the sole exclusive pick', () => {
    expect(q3.options.filter(o => o[2])).toEqual([['notSureTools', 'Not sure', true]]);
  });
  it('does not feed tailoredLines, crossCuttingCards or nextSteps -- new values are safe by construction', () => {
    const answers = { toolsToday: ['hrPayroll', 'projectMgmt', 'chatVideo', 'designDocs', 'toolsOther'] };
    expect(tailoredLines(answers)).toEqual([]);
    expect(crossCuttingCards(answers)).toEqual([]);
    expect(nextSteps(answers, null)).toHaveLength(3); // falls back to the generic 3, unaffected
  });
});

describe('the guarantee threshold', () => {
  it('is pinned at 3 net hours a week (Thomas, 2026-09-25), with the C$40 x 48-week illustration unchanged', () => {
    expect(GUARANTEE_NET_HOURS).toBe(3);
    expect(ILLUSTRATION_RATE).toBe(40);
    expect(ILLUSTRATION_WEEKS).toBe(48);
    expect(GUARANTEE_NET_HOURS * ILLUSTRATION_WEEKS).toBe(144);
    expect(money(GUARANTEE_NET_HOURS * ILLUSTRATION_WEEKS * ILLUSTRATION_RATE)).toBe('C$5,760');
  });
});

describe('2026-09-25 polish: grouping, copy, minutes (items 45, 48, 49, 53)', () => {
  it('every grouped question puts each option in exactly one group, and groups only name real options', () => {
    for (const q of questions.filter(q => q.groups)) {
      const values = q.options.map(o => o[0]);
      const grouped = q.groups.flatMap(g => g.values);
      grouped.forEach(v => expect(values, `${q.id}: ${v}`).toContain(v));
      expect(new Set(grouped).size, `${q.id} has a value in two groups`).toBe(grouped.length);
      // aiTools deliberately leaves "None yet" ungrouped (rendered first); every other grouped
      // question covers all of its options.
      const ungrouped = values.filter(v => !grouped.includes(v));
      if (q.id === 'aiTools') expect(ungrouped).toEqual(['none']);
      else expect(ungrouped, q.id).toEqual([]);
      // groupedOptions renders every option exactly once
      const rendered = groupedOptions(q).flatMap(b => b.options.map(o => o[0]));
      expect(rendered.sort()).toEqual([...values].sort());
    }
  });

  it('groups the long lists: areas, tools today, information and protect-info', () => {
    ['areas', 'toolsToday', 'information', 'protectInfo', 'aiTools'].forEach(id =>
      expect(questions.find(q => q.id === id).groups, id).toBeTruthy());
  });

  it('the areas exclusive "Not sure yet" pick is still the last option (so it stays exclusive)', () => {
    const areas = questions.find(q => q.id === 'areas');
    expect(areas.options.filter(o => o[2]).map(o => o[0])).toEqual(['notSureArea']);
  });

  it('says "Choose all that apply" everywhere, never "Pick" or "Click all that apply" (Q1)', () => {
    const labels = questions.map(q => q.label).join(' ');
    expect(labels).not.toMatch(/(Pick|Click) all that apply/);
    expect(labels.match(/Choose all that apply\./g).length).toBe(5);
  });

  it('adds "Depends on the day" to the team-feeling question without touching the other values', () => {
    const feel = questions.find(q => q.id === 'feel');
    expect(feel.options.map(o => o[0])).toEqual(['keen', 'mixed', 'worried', 'variesFeel', 'notSureFeel']);
    expect(feel.options.find(o => o[0] === 'variesFeel')[1]).toBe('Depends on the day');
  });

  it('per-area weekly figures read in minutes under an hour, hours above', () => {
    expect(areaWeeklyLabel(0.4, 0.9)).toBe('24 to 54 min/week');
    expect(areaWeeklyLabel(0.6, 1.1)).toBe('36 min to 1.1 hrs/week');
    expect(areaWeeklyLabel(1.2, 2.5)).toBe('1.2 to 2.5 hrs/week');
    expect(areaWeeklyLabel(0.5, 0.5)).toBe('30 min/week');
    expect(areaWeeklyLabel(1, 1)).toBe('1.0 hr/week');
    expect(areaWeeklyLabel(0, 0)).toBe('0 min/week');
    expect(minutesLabel(0.25)).toBe('15');
  });
});
