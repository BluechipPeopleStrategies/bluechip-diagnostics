// Free AI Opportunity Check: 12-question stepper data + the hours-range engine.
// Source of truth: BlueChip/projects/ai-audit/free-check-range-spec.md, "FINAL STRINGS (launch)".
// Net rates come from the Audit Opportunity Finder (automation-calculator.html): the study's
// saving rate minus a checking allowance. Versioned here, with sources, per Future Self's condition.
//
// RE-DERIVED 2026-09-24 (per-person recalibration pass), source of truth:
// docs/2026-09-24-canadian-business-savings-estimate.md sections 6.1-6.3, 7.3 and 8. Every rate
// below traces to that document's "Low from" / "Likely from" columns and does not exceed what it
// supports -- see the doc for the exact study quotes and the checking-allowance arithmetic. This
// replaces the earlier rates (which cited pages that turned out not to contain the quoted figures
// for meetings/search -- see section 2 of the doc, "Verification of the rates BlueChip already
// uses"). Bucket names now match the doc's own area groupings, not individual Q2 tiles, since
// several tiles share one studied rate (see AREA_RATE_MAP below).
export const RATE_TABLE = {
  correspondence: {
    label: 'Routine correspondence', low: 0.15, likely: 0.35,
    sources: ["Dell'Acqua et al. 2023 (HBS/BCG)", 'Noy & Zhang 2023 (Science)'],
  },
  // reports, proposals, writingEditing, policies, trainingMaterials, socialContent (doc section
  // 7.3, "documents" row).
  documents: {
    label: 'Documents and reports', low: 0.15, likely: 0.30,
    sources: ["Dell'Acqua et al. 2023 (HBS/BCG)", 'Noy & Zhang 2023 (Science)'],
  },
  // research, spreadsheets (doc section 7.3, "research, spreadsheets" row).
  analysis: {
    label: 'Research and data work', low: 0.05, likely: 0.15,
    sources: ['UK GDS 2025 / HMRC controlled trial 2026 (floor)', "Dell'Acqua et al. 2023 (HBS/BCG)"],
  },
  // enquiries, staffQuestions (doc section 7.3, "enquiries, staffQuestions" row).
  enquiries: {
    label: 'Enquiries and staff questions', low: 0.05, likely: 0.10,
    sources: ['UK GDS 2025 / HMRC controlled trial 2026 (floor)', 'Brynjolfsson, Li & Raymond 2025 (QJE)'],
  },
  // meetingNotes, caseNotes (doc section 6.1 / 7.3, "meetingNotes, caseNotes" row).
  meetings: {
    label: 'Meeting and case notes', low: 0.05, likely: 0.20,
    sources: ['Lukac et al. 2025 (NEJM AI, randomised trial)', 'Unity Insights 2025 Magic Notes validation (vendor-commissioned)'],
  },
  // findingInfo, scheduling, invoicing, hiring, otherArea, notSureArea, filing (doc section 6.2 /
  // 7.3 / 8.5, "floor" row). Conservative floor for areas with no directly matching study.
  floor: {
    label: 'Not sure yet', low: 0.05, likely: 0.06,
    sources: ['UK GDS 2025 (26 min/day is about 6% of a 7.25-hour day)', 'HMRC controlled trial 2026 (2-3% of the working week)'],
  },
  // Section 8.3: formal minutes (council, board or committee clerks). Kept separate from
  // meetingNotes/caseNotes -- the doc's own instruction: "Keep this separate from general meeting
  // notes... Formal minutes rest mostly on transcribing recordings", a different evidence base.
  formalMinutes: {
    label: 'Formal minutes', low: 0.05, likely: 0.30,
    sources: ['Halving transcription time, arXiv 2503.13031 (2025)', 'Lukac et al. 2025 (NEJM AI, randomised trial)'],
  },
  // Section 8.2: reviewing documents (contracts, forms, submissions) -- an analysis task, not a
  // drafting one, so it gets its own row even though the numbers match "analysis" by coincidence.
  docReview: {
    label: 'Document review', low: 0.05, likely: 0.15,
    sources: ['Choi, Monahan & Schwarcz 2024 (Minnesota Law Review, randomised)', "Dell'Acqua et al. 2023 (HBS/BCG)"],
  },
  // Section 8.6: privacy and access requests (FOIP, redaction, PIAs).
  privacy: {
    label: 'Privacy and access requests', low: 0, likely: 0.12,
    sources: ['Peng, Huang, Wu & Wei 2024 (arXiv, vendor-run randomised trial)'],
  },
};

// Q2 area value -> RATE_TABLE row, per the doc's own area groupings (section 7.3 and 8).
export const AREA_RATE_MAP = {
  correspondence: 'correspondence',
  enquiries: 'enquiries',
  reports: 'documents',
  proposals: 'documents',
  meetingNotes: 'meetings',
  caseNotes: 'meetings',
  findingInfo: 'floor',
  scheduling: 'floor',
  invoicing: 'floor',
  hiring: 'floor',
  writingEditing: 'documents',
  research: 'analysis',
  spreadsheets: 'analysis',
  socialContent: 'documents',
  trainingMaterials: 'documents',
  policies: 'documents',
  staffQuestions: 'enquiries',
  // Typed-in "Other" area: always the most conservative rate, so it can only understate.
  otherArea: 'floor',
  notSureArea: 'floor',
  // Section 8 additions (2026-09-24).
  formalMinutes: 'formalMinutes',
  docReview: 'docReview',
  privacyRequests: 'privacy',
  filing: 'floor',
};

export const AREAS = [
  ['correspondence', 'Emails and correspondence'],
  ['reports', 'Recurring reports, status updates and dashboards'],
  ['meetingNotes', 'Meeting notes and follow-up'],
  ['findingInfo', 'Finding information (including searching email)'],
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
  ['staffQuestions', 'Answering staff questions (policies, onboarding, how-to)'],
  // Section 8 additions (2026-09-24).
  ['formalMinutes', 'Formal minutes (council, board or committee)'],
  ['docReview', 'Reviewing documents (contracts, forms, submissions)'],
  ['privacyRequests', 'Privacy and access requests (FOIP, redaction)'],
  ['filing', 'Organizing and filing documents (including finding the latest version)'],
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
  // staffQuestions appended (2026-09-24): a 4th candidate that only surfaces once one of the
  // first three is already picked (suggestedAreas filters out picks, then takes the first 3).
  // formalMinutes and privacyRequests appended (2026-09-24, section 8) for municipal and
  // postsecondary specifically -- clerks and privacy officers are concentrated in those org types.
  healthcare: ['caseNotes', 'scheduling', 'enquiries', 'staffQuestions'],
  retail: ['enquiries', 'scheduling', 'invoicing'],
  postsecondary: ['meetingNotes', 'enquiries', 'findingInfo', 'staffQuestions', 'formalMinutes', 'privacyRequests'],
  municipal: ['meetingNotes', 'correspondence', 'findingInfo', 'staffQuestions', 'formalMinutes', 'privacyRequests'],
  nonprofit: ['meetingNotes', 'reports', 'caseNotes', 'staffQuestions'],
  other: ['correspondence', 'meetingNotes', 'reports'],
};

// Flat ceiling on "people" entered for any one area, at every stage of the check -- before Q7
// (org size) is answered and after. Org size does NOT scale this: Thomas, 2026-09-24, correcting
// an earlier draft of this feature, "Org size must NOT affect the estimate. The math is purely:
// hours one person spends on an area x the people who do that work x the net rate, summed across
// areas." This cap exists only so a mistyped or joke entry can't produce an absurd total -- it is
// not a per-org-size band. (Previously ORG_SIZE_PEOPLE_CAP / peopleCapForOrgSize scaled this by
// Q7's answer; removed with this correction.)
export const PEOPLE_MAX = 500;

export const HOUR_CAP_PER_AREA = 25; // hours a week, one person, per area (the slider's hard max)
export const HOUR_CAP_TOTAL = 30;    // hours a week, one person, summed across every picked area

// Per-person recalibration (2026-09-24), doc section 7.2: default hours per area, replacing the
// flat 5-hour default. "Assume a person picks an area because it is one of their biggest time
// sinks, so the default is the full population average for that task, not a fraction of it."
// Values not marked "Assumption" below trace to the doc's own sourced figures (Grammarly/Harris
// Poll writing-time survey T1, McKinsey email/search share T3, the Unity Insights case-note
// figure T4); values marked "Assumption" have no retrievable time-use source and the doc says so
// plainly -- kept here rather than dropped, since a defensible default beats an arbitrary one, but
// never used to claim more precision than it has.
export const DEFAULT_HOURS_PER_AREA = {
  correspondence: 8.4,   // T1: writing 4.34 + responding 4.05 h/week
  enquiries: 4,          // Assumption
  // T1: "creating materials to be shared with others" (3.3) + 1.5 for status updates and
  // dashboards folded into this tile (doc section 10). The +1.5 is a labelled BlueChip
  // assumption, not sourced -- status-update time wasn't separately measured in any retrieved
  // study. Still subject to the 20-hr defaults cap like every other area.
  reports: 4.8,
  proposals: 3.3,        // Same T1 line as reports -- both draw on the same time-use figure
  meetingNotes: 2,        // Assumption (meeting time itself is sourced; write-up time is not)
  caseNotes: 10,          // T4 (Unity Insights): 20.4 h/week written admin, halved for notes only
  findingInfo: 6.9,       // T3: "nearly 20%" of a 36.2 h paid week
  staffQuestions: 2,      // Assumption
  scheduling: 1.5,        // Assumption
  invoicing: 2,           // Assumption
  hiring: 2,              // Assumption
  writingEditing: 5.8,    // T1: reviewing others' 2.98 + revising own 2.81 h/week
  research: 3,            // Assumption (overlaps findingInfo)
  spreadsheets: 4,        // Assumption (WTI 2023 gives a share of app time, not hours)
  socialContent: 2,       // Assumption
  trainingMaterials: 2,   // Assumption
  policies: 2,            // Assumption
  otherArea: 2,           // Assumption, same as the generic areas above
  // Not itemized in the doc (section 7.2 covers the 16 named areas only); treated the same as
  // "other" since neither has a specific task in mind. BlueChip judgment call, not sourced.
  notSureArea: 2,
  // Section 8 additions.
  formalMinutes: 6,       // Assumption: one formal meeting/week at the midpoint of FM1's "4 to 8 h"
  docReview: 3,           // Assumption, no time-use source found
  privacyRequests: 8,     // Assumption, for someone whose job includes access requests
  filing: 3,              // Assumption, no time-use source found
};

// The default-hours envelope: the SUM of default (never-yet-edited) hours across picked areas is
// scaled down to fit this, proportionally, if it would otherwise exceed it. Basis: doc T1's 19.93
// h/week whole written-work envelope for this population, comfortably inside a 36.2-38.2 h paid
// week (S6), so defaults never imply a workweek that's mostly this one bucket of work. Applies
// ONLY to values still at their default -- once a visitor types or slides a real number for an
// area, that number is real input and is never rescaled by this cap (still subject to the
// existing HOUR_CAP_PER_AREA / HOUR_CAP_TOTAL hard caps like any other entered value).
export const DEFAULT_HOURS_CAP = 20;

// Given a list of picked area values (only the ones still at their default hours), returns each
// one's default hours, scaled down proportionally if their combined total would exceed
// DEFAULT_HOURS_CAP. Rounded to one decimal to match areaHoursLabel's own display precision.
export function defaultHoursForPicks(areas) {
  const raw = areas.map(a => DEFAULT_HOURS_PER_AREA[a] ?? 2);
  const rawSum = raw.reduce((sum, h) => sum + h, 0);
  const scale = rawSum > DEFAULT_HOURS_CAP ? DEFAULT_HOURS_CAP / rawSum : 1;
  const result = {};
  areas.forEach((a, i) => { result[a] = Math.round(raw[i] * scale * 10) / 10; });
  return result;
}

// Section 8.1: dictation (voice-to-text instead of typing). A single opt-in checkbox, never one
// of the Q2 area picks and never counted against its 6-pick cap. Only ever touches the areas
// whose rate bucket is "correspondence" or "documents" -- the drafting/creating tasks doc T1
// measures -- because that's the only writing dictation actually speeds up ("dictation does not
// speed up" reviewing/revising, so those stay out).
const DICTATION_WRITING_BUCKETS = ['correspondence', 'documents'];
export function isWritingArea(area) {
  return DICTATION_WRITING_BUCKETS.includes(AREA_RATE_MAP[area]);
}
// T1: writing messages 4.34 + responding 4.05 + creating materials 3.27 h/week (reviewing/revising
// excluded, since dictation doesn't speed those up). Used only when dictation is ticked and NO
// writing area is picked, as its own virtual "area".
export const DICTATION_HOURS = 11.7;
export const DICTATION_RATE = {
  label: 'Voice dictation', low: 0, likely: 0.12,
  sources: ['Dhakal et al. 2018 (CHI, typing speed)', 'Ruan et al. 2016 (Stanford/arXiv, speech vs typing)', 'Noy & Zhang 2023 (Science, drafting-share assumption)'],
};
// When a writing area IS picked, dictation stacks as a rate boost instead of separate hours (so
// nothing is double-counted against AI drafting's own saving on the same hours): +5 points to the
// LIKELY rate of each picked writing area, 0 on the low. Doc 8.1: "after AI drafting, drafting is
// at most 25% of 60% of the original time... 15% x 0.5 x 0.68 = 5.1% of the original hours."
export const DICTATION_BOOST_LIKELY = 0.05;

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
    id: 'areas', number: 2, type: 'multi', maxPicks: 6,
    label: 'Where would you most like time back? Pick up to six.',
    options: [...AREAS.map(([v, l], i) => [v, l, i === AREAS.length - 1])],
  },
  {
    // toolsToday feeds nothing downstream (not read by tailoredLines, crossCuttingCards,
    // nextSteps, any lead payload -- this funnel submits no lead at all, "no email" per its own
    // intro -- or the plan-page carry-over): confirmed by a full repo grep before adding options
    // here, so new values (including toolsOther's free text) are safe by construction. If a
    // future change starts reading toolsToday into result copy, map any typed-in value through
    // sanitizeShortText and never surface it as a named tool, matching the areas "Other" pattern.
    id: 'toolsToday', number: 3, type: 'multi',
    label: 'Which tools does your team use every day? Pick all that apply.',
    options: [
      ['m365', 'Microsoft 365'],
      ['google', 'Google Workspace'],
      ['accounting', 'Accounting software'],
      ['hrPayroll', 'HR or payroll software'],
      ['industry', 'Industry software (for example practice management, ERP or CRM)'],
      ['projectMgmt', 'Project or task management (for example Asana, Monday or Trello)'],
      ['chatVideo', 'Chat and video calls (for example Slack or Zoom)'],
      ['designDocs', 'Design and document tools (for example Canva or Adobe)'],
      ['toolsOther', 'Other (type your own)'],
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
// rows. Org size plays no part in this -- see PEOPLE_MAX above -- so this takes only the rows,
// plus an optional dictation flag (doc section 8.1). Dictation never adds a Q2 pick: when a
// writing area is already picked it boosts those rows' likely rate; only when NONE is picked does
// it become its own virtual row (DICTATION_HOURS, subject to the same hour caps as any other row).
export function computeRange(rows, { dictation = false } = {}) {
  const hasWritingArea = rows.some(r => isWritingArea(r.area));
  const effectiveRows = (dictation && !hasWritingArea && rows.length > 0)
    ? [...rows, { area: 'dictation', hours: DICTATION_HOURS, people: rows[0].people ?? 1 }]
    : rows;
  const { rows: capped, capped: hoursCapped } = capRowHours(effectiveRows);
  let low = 0, likely = 0, peopleCapped = false;
  const detail = capped.map(r => {
    const rawPeople = Number(r.people) || 0;
    const people = Math.min(PEOPLE_MAX, Math.max(0, rawPeople));
    if (people !== rawPeople) peopleCapped = true;
    const isDictationRow = r.area === 'dictation';
    const rate = isDictationRow ? DICTATION_RATE : rateForArea(r.area);
    const dictationBoosted = !isDictationRow && dictation && hasWritingArea && isWritingArea(r.area);
    const effectiveLikely = rate.likely + (dictationBoosted ? DICTATION_BOOST_LIKELY : 0);
    const rowLow = r.hours * people * rate.low;
    const rowLikely = r.hours * people * effectiveLikely;
    low += rowLow; likely += rowLikely;
    return {
      area: r.area, hours: r.hours, people, low: rowLow, likely: rowLikely, rate,
      dictationApplied: isDictationRow || dictationBoosted,
    };
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
// "X to Y", or just "X" when the two labels are identical after rounding (e.g. the Q2 live
// preview showing "under 1 to under 1" for two small, genuinely-different values before this
// helper existed -- collapsing to one number is honest about the precision, "X to X" isn't).
export function areaHoursRangeLabel(low, likely) {
  const lowLabel = areaHoursLabel(low);
  const likelyLabel = areaHoursLabel(likely);
  return lowLabel === likelyLabel ? likelyLabel : `${lowLabel} to ${likelyLabel}`;
}
// True when a rendered range label (from areaHoursRangeLabel) is the collapsed single-value case
// AND that value is exactly 1 -- the one case where "hrs" should read as "hr". A genuine "X to Y"
// range always has two different display strings, so only the collapsed case can ever be exactly
// 1; the " to " check short-circuits Number() on a range string (which would otherwise be NaN).
export function isSingularHourLabel(label) {
  return !label.includes(' to ') && Number(label) === 1;
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

// "Where to look, based on your answers" (result screen): 2-3 short, informational lines per
// picked area, never naming a specific tool. Every AREAS value gets its own set; anything not
// listed (shouldn't happen, but a typed-in area would otherwise have no set) falls back to
// OTHER_AREA_LOOKOUT, the same generic set the "Other" tile itself uses.
export const AREA_LOOKOUT = {
  correspondence: ['which replies repeat week to week', 'how long drafting takes versus checking', 'who reviews before anything goes out'],
  reports: ['which numbers get pulled the same way each time', 'how much of each report is pasted in from other sources', 'who checks the final version before it goes out', 'how much of each status update is retyped from notes or tickets you already have'],
  meetingNotes: ['how long write-ups take after each meeting', 'how action items get tracked afterward', 'which meetings need a formal record'],
  findingInfo: ['how often the same question gets researched from scratch', 'where the answer usually already lives', 'how long a typical search takes'],
  scheduling: ['how much back and forth it takes to land on a time', 'how often a change means re-coordinating everyone', 'whether reminders happen automatically or by hand'],
  invoicing: ['how many fields get typed in by hand', 'how often the same data gets entered more than once', 'who double-checks the totals'],
  hiring: ['how long a job posting or offer letter takes to draft', 'how much paperwork repeats for every new hire', 'which onboarding steps are the same every time'],
  enquiries: ['which questions come up again and again', 'how long a typical reply takes to draft', 'which enquiries need judgment versus a standard answer'],
  caseNotes: ['how long notes take to write up after each contact', 'how consistent the format is from one note to the next', "who reviews notes before they're filed"],
  proposals: ['how many sections repeat from one proposal to the next', 'how long it takes to pull the numbers together', 'who signs off before it goes out'],
  writingEditing: ['how many rounds of edits a typical draft goes through', "whether there's a house style to follow", 'how much editing is wording versus substance'],
  research: ['how long a typical summary takes to put together', 'how many sources usually get checked', 'how often the same document gets summarized for different audiences'],
  spreadsheets: ['how much of the work is copying, sorting or matching data by hand', 'how often the same cleanup steps repeat', "who checks the results before they're used"],
  socialContent: ['how long a typical post or newsletter takes to draft', 'how much of it follows a repeatable format', "who reviews before it's posted or sent"],
  trainingMaterials: ['how often materials need updating', 'how much content repeats across different guides', "who checks materials for accuracy before they're used"],
  policies: ['how often policies and templates need reviewing', 'how much wording repeats across documents', 'who signs off on changes'],
  staffQuestions: ['which questions new and current staff ask again and again', 'where the answers live today', 'who gets interrupted to answer them'],
  formalMinutes: ['how long minutes take to finalize after each meeting', 'how much is transcription versus judgment calls on wording', 'who signs off before minutes are circulated'],
  docReview: ['how many documents come through for review each week', 'how much of the review is the same checklist every time', 'who has final sign-off'],
  privacyRequests: ['how long a typical request takes from intake to response', 'how much of it is finding and redacting the right material', 'who reviews before anything is released'],
  filing: ['how often documents get misplaced or duplicated', 'how much of the work is renaming and sorting versus deciding where something belongs', 'whether the current version is always easy to find'],
};
export const OTHER_AREA_LOOKOUT = ['how often it happens', 'how many steps are copy and paste', 'who checks the result'];
export function areaLookoutLines(area) {
  return AREA_LOOKOUT[area] || OTHER_AREA_LOOKOUT;
}

// Section 9 (2026-09-24): for visitors who already use a general AI assistant, add one extra
// informational line to each picked WRITING area's lookout card -- the copy-paste round trip
// between their own tools and a chat window is a real time cost specific to that workflow.
// Informational only: no hours or rate attached, never counted in the estimate.
export const AI_TOOL_COPY_PASTE_LINE = 'how much time goes into copying text into an AI tool and reworking the result';
const GENERAL_AI_TOOLS = ['chatgpt', 'claude', 'copilot'];
export function usesGeneralAiTool(aiTools = []) {
  return aiTools.some(v => GENERAL_AI_TOOLS.includes(v));
}
export function areaLookoutLinesFor(area, answers = {}) {
  const base = areaLookoutLines(area);
  if (isWritingArea(area) && usesGeneralAiTool(answers.aiTools)) {
    return [...base, AI_TOOL_COPY_PASTE_LINE];
  }
  return base;
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
      title: 'Tools you already have',
      lines: ['which licences or features may already cover some of this', 'whether they fit this kind of work'],
    },
    lowComfort && {
      title: "Who'll run it",
      lines: ['who could own one workflow to start', "what guidance or support they'd need to get started"],
    },
  ].filter(Boolean);
  return candidates.slice(0, 2);
}

// "Next steps you can take this week" (result screen): exactly 3 tailored, doable-today
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
    topAreaLabel && { id: 'timeTopArea', text: `Track the time spent on ${topAreaLabel} for one week: a simple tally of task, minutes, and who did it.` },
    sensitive && weakProtection && { id: 'writePolicy', text: 'Write a one-page rule on what information should never go into an AI tool.' },
    heldBack.includes('notSureStart') && { id: 'rankTasks', text: 'List your three most repetitive tasks and rank them by how many hours a week they take.' },
    (heldBack.includes('staffHesitant') || feel === 'worried') && { id: 'askTeam', text: 'Ask two or three team members what would make them comfortable trying a new tool, before choosing one.' },
    heldBack.includes('budget') && { id: 'checkExisting', text: 'Check whether your current software already includes an AI feature you are not using yet.' },
    (owner === 'variesOrNoOne' || readiness === 'notYetReady' || readiness === 'somewhatGuidance') && { id: 'pickOwner', text: 'Pick one person to try one workflow for two weeks, even informally.' },
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
