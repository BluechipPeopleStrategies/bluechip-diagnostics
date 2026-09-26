import { layout } from './_shared.js';
import {
  questions, computeRange, roundHoursLabel, roundDollars, money, AREA_LABELS, sanitizeAreaLabel,
  sanitizeShortText, areaWeeklyLabel, nextSteps, lowerFirst, answerSummary, orgSizeMidpoint,
  HOUR_CAP_PER_AREA, PEOPLE_MAX, HOURS_DISPLAY_CAP,
} from '../../src/lib/aiOpportunity.js';

// "Email my results" for the free AI Opportunity Check (item 61, 2026-09-25). The browser sends
// raw answers only; everything in the email is rebuilt here from whitelisted option labels and
// the same estimate engine the page uses, so this endpoint can never be used to mail arbitrary
// text to an arbitrary address. Typed-in text (the "Other" labels) is sanitized, capped at 60
// characters and HTML-escaped.
const PLAN_URL = 'https://bluechip-diagnostics.vercel.app/ai-handoff-plan';
const CHAT_URL = 'https://www.bluechip-people-strategies.com/?utm_source=ai-check-email#chat';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clamp(n, min, max, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

// Keeps only real option values for each question (and at most maxPicks for a capped multi).
export function cleanAiCheckInput(body = {}) {
  const rawAnswers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const answers = {};
  for (const q of questions) {
    const valid = new Set(q.options.map(o => o[0]));
    const v = rawAnswers[q.id];
    if (q.type === 'multi') {
      const picks = Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string' && valid.has(x)))] : [];
      answers[q.id] = q.maxPicks ? picks.slice(0, q.maxPicks) : picks;
    } else if (typeof v === 'string' && valid.has(v)) {
      answers[q.id] = v;
    }
  }
  const rawInputs = body.areaInputs && typeof body.areaInputs === 'object' ? body.areaInputs : {};
  const areaInputs = {};
  for (const a of answers.areas || []) {
    const r = rawInputs[a] && typeof rawInputs[a] === 'object' ? rawInputs[a] : {};
    areaInputs[a] = {
      hours: clamp(r.hours, 0, HOUR_CAP_PER_AREA, 5),
      people: Math.round(clamp(r.people, 0, PEOPLE_MAX, 1)),
      ...(a === 'otherArea' ? { label: sanitizeAreaLabel(r.label) } : {}),
    };
  }
  return {
    answers,
    areaInputs,
    rate: clamp(body.rate, 15, 250, 40),
    weeks: Math.round(clamp(body.weeks, 20, 52, 48)),
    headcount: body.headcount == null ? null : Math.round(clamp(body.headcount, 1, 500, 25)),
    include: body.include === 'answers' ? 'answers' : 'estimate',
    ownerOtherText: sanitizeShortText(body.ownerOtherText),
    toolsOtherText: sanitizeShortText(body.toolsOtherText),
  };
}

const P = 'margin:0 0 14px;';
const SMALL = 'font-size:13px;color:#6b6b6b;';

export function buildAiCheckResultsEmail(input) {
  const { answers, areaInputs, rate, weeks, include, ownerOtherText, toolsOtherText } = input;
  const labelFor = (a) => (a === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[a]);
  const rows = (answers.areas || []).map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 5, people: areaInputs[a]?.people ?? 1 }));
  const { low, likely, rows: detail } = computeRange(rows);
  const lowLabel = roundHoursLabel(low);
  const likelyLabel = roundHoursLabel(likely);
  const headline = lowLabel === likelyLabel ? `About ${likelyLabel} hours a week` : `About ${lowLabel} to ${likelyLabel} hours a week`;

  const totalPeople = Math.max(1, detail.reduce((s, r) => s + r.people, 0));
  const headcount = input.headcount ?? orgSizeMidpoint(answers.orgSize);
  const teamLow = Math.min(HOURS_DISPLAY_CAP, (low / totalPeople) * headcount);
  const teamLikely = Math.min(HOURS_DISPLAY_CAP, (likely / totalPeople) * headcount);

  const topArea = rows[0]?.area;
  const topLabel = topArea ? (topArea === 'otherArea' ? labelFor(topArea) : lowerFirst(AREA_LABELS[topArea])) : null;
  const steps = nextSteps(answers, topLabel);

  const areaList = detail.map(r => `<li style="margin:0 0 6px;">${esc(labelFor(r.area))}: <strong>${esc(areaWeeklyLabel(r.low, r.likely))}</strong></li>`).join('');
  const stepList = steps.map(s => `<li style="margin:0 0 8px;">${esc(s)}</li>`).join('');

  let answersBlock = '';
  if (include === 'answers') {
    const summary = answerSummary(answers, { areaInputs, ownerOtherText, toolsOtherText });
    const trs = summary.map(row => `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;${SMALL}">${esc(row.label)}</td><td style="padding:6px 0;vertical-align:top;">${row.items.length ? row.items.map(esc).join('<br/>') : 'Not answered'}</td></tr>`).join('');
    answersBlock = `<h3 style="font-size:17px;margin:28px 0 10px;">Your answers</h3><table style="border-collapse:collapse;font-size:14px;">${trs}</table>`;
  }

  const html = layout(`
    <p style="${P}">Hi there,</p>
    <p style="${P}">Here are the results from your AI Opportunity Check.</p>
    <p style="margin:0 0 4px;font-size:24px;font-weight:bold;">${esc(headline)}</p>
    <p style="${P}${SMALL}">across the areas you picked</p>
    <ul style="padding-left:20px;${P}">${areaList}</ul>
    <p style="${P}">That is ${esc(roundHoursLabel(low * weeks))} to ${esc(roundHoursLabel(likely * weeks))} hours a year, or ${esc(money(roundDollars(low * rate * weeks)))} to ${esc(money(roundDollars(likely * rate * weeks)))} a year in potential staff time value at ${esc(money(rate))} an hour over ${esc(weeks)} working weeks. Time for other work, not a cash saving.</p>
    <p style="${P}">If ${esc(headcount)} people each saved the same amount of time: about ${esc(roundHoursLabel(teamLow))} to ${esc(roundHoursLabel(teamLikely))} hours a week.</p>
    <h3 style="font-size:17px;margin:24px 0 10px;">Next steps you can take this week</h3>
    <ol style="padding-left:20px;${P}">${stepList}</ol>
    ${answersBlock}
    <p style="margin:24px 0 14px;">Want to know which tasks and tools could get you there? That's what The AI Handoff Plan works out, measured against your actual work. <a href="${PLAN_URL}" style="color:#1a1a1a;text-decoration:underline;">See how the plan works</a>.</p>
    <p style="${P}">Want to continue the discussion? Just reply to this email, or <a href="${CHAT_URL}" style="color:#1a1a1a;text-decoration:underline;">start a chat with BlueChip</a>.</p>
    <p style="${P}${SMALL}">It's an estimate, not a promise of results or a cash saving.</p>
    <p style="${P}">Thomas</p>
  `);
  return { subject: 'Your AI Opportunity Check results', html, resultLabel: headline };
}
