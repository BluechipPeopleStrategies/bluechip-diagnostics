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

// Q8 org size band -> the cap this file uses on "people" in a calculator row (the band's top;
// 1,000 for "More than 500" is the existing input maximum).
export const ORG_SIZE_PEOPLE_CAP = {
  '1-10': 10,
  '11-50': 50,
  '51-200': 200,
  '201-500': 500,
  '500+': 1000,
};

export const HOUR_CAP_PER_AREA = 20; // hours a week, one person, per area
export const HOUR_CAP_TOTAL = 30;    // hours a week, one person, summed across every row

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
    id: 'workload', number: 5, type: 'single',
    label: 'Roughly how much time does the work you picked take each week, added up across everyone who does it?',
    options: [
      ['under5', 'Less than five hours'],
      ['5plus', 'Five hours or more'],
      ['unsure', "We haven't measured it"],
    ],
  },
  {
    id: 'information', number: 6, type: 'multi',
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
    id: 'readiness', number: 7, type: 'single',
    label: 'Could someone on your team put a plan in place?',
    options: [
      ['assign', 'Yes, we can assign someone'],
      ['maybe', 'Maybe, once we know more'],
      ['approvals', "We'd need approvals first"],
    ],
  },
  {
    id: 'orgSize', number: 8, type: 'single',
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
    id: 'owner', number: 9, type: 'single',
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
    id: 'heldBack', number: 10, type: 'multi',
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
    id: 'feel', number: 11, type: 'single',
    label: 'How does your team feel about AI right now?',
    options: [
      ['keen', 'Mostly keen'],
      ['mixed', 'Mixed'],
      ['worried', 'Mostly worried'],
      ['notSureFeel', 'Not sure'],
    ],
  },
  {
    id: 'timing', number: 12, type: 'single',
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

export function defaultHours(workload) {
  return workload === 'under5' ? 2 : 5;
}

export function peopleCapForOrgSize(orgSize) {
  return ORG_SIZE_PEOPLE_CAP[orgSize] || ORG_SIZE_PEOPLE_CAP['1-10'];
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

// net range = hours spent x people x [low, likely] net rate for the row's area, summed across rows.
export function computeRange(rows, orgSize) {
  const peopleCap = peopleCapForOrgSize(orgSize);
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

export function suggestedAreas(orgType, pickedAreas = []) {
  const suggested = ORG_AREA_SUGGESTIONS[orgType] || ORG_AREA_SUGGESTIONS.other;
  return suggested.filter(a => !pickedAreas.includes(a)).slice(0, 3);
}

// Display rules: whole hours ("under 1" instead of 0), dollars to the nearest C$100. If rounding
// makes low equal likely, the caller shows "about {likely} hours a week" instead of a range.
export function roundHoursLabel(n) {
  if (n <= 0) return '0';
  if (n < 1) return 'under 1';
  return String(Math.round(n));
}
export function roundDollars(n) {
  return Math.round(n / 100) * 100;
}
export function money(n) {
  return 'C$' + Math.round(n).toLocaleString('en-CA');
}

export function tailoredLines(answers) {
  const lines = [];
  const information = answers.information || [];
  const sensitiveKeys = ['payroll', 'customer', 'health', 'student', 'legal', 'notSureInfo'];
  const sensitive = information.some(v => sensitiveKeys.includes(v));
  if (sensitive) {
    lines.push('If some of your work is sensitive, it may need private or approved tools, and we check that before the plan recommends anything.');
  }

  const aiTools = answers.aiTools || [];
  let q4Line = null;
  if ((aiTools.includes('chatgpt') || aiTools.includes('claude')) && sensitive) {
    q4Line = 'If anyone uses a personal AI account for sensitive work, the plan covers which information can safely go into which tool.';
  } else if (aiTools.some(v => ['copilot', 'gemini', 'builtin'].includes(v))) {
    q4Line = 'You may already have licences or features that cover some of this. The plan starts with what you have before suggesting anything new.';
  } else if (aiTools.includes('none')) {
    q4Line = "You'd be starting fresh, so the plan begins with the tools you already pay for.";
  }
  if (q4Line) lines.push(q4Line);

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
    heldBack.includes('privacySecurity') && !sensitive && 'The plan includes practical guidance on which information can safely go into which tool.',
    owner === 'it' && 'Your IT team gets written setup steps for the redesigned workflow and guidance on which information goes where.',
    timing === 'exploring' && "If you're just exploring, this estimate may be all you need for now.",
  ].filter(Boolean);
  lines.push(...priority.slice(0, 2));

  return lines;
}

export function bandLine(low, likely) {
  if (low >= 5) return 'Across the areas you picked, even the low end of your range is above that line. The plan is where that gets checked.';
  if (likely >= 5) return 'Across the areas you picked, your range crosses that line, and the plan checks your actual work to see where you really land.';
  return 'Across the areas you picked, your range comes in under that line. The plan looks across your whole organization, but if these areas are most of your recurring work, the plan may not be the right next step yet.';
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
