// Carry-over from the homepage "Quick estimate" calculator into the free AI Pulse.
// The calculator links here with URL params (src=calc, seat, tasks, hours, people). This module is
// pure: it validates the params and turns them into pre-filled answers. Nothing in it touches the
// DOM, storage or analytics, so it can be tested on its own.
//
// URL format (one worked example):
//   /ai-opportunity-check?src=calc&seat=clerk&tasks=minutes,email,payroll&hours=4,6,3&people=2
import { questions, isComplete, HOUR_CAP_PER_AREA, PEOPLE_MAX } from './aiOpportunity';

export const CALC_SRC = 'calc';
export const CALC_MAX_TASKS = 9;
export const CALC_HOURS_MAX = 40;
export const CALC_PEOPLE_MIN = 1;

// Calculator seat -> Q1 organization type. Only the municipal seats map cleanly. "smb" (business
// owner) has no matching Q1 option (the check has no "small business" tile, and an owner could be
// in any of the trade, retail or professional options), and hr, finance, manager and admin could be
// any organization type, so those leave Q1 unanswered.
export const CALC_SEATS = ['cao', 'council', 'clerk', 'hr', 'finance', 'manager', 'smb', 'admin'];
export const SEAT_ORG_TYPE = {
  cao: 'municipal',
  council: 'municipal',
  clerk: 'municipal',
};

// Calculator task key -> the closest Q2 work area. A task that is not listed has no good match and
// is skipped (payroll processing, file keeping). The calculator's own rate buckets were used only to
// avoid mapping a task onto a higher-rate area than its own bucket would suggest.
export const CALC_TASK_AREA = {
  email: 'correspondence',      // Emails and letters
  reports: 'reports',           // Reports
  minutes: 'meetingNotes',      // Meeting notes
  agendas: 'reports',           // Agendas and packages: recurring documents, not note-taking
  research: 'research',         // Research and briefings
  findProc: 'findingInfo',      // Looking up procedures
  updProc: 'policies',          // Updating procedures
  policies: 'policies',         // Policies and templates
  onboarding: 'hiring',         // Employee onboarding
  postings: 'hiring',           // Job postings
  staffQ: 'staffQuestions',     // Staff questions
  // files: File keeping -> no good match, skipped
  // payroll: Payroll processing -> no good match, skipped
  time: 'invoicing',            // Time entry (the area reads "Invoices, receipts and data entry")
  dataEntry: 'invoicing',       // Data entry
  invoices: 'invoicing',        // Invoicing
  spreadsheets: 'spreadsheets', // Spreadsheets
  scheduling: 'scheduling',     // Scheduling
  enquiries: 'enquiries',       // Public enquiries
  social: 'socialContent',      // Newsletters and posts
  quotes: 'proposals',          // Quotes and proposals
  grants: 'proposals',          // Grant reporting
  records: 'findingInfo',       // Records searches
  writing: 'writingEditing',    // Writing and editing
  packages: 'reports',          // Council packages
  speeches: 'writingEditing',   // Speeches
};
export const CALC_TASK_KEYS = [
  'email', 'reports', 'minutes', 'agendas', 'research', 'findProc', 'updProc', 'policies',
  'onboarding', 'postings', 'staffQ', 'files', 'payroll', 'time', 'dataEntry', 'invoices',
  'spreadsheets', 'scheduling', 'enquiries', 'social', 'quotes', 'grants', 'records', 'writing',
  'packages', 'speeches',
];

const AREAS_QUESTION = questions.find(q => q.id === 'areas');
const MAX_AREAS = AREAS_QUESTION.maxPicks;
// The hours a picked area starts at when the calculator gave no usable number for it. Matches the
// check's own default for a freshly ticked area.
const DEFAULT_HOURS = 5;

function toIntInRange(raw, min, max) {
  const s = String(raw ?? '').trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

// Reads and validates the calculator params from a location.search string (or URLSearchParams).
// Returns null unless src=calc. Anything unknown or out of range is dropped, never guessed:
//   seat   a known seat, else null
//   tasks  [{ key, hours }] in the calculator's order; unknown keys and repeats dropped; hours is an
//          integer 0-40, or null when missing or invalid
//   people an integer 1-500, or null
export function parseCalcParams(search) {
  let params;
  try {
    params = search instanceof URLSearchParams ? search : new URLSearchParams(String(search || ''));
  } catch {
    return null;
  }
  if (params.get('src') !== CALC_SRC) return null;

  const seatRaw = (params.get('seat') || '').trim();
  const seat = CALC_SEATS.includes(seatRaw) ? seatRaw : null;

  const rawKeys = (params.get('tasks') || '').split(',').slice(0, CALC_MAX_TASKS).map(s => s.trim());
  const rawHours = (params.get('hours') || '').split(',').map(s => s.trim());
  const seen = new Set();
  const tasks = [];
  rawKeys.forEach((key, i) => {
    if (!CALC_TASK_KEYS.includes(key) || seen.has(key)) return;
    seen.add(key);
    tasks.push({ key, hours: toIntInRange(rawHours[i], 0, CALC_HOURS_MAX) });
  });

  const people = toIntInRange(params.get('people'), CALC_PEOPLE_MIN, PEOPLE_MAX);
  return { seat, tasks, people };
}

// Turns parsed params into pre-filled check state.
//   answers     { orgType?, areas? }
//   areaInputs  { [area]: { hours, people } }
//   mapped / skipped   counts of recognised calculator tasks that did / did not reach an area
//   startIndex  the first question that still has no answer
//   carried     true when anything was actually pre-answered
// Rules: a task with no matching area, or with 0 hours, is skipped. Tasks that share an area add
// their hours (capped at the check's 25 hours a week per area). A task whose hours were missing
// still picks its area and leaves the check's default hours. The check allows six areas; tasks
// that would need a seventh are skipped.
export function buildCalcPrefill(parsed) {
  if (!parsed) return null;
  const answers = {};
  const areaInputs = {};

  const orgType = parsed.seat ? SEAT_ORG_TYPE[parsed.seat] : undefined;
  if (orgType) answers.orgType = orgType;

  const people = parsed.people ?? 1;
  const byArea = new Map(); // area -> { sum, known }
  let mapped = 0;
  let skipped = 0;
  for (const { key, hours } of parsed.tasks) {
    const area = CALC_TASK_AREA[key];
    if (!area || hours === 0) { skipped += 1; continue; }
    if (!byArea.has(area) && byArea.size >= MAX_AREAS) { skipped += 1; continue; }
    const entry = byArea.get(area) || { sum: 0, known: false };
    if (hours !== null) { entry.sum += hours; entry.known = true; }
    byArea.set(area, entry);
    mapped += 1;
  }
  if (byArea.size > 0) {
    answers.areas = [...byArea.keys()];
    for (const [area, { sum, known }] of byArea) {
      const hours = known ? Math.min(HOUR_CAP_PER_AREA, sum) : DEFAULT_HOURS;
      areaInputs[area] = { hours, people };
    }
  }

  const firstOpen = questions.findIndex(q => !isComplete(q, answers));
  return {
    answers,
    areaInputs,
    mapped,
    skipped,
    startIndex: firstOpen === -1 ? 0 : firstOpen,
    carried: Object.keys(answers).length > 0,
    seat: parsed.seat,
  };
}

// A saved session counts as "in progress" once the visitor has answered something, moved past
// question 1 or reached the result. A blank session (written just by opening the page) is not.
export function hasCheckProgress(session) {
  if (!session) return false;
  if (session.step && session.step !== 'questions') return true;
  if (Number(session.qIndex) > 0) return true;
  const a = session.answers;
  return !!a && typeof a === 'object' && Object.keys(a).length > 0;
}

// The one call the component makes. Resume wins: with an in-progress saved session the params are
// ignored. Otherwise returns the pre-fill (or null when there is no valid src=calc).
export function prefillFor(search, savedSession) {
  if (hasCheckProgress(savedSession)) return null;
  return buildCalcPrefill(parseCalcParams(search));
}
