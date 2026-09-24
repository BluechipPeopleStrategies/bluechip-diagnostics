// Free AI Opportunity Check: 12-question stepper data + the hours-range engine.
// Source of truth: BlueChip/projects/ai-audit/free-check-range-spec.md, "FINAL STRINGS (launch)".
// Net rates come from the Audit Opportunity Finder (automation-calculator.html): the study's
// saving rate minus a checking allowance. Versioned here, with sources, per Future Self's condition.
export const RATE_TABLE = {
  correspondence: {
    label: 'Routine correspondence', low: 0.12, likely: 0.22,
    sources: ['Noy & Zhang 2023 (Science)', 'Brynjolfsson et al. 2025 (QJE)'],
  },
  reports: {
    label: 'Recurring reports', low: 0.08, likely: 0.18,
    sources: ["Dell'Acqua et al. 2023 (HBS/BCG)", 'UK GDS Copilot 2025'],
  },
  meetings: {
    label: 'Meeting follow-through', low: 0.25, likely: 0.38,
    sources: ['UK Government "Minute" trial 2025', 'Magic Notes council evaluation 2024'],
  },
  search: {
    label: 'Finding information', low: 0.10, likely: 0.25,
    sources: ['Australian Government Copilot trial 2024'],
  },
  // Conservative floor for areas with no directly matching study. Can only understate.
  floor: {
    label: 'Not sure yet', low: 0.05, likely: 0.15,
    sources: ['UK GDS 2025', 'HMRC controlled evaluation (conservative floor)'],
  },
};

// Q2 area value -> RATE_TABLE row. [NEEDS: source] rows (scheduling/invoicing/hiring) use the floor
// until a task-specific rate is confirmed; see the spec's "Data rules" table.
export const AREA_RATE_MAP = {
  correspondence: 'correspondence',
  enquiries: 'correspondence',
  reports: 'reports',
  proposals: 'reports',
  meetingNotes: 'meetings',
  caseNotes: 'meetings',
  findingInfo: 'search',
  scheduling: 'floor',
  invoicing: 'floor',
  hiring: 'floor',
  notSureArea: 'floor',
};

export const AREAS = [
  ['correspondence', 'Emails and correspondence'],
  ['reports', 'Recurring reports'],
  ['meetingNotes', 'Meeting notes and follow-up'],
  ['findingInfo', 'Finding information'],
  ['scheduling', 'Scheduling and bookings'],
  ['invoicing', 'Invoices, receipts and data entry'],
  ['hiring', 'Hiring and onboarding'],
  ['enquiries', 'Customer or public enquiries'],
  ['caseNotes', 'Client or case notes'],
  ['proposals', 'Proposals, quotes and grant applications'],
  ['notSureArea', 'Not sure yet'],
];
export const AREA_LABELS = Object.fromEntries(AREAS);

// Q1 org type -> areas we'd suggest looking at, mapped onto the Q2 value set. Advice, not data;
// shown as "where we'd also look", never presented as a finding. [NEEDS: source]
export const ORG_AREA_SUGGESTIONS = {
  professional: ['correspondence', 'proposals', 'findingInfo'],
  trades: ['scheduling', 'proposals', 'invoicing'],
  healthcare: ['caseNotes', 'scheduling', 'enquiries'],
  retail: ['enquiries', 'scheduling', 'invoicing'],
  postsecondary: ['meetingNotes', 'enquiries', 'findingInfo'],
  municipal: ['meetingNotes', 'correspondence', 'findingInfo'],
  nonprofit: ['meetingNotes', 'reports', 'caseNotes'],
  other: ['correspondence', 'meetingNotes', 'reports'],
};

// Q7 org size band -> the cap this file uses on "people" in an area's row (the band's top;
// 1,000 for "More than 500" is the existing input maximum).
export const ORG_SIZE_PEOPLE_CAP = {
  '1-10': 10,
  '11-50': 50,
  '51-200': 200,
  '201-500': 500,
  '500+': 1000,
};

// Org size (Q7) is asked after the area sliders (Q2), so the people stepper has no team-size
// cap to apply yet while the visitor is answering Q2. This is its fallback ceiling until Q7 is
// answered, per Thomas's "max from team size or 500."
export const PEOPLE_MAX_BEFORE_ORG_SIZE = 500;

export const HOUR_CAP_PER_AREA = 25; // hours a week, one person, per area (the slider's hard max)
export const HOUR_CAP_TOTAL = 30;    // hours a week, one person, summed across every picked area

export const questions = [
  {
    id: 'orgType', number: 1, type: 'single',
    label: 'What kind of organization is this?',
    options: [
      ['professional', 'Professional services (law, accounting, consulting and similar)'],
      ['trades', 'Trades or construction'],
      ['healthcare', 'Health care or clinic'],
      ['retail', 'Retail or hospitality'],
      ['postsecondary', 'Post-secondary'],
      ['municipal', 'Municipal or other public sector'],
      ['nonprofit', 'Nonprofit'],
      ['other', 'Other'],
    ],
  },
  {
    id: 'areas', number: 2, type: 'multi', maxPicks: 4,
    label: 'Where would you most like time back? Pick up to four.',
    options: [...AREAS.map(([v, l], i) => [v, l, i === AREAS.length - 1])],
  },
  {
    id: 'toolsToday', number: 3, type: 'multi',
    label: 'Which tools does your team use every day? Pick all that apply.',
    options: [
      ['m365', 'Microsoft 365'],
      ['google', 'Google Workspace'],
      ['industry', 'Industry software (for example practice management, ERP or CRM)'],
      ['accounting', 'Accounting software'],
      ['notSureTools', 'Not sure', true],
    ],
  },
  {
    id: 'aiTools', number: 4, type: 'multi',
    label: 'Which AI tools does your team already use? Pick all that apply.',
    options: [
      ['none', 'None yet', true],
      ['chatgpt', 'ChatGPT'],
      ['copilot', 'Microsoft Copilot'],
      ['gemini', 'Google Gemini'],
      ['claude', 'Claude'],
      ['notetakers', 'Meeting note-takers (for example Otter, Fireflies or Teams recap)'],
      ['builtin', 'AI built into our other software'],
      ['other', 'Other or not sure'],
    ],
  },
  {
    id: 'information', number: 5, type: 'multi',
    label: 'What kinds of information does this work involve? Pick all that apply.',
    options: [
      ['public', 'Public or non-sensitive information'],
      ['internal', 'Internal business information'],
      ['payroll', 'Employee or payroll information'],
      ['customer', 'Client or customer personal information'],
      ['health', 'Health information'],
      ['student', 'Student records'],
      ['legal', 'Legal or investigation material'],
      ['notSureInfo', 'Not sure'],
    ],
  },
  {
    id: 'readiness', number: 6, type: 'single',
    label: 'Could someone on your team put a plan in place?',
    options: [
      ['assign', 'Yes, we can assign someone'],
      ['maybe', 'Maybe, once we know more'],
      ['approvals', "We'd need approvals first"],
    ],
  },
  {
    id: 'orgSize', number: 7, type: 'single',
    label: 'How many people work in your organization?',
    options: [
      ['1-10', '1 to 10'],
      ['11-50', '11 to 50'],
      ['51-200', '51 to 200'],
      ['201-500', '201 to 500'],
      ['500+', 'More than 500'],
    ],
  },
  {
    id: 'owner', number: 8, type: 'single',
    label: "Who would own this work on your side?",
    options: [
      ['exec', 'Owner or executive'],
      ['opsManager', 'Office or operations manager'],
      ['it', 'IT staff or IT provider'],
      ['hr', 'HR'],
      ['someoneElse', 'Someone else'],
      ['nobody', 'Nobody yet'],
    ],
  },
  {
    id: 'heldBack', number: 9, type: 'multi',
    label: 'What has held you back so far? Pick all that apply.',
    options: [
      ['notSureStart', 'Not sure where to start'],
      ['privacySecurity', 'Privacy or security worries'],
      ['staffHesitant', 'Staff are hesitant'],
      ['noTime', 'No time to set it up'],
      ['triedDidntStick', "Tried tools that didn't stick"],
      ['budget', 'Budget'],
      ['nothing', 'Nothing so far', true],
    ],
  },
  {
    id: 'feel', number: 10, type: 'single',
    label: 'How does your team feel about AI right now?',
    options: [
      ['keen', 'Mostly keen'],
      ['mixed', 'Mixed'],
      ['worried', 'Mostly worried'],
      ['notSureFeel', 'Not sure'],
    ],
  },
  {
    id: 'timing', number: 11, type: 'single',
    label: 'When would you want to start?',
    options: [
      ['thisMonth', 'This month'],
      ['thisQuarter', 'This quarter'],
      ['laterThisYear', 'Later this year'],
      ['exploring', 'Just exploring'],
    ],
  },
];

export function isComplete(q, answers) {
  const v = answers[q.id];
  return q.type === 'multi' ? Array.isArray(v) && v.length > 0 : !!v;
}

// Toggling one option in a "pick all"/"pick up to N" question. Picking an option marked
// exclusive clears the rest; picking any other option clears an exclusive pick already made.
export function toggleMulti(current = [], value, options, maxPicks) {
  const exclusiveValues = options.filter(o => o[2]).map(o => o[0]);
  if (current.includes(value)) return current.filter(v => v !== value);
  if (exclusiveValues.includes(value)) return [value];
  const next = current.filter(v => !exclusiveValues.includes(v));
  if (maxPicks && next.length >= maxPicks) return next; // at the cap: ignore further picks
  return [...next, value];
}

export function peopleCapForOrgSize(orgSize) {
  return ORG_SIZE_PEOPLE_CAP[orgSize] || ORG_SIZE_PEOPLE_CAP['1-10'];
}

// A clean representative headcount for an org-size band (used to default the "what if more of
// your team works like this" slider, and to carry a team size across to the plan page).
export const ORG_SIZE_MIDPOINT = {
  '1-10': 5,
  '11-50': 25,
  '51-200': 100,
  '201-500': 300,
  '500+': 500,
};
export function orgSizeMidpoint(orgSize) {
  return ORG_SIZE_MIDPOINT[orgSize] || 25;
}

export function rateForArea(area) {
  return RATE_TABLE[AREA_RATE_MAP[area]] || RATE_TABLE.floor;
}

// Clamp each row's hours at HOUR_CAP_PER_AREA, then scale every row proportionally if the total
// across rows exceeds HOUR_CAP_TOTAL, so the calculator never assumes any one person works more
// hours than a real week allows. Returns { rows, capped } (capped is true if either cap bound).
export function capRowHours(rows) {
  let capped = false;
  const clamped = rows.map(r => {
    const raw = Number(r.hours) || 0;
    const h = Math.min(HOUR_CAP_PER_AREA, Math.max(0, raw));
    if (h !== raw) capped = true;
    return { ...r, hours: h };
  });
  const total = clamped.reduce((sum, r) => sum + r.hours, 0);
  if (total <= HOUR_CAP_TOTAL || total === 0) return { rows: clamped, capped };
  const scale = HOUR_CAP_TOTAL / total;
  return { rows: clamped.map(r => ({ ...r, hours: r.hours * scale })), capped: true };
}

// net range = hours spent x people x [low, likely] net rate for the row's area, summed across
// rows. orgSize (Q7) may not be known yet (the visitor is still on Q2), so the people cap falls
// back to PEOPLE_MAX_BEFORE_ORG_SIZE until it is.
export function computeRange(rows, orgSize) {
  const peopleCap = orgSize ? peopleCapForOrgSize(orgSize) : PEOPLE_MAX_BEFORE_ORG_SIZE;
  const { rows: capped, capped: hoursCapped } = capRowHours(rows);
  let low = 0, likely = 0, peopleCapped = false;
  const detail = capped.map(r => {
    const rawPeople = Number(r.people) || 0;
    const people = Math.min(peopleCap, Math.max(0, rawPeople));
    if (people !== rawPeople) peopleCapped = true;
    const rate = rateForArea(r.area);
    const rowLow = r.hours * people * rate.low;
    const rowLikely = r.hours * people * rate.likely;
    low += rowLow; likely += rowLikely;
    return { area: r.area, hours: r.hours, people, low: rowLow, likely: rowLikely, rate };
  });
  return { low, likely, rows: detail, hoursCapped, peopleCapped, capped: hoursCapped || peopleCapped };
}

// Total per-person hours across the picked areas (after capping), clamped to the plan page's
// carry-over slider range. Used for the "See how the plan works" handoff.
export function perPersonHoursForCarry(rows) {
  const { rows: capped } = capRowHours(rows);
  const total = capped.reduce((sum, r) => sum + r.hours, 0);
  return Math.min(10, Math.max(0.5, Math.round(total * 2) / 2));
}

// Area labels are written for tile/heading use ("Emails and correspondence"), capitalized as
// their own line. Interpolated into running prose they need to read as a normal phrase.
export function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

// "A", "A and B", "A, B, and C". The serial (Oxford) comma is kept even at two items on
// purpose: several area labels already contain an internal ", " ("Proposals, quotes and grant
// applications", "Invoices, receipts and data entry"), and dropping the comma before the final
// "and" reads as one run-on list when a label like that is adjacent to it.
export function joinList(items) {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}, and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function suggestedAreas(orgType, pickedAreas = []) {
  const suggested = ORG_AREA_SUGGESTIONS[orgType] || ORG_AREA_SUGGESTIONS.other;
  return suggested.filter(a => !pickedAreas.includes(a)).slice(0, 3);
}

// Display rules: whole hours ("under 1" instead of 0), dollars to the nearest C$100 (nearest
// C$1,000 above C$100k, where the extra precision stops meaning anything). If rounding makes
// low equal likely, the caller shows "about {likely} hours a week" instead of a range.
export function roundHoursLabel(n) {
  if (n <= 0) return '0';
  if (n < 1) return 'under 1';
  return String(Math.round(n));
}
// Per-area bars: one decimal under 10 hours ("0.4 to 0.8"), whole hours above, so small areas
// never read as "under 1 to under 1".
export function areaHoursLabel(n) {
  if (!(n > 0)) return '0';
  return n < 10 ? (Math.round(n * 10) / 10).toFixed(1) : String(Math.round(n));
}
export function roundDollars(n) {
  return n > 100000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100;
}
export function money(n) {
  return 'C$' + Math.round(n).toLocaleString('en-CA');
}
// Cap on the scaled "what if more of your team works like this" hours display, so a pathological
// headcount x rate combination never renders an absurd number.
export const HOURS_DISPLAY_CAP = 10000;

// "0.5 hours", "1 hour", "2 hours" -- half-steps are real inputs here (the plan-page slider
// moves in 0.5s), and "1 hours" is simply wrong. Rounds to the nearest half hour.
export function formatHours(n) {
  const rounded = Math.round(Number(n) * 2) / 2;
  const label = Number.isInteger(rounded)
    ? rounded.toLocaleString('en-CA')
    : rounded.toLocaleString('en-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${label} ${rounded === 1 ? 'hour' : 'hours'}`;
}

// At most one tailored line: the sensitive-information add-on wins outright if it applies,
// otherwise the single most relevant line from the AI-tools answer or the "what's held you
// back" / owner / feel / timing priority list.
export function tailoredLines(answers) {
  const information = answers.information || [];
  const sensitiveKeys = ['payroll', 'customer', 'health', 'student', 'legal', 'notSureInfo'];
  const sensitive = information.some(v => sensitiveKeys.includes(v));
  if (sensitive) {
    return ['If some of your work is sensitive, it may need private or approved tools, and we check that before the plan recommends anything.'];
  }

  const aiTools = answers.aiTools || [];
  let q4Line = null;
  if (aiTools.some(v => ['copilot', 'gemini', 'builtin'].includes(v))) {
    q4Line = 'You may already have licences or features that cover some of this. The plan starts with what you have before suggesting anything new.';
  } else if (aiTools.includes('none')) {
    q4Line = "You'd be starting fresh, so the plan begins with the tools you already pay for.";
  }
  if (q4Line) return [q4Line];

  const heldBack = answers.heldBack || [];
  const owner = answers.owner;
  const feel = answers.feel;
  const timing = answers.timing;
  const priority = [
    heldBack.includes('triedDidntStick') && "The plan starts with one workflow, redesigned from start to finish, so there's one clear place to begin.",
    (heldBack.includes('staffHesitant') || feel === 'worried') && 'The redesigned workflow keeps human checkpoints in place, so your people stay in charge of what goes out.',
    owner === 'nobody' && "The redesigned workflow names who's responsible for each step, so the work has an owner before it starts.",
    heldBack.includes('notSureStart') && 'The plan ranks what it finds, so you know which opportunity to start with.',
    heldBack.includes('noTime') && 'The plan lists the setup effort for each recommendation, so you can see what it asks of your team before you commit to anything.',
    heldBack.includes('budget') && 'The plan lists the expected software cost of each recommendation, and it starts with tools you already pay for where they fit.',
    heldBack.includes('privacySecurity') && 'The plan includes practical guidance on which information should go into which tool.',
    owner === 'it' && 'Your IT team gets written setup steps for the redesigned workflow and guidance on which information goes where.',
    timing === 'exploring' && "If you're just exploring, this estimate may be all you need for now.",
  ].filter(Boolean);
  return priority.slice(0, 1);
}

// Legacy ?workflow= values from the pre-launch 6-question check, kept working per the launch
// rules ("keep query params such as ?workflow= working") so old shared links do not break.
export const LEGACY_WORKFLOW_LABELS = {
  correspondence: 'Routine correspondence',
  reporting: 'Recurring reports',
  meetings: 'Meeting follow-through',
  search: 'Finding information',
  unsure: 'Your recurring work',
};

// people = how many staff get time back; hours = hours a week each (used by the plan page's own
// inline "what could that time be worth" calculator; defaults keep the one-person maths).
export function teamHours({ hours, people = 1 }) {
  const h = Number(hours), p = Number(people);
  if (![h, p].every(Number.isFinite) || h <= 0 || p <= 0) return 0;
  return h * p;
}
export function estimateCapacity({ hours, rate, weeks, people = 1 }) {
  const r = Number(rate), w = Number(weeks), t = teamHours({ hours, people });
  if (![r, w].every(Number.isFinite) || r <= 0 || w <= 0 || t <= 0) return 0;
  return t * r * w;
}
