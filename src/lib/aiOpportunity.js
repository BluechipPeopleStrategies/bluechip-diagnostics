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
  // New area tiles (2026-09-24): mapped onto the existing rate buckets, no new numbers.
  writingEditing: 'correspondence',
  research: 'search',
  spreadsheets: 'reports',
  socialContent: 'correspondence',
  trainingMaterials: 'reports',
  policies: 'reports',
  // Typed-in "Other" area: always the most conservative rate, so it can only understate.
  otherArea: 'floor',
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
  ['writingEditing', 'Writing and editing (grammar, tone, proofreading)'],
  ['research', 'Research and summarizing documents'],
  ['spreadsheets', 'Spreadsheets and data cleanup'],
  ['socialContent', 'Social posts, newsletters and marketing copy'],
  ['trainingMaterials', 'Training materials and how-to guides'],
  ['policies', 'Policies, procedures and templates'],
  ['otherArea', 'Other (type your own)'],
  // Exclusive pick (see `questions` below, which marks the LAST entry exclusive) -- keep this
  // last so a new area added above doesn't silently become the exclusive one.
  ['notSureArea', 'Not sure yet'],
];
export const AREA_LABELS = Object.fromEntries(AREAS);

const AREA_TEXT_MAX = 60;
// Sanitizes a visitor-typed area label (the "Other" tile): trims, caps length, and falls back
// to a neutral default when empty. React already escapes text content when rendered as {label}
// (never dangerouslySetInnerHTML), so this is display-shaping plus a defensive strip of angle
// brackets -- belt and suspenders against a future render change, not the only thing protecting
// against markup injection.
export function sanitizeAreaLabel(raw) {
  const trimmed = String(raw || '').replace(/[<>]/g, '').trim().slice(0, AREA_TEXT_MAX);
  return trimmed || 'Other work';
}

// Same idea for the Q9 "Someone else" free-text follow-up: optional, so an empty result stays
// empty rather than getting a fallback label.
export function sanitizeShortText(raw, max = AREA_TEXT_MAX) {
  return String(raw || '').replace(/[<>]/g, '').trim().slice(0, max);
}

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
      ['claude', 'Claude'],
      ['perplexity', 'Perplexity'],
      ['deepseek', 'DeepSeek'],
      ['kimi', 'Kimi'],
      ['grok', 'Grok'],
      ['metaAi', 'Meta AI'],
      ['mistral', 'Mistral Le Chat'],
      ['copilot', 'Microsoft Copilot'],
      ['gemini', 'Google Gemini'],
      ['notetakers', 'Meeting note-takers (for example Otter, Fireflies or Teams recap)'],
      ['builtin', 'AI built into our other software'],
      ['other', 'Other or not sure'],
    ],
    // Small group headers so a 13-option grid still scans, not a data field of its own.
    groups: [
      { label: 'General assistants', values: ['chatgpt', 'claude', 'perplexity', 'deepseek', 'kimi', 'grok', 'metaAi', 'mistral'] },
      { label: 'Built into Microsoft or Google', values: ['copilot', 'gemini'] },
      { label: 'Meeting and other', values: ['notetakers', 'builtin', 'other'] },
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
    id: 'protectInfo', number: 6, type: 'multi',
    label: 'What do you currently do to protect sensitive information? Pick all that apply.',
    options: [
      ['ownDevices', 'Files stay on our own computers or servers'],
      ['googleWorkspace', 'Google Workspace (Drive, Gmail)'],
      ['microsoft365', 'Microsoft 365 (SharePoint, OneDrive, Teams)'],
      ['itManaged', 'Our IT provider manages it'],
      ['writtenPolicy', 'We have a written policy on AI use'],
      ['staffAsked', 'Staff are asked not to paste sensitive information into AI tools'],
      ['approvedList', 'We have a list of approved AI tools'],
      ['accessControls', 'Access controls or permissions on sensitive files'],
      ['nothingFormal', 'Nothing formal yet', true],
      ['noIdeaProtect', 'I have no idea', true],
    ],
  },
  {
    id: 'readiness', number: 7, type: 'single',
    label: 'Is there someone on your team who is comfortable setting up new tech or AI tools?',
    options: [
      ['yesHaveSomeone', 'Yes, we have someone'],
      ['somewhatGuidance', "Somewhat, they'd want some guidance"],
      ['notYetReady', 'Not yet'],
      ['notSureReady', 'Not sure'],
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
    label: 'Who usually leads new tools or process changes in your organization?',
    options: [
      ['exec', 'Owner or executive'],
      ['opsManager', 'Office or operations manager'],
      ['it', 'IT staff or IT provider'],
      ['hr', 'HR'],
      ['someoneElse', 'Someone else'],
      ['outsideGuidance', "We'd want outside guidance"],
      ['variesOrNoOne', 'It varies, or no one yet'],
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

// Buckets a question's options for grouped rendering (currently just `aiTools`). Any option not
// covered by a group's `values` stays in an ungrouped bucket rendered first (e.g. "None yet").
export function groupedOptions(question) {
  if (!question.groups) return [{ label: null, options: question.options }];
  const grouped = new Set(question.groups.flatMap(g => g.values));
  const ungrouped = question.options.filter(([v]) => !grouped.has(v));
  const buckets = [];
  if (ungrouped.length) buckets.push({ label: null, options: ungrouped });
  for (const g of question.groups) {
    const opts = question.options.filter(([v]) => g.values.includes(v));
    if (opts.length) buckets.push({ label: g.label, options: opts });
  }
  return buckets;
}

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
  const aiTools = answers.aiTools || [];
  if (sensitive) {
    // Most specific, actionable line first: a named tool with an actual data-location question
    // outranks a general "no policy yet" nudge, which outranks the generic fallback.
    const overseasTool = aiTools.some(v => ['deepseek', 'kimi'].includes(v));
    if (overseasTool) {
      return ['Some AI tools store what you type on servers outside Canada. It is worth checking where each tool keeps your data before you use it with sensitive information.'];
    }
    const protectInfo = answers.protectInfo || [];
    const noProtection = protectInfo.some(v => ['nothingFormal', 'noIdeaProtect'].includes(v));
    if (noProtection) {
      return ['A short written AI-use policy is often the simplest first step to protect sensitive information.'];
    }
    return ['If some of your work is sensitive, it may need private or approved tools, and we check that before the plan recommends anything.'];
  }

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
    owner === 'variesOrNoOne' && "Workflows tend to hold up better when each step has a named owner before the work starts.",
    owner === 'outsideGuidance' && 'Some teams bring in outside help for their first workflow. Others start with one small workflow in-house and build from there.',
    heldBack.includes('notSureStart') && 'The plan ranks what it finds, so you know which opportunity to start with.',
    heldBack.includes('noTime') && 'The plan lists the setup effort for each recommendation, so you can see what it asks of your team before you commit to anything.',
    heldBack.includes('budget') && 'The plan lists the expected software cost of each recommendation, and it starts with tools you already pay for where they fit.',
    heldBack.includes('privacySecurity') && 'The plan includes practical guidance on which information should go into which tool.',
    owner === 'it' && 'Your IT team gets written setup steps for the redesigned workflow and guidance on which information goes where.',
    timing === 'exploring' && "If you're just exploring, this estimate may be all you need for now.",
  ].filter(Boolean);
  return priority.slice(0, 1);
}

// "What we'd look at, based on your answers" (result screen): 2-3 short, informational lines per
// picked area, never naming a specific tool. Every AREAS value gets its own set; anything not
// listed (shouldn't happen, but a typed-in area would otherwise have no set) falls back to
// OTHER_AREA_LOOKOUT, the same generic set the "Other" tile itself uses.
export const AREA_LOOKOUT = {
  correspondence: ['which replies repeat week to week', 'how long drafting takes versus checking', 'who reviews before anything goes out'],
  reports: ['which numbers get pulled the same way each time', 'how much of the report is copied from other sources', 'who checks the final version before it goes out'],
  meetingNotes: ['time spent writing up after meetings', 'whether action items get tracked', 'which meetings need a formal record'],
  findingInfo: ['how often the same question gets researched from scratch', 'where the answer usually already lives', 'how long a typical search takes'],
  scheduling: ['how much back and forth it takes to land on a time', 'how often a change means re-coordinating everyone', 'whether reminders happen automatically or by hand'],
  invoicing: ['how many fields get typed in by hand', 'how often the same data gets entered more than once', 'who double-checks the totals'],
  hiring: ['how long a job posting or offer letter takes to draft', 'how much paperwork repeats for every new hire', 'which onboarding steps are the same every time'],
  enquiries: ['which questions come up again and again', 'how long a typical reply takes to draft', 'which enquiries need judgment versus a standard answer'],
  caseNotes: ['how long notes take to write up after each contact', 'how consistent the format is from one note to the next', "who reviews notes before they're filed"],
  proposals: ['how many sections repeat from one proposal to the next', 'how long it takes to pull the numbers together', 'who signs off before it goes out'],
  writingEditing: ['how many drafts go through rounds of edits', "whether there's a house style to follow", 'how much editing is wording versus substance'],
  research: ['how long a typical summary takes to put together', 'how many sources usually get checked', 'how often the same document gets summarized for different audiences'],
  spreadsheets: ['how much of the work is copying, sorting or matching data by hand', 'how often the same cleanup steps repeat', "who checks the results before they're used"],
  socialContent: ['how long a typical post or newsletter takes to draft', 'how much of it follows a repeatable format', "who reviews before it's posted or sent"],
  trainingMaterials: ['how often materials need updating', 'how much content repeats across different guides', "who checks materials for accuracy before they're used"],
  policies: ['how often policies and templates need reviewing', 'how much wording repeats across documents', 'who signs off on changes'],
};
export const OTHER_AREA_LOOKOUT = ['how often it happens', 'how many steps are copy and paste', 'who checks the result'];
export function areaLookoutLines(area) {
  return AREA_LOOKOUT[area] || OTHER_AREA_LOOKOUT;
}

// Up to 2 cross-cutting "what we'd look at" cards, driven by answers other than the picked areas.
// Ordered by relevance (a safety-relevant signal outranks a general one); the caller takes the
// first 2. Never names a specific tool or vendor.
export function crossCuttingCards(answers) {
  const information = answers.information || [];
  const sensitiveKeys = ['payroll', 'customer', 'health', 'student', 'legal', 'notSureInfo'];
  const sensitive = information.some(v => sensitiveKeys.includes(v));
  const protectInfo = answers.protectInfo || [];
  const weakProtection = protectInfo.some(v => ['nothingFormal', 'noIdeaProtect'].includes(v));
  const aiTools = answers.aiTools || [];
  const hasExistingTools = aiTools.some(v => ['copilot', 'gemini'].includes(v));
  const lowComfort = ['notYetReady', 'somewhatGuidance'].includes(answers.readiness) || answers.owner === 'outsideGuidance';

  const candidates = [
    sensitive && weakProtection && {
      title: 'Information handling',
      lines: ['which information can go into which tool', 'whether staff have written guidance'],
    },
    hasExistingTools && {
      title: 'What you already pay for',
      lines: ['licences or features that may already cover some of this', 'which of those already fits this kind of work'],
    },
    lowComfort && {
      title: "Who'll run it",
      lines: ['pick one owner and start with one workflow', "what guidance or support they'd need to get started"],
    },
  ].filter(Boolean);
  return candidates.slice(0, 2);
}

// "Free next steps you can take this week" (result screen): exactly 3 tailored, doable-today
// steps, ordered by relevance to the answers, deduplicated by id, padded from a fixed default
// set if fewer than 3 conditions matched. Informational only, never names a specific tool.
export function nextSteps(answers, topAreaLabel) {
  const information = answers.information || [];
  const sensitiveKeys = ['payroll', 'customer', 'health', 'student', 'legal', 'notSureInfo'];
  const sensitive = information.some(v => sensitiveKeys.includes(v));
  const protectInfo = answers.protectInfo || [];
  const weakProtection = protectInfo.some(v => ['nothingFormal', 'noIdeaProtect'].includes(v));
  const heldBack = answers.heldBack || [];
  const feel = answers.feel;
  const owner = answers.owner;
  const readiness = answers.readiness;

  const candidates = [
    topAreaLabel && { id: 'timeTopArea', text: `Time ${topAreaLabel} for one week: a simple tally of task, minutes, and who did it.` },
    sensitive && weakProtection && { id: 'writePolicy', text: 'Write a one-page rule on what information should never go into an AI tool.' },
    heldBack.includes('notSureStart') && { id: 'rankTasks', text: 'List your three most repetitive tasks and rank them by how many hours a week they take.' },
    (heldBack.includes('staffHesitant') || feel === 'worried') && { id: 'askTeam', text: 'Ask two or three team members what would make them comfortable trying a new tool, before choosing one.' },
    heldBack.includes('budget') && { id: 'checkExisting', text: 'Check whether your current software already includes an AI feature you are not using yet.' },
    (owner === 'variesOrNoOne' || readiness === 'notYetReady' || readiness === 'somewhatGuidance') && { id: 'pickOwner', text: 'Pick one person to own trying one workflow for two weeks, even informally.' },
    { id: 'listTools', text: 'List the AI tools people on your team already use, including personal accounts.' },
  ].filter(Boolean);

  const seen = new Set();
  const picked = [];
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    picked.push(c.text);
    if (picked.length === 3) break;
  }
  // Fixed fallback, so the list is always exactly 3 even if very few conditions matched.
  const fallback = [
    { id: 'writePolicy', text: 'Write a one-page rule on what information should never go into an AI tool.' },
    { id: 'listTools', text: 'List the AI tools people on your team already use, including personal accounts.' },
    { id: 'rankTasks', text: 'List your three most repetitive tasks and rank them by how many hours a week they take.' },
  ];
  for (const f of fallback) {
    if (picked.length === 3) break;
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    picked.push(f.text);
  }
  return picked;
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
