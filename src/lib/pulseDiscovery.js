import { FAMILIES, OPPORTUNITIES, STATUSES } from '../data/pulseCatalogue.js';
export { PLAN_FEE } from './planPricing.js';
export { FAMILIES, OPPORTUNITIES, STATUSES };
export const PULSE_VERSION = 'ai-pulse-discovery-v1';
export const SHARING_NOTICE = 'ai-pulse-discovery-results-v1';
export const PRIMARY = { knowledge: 'findDocs', voice: 'dictation', inbox: 'emailDrafts', documents: 'reports', social: 'socialDrafts', operations: 'records', industry: 'industryBrief', priorities: 'weeklyPriorities', accountability: 'actionOwnership', people: 'hrStartingPoints' };
const people = 10, hours = 2.5, rate = 40, weeks = 48;
export const SCALE = Object.freeze({ people, hours, rate, weeks, teamHours: people * hours, annualHours: people * hours * weeks, annualValue: people * hours * weeks * rate });
export const PULSE_STORAGE_KEY = 'bluechip-pulse-discovery-v1';
export const SAFETY_NET = "If your AI Handoff Plan cannot show evidence-backed potential for at least 3 net team hours a week across the agreed people and work reviewed, your full fee is refunded automatically within 10 business days of your findings call. This covers plan findings, not actual implementation savings.";
export const STATUS_LABELS = { friction: 'We do it, but it takes too much effort', works: 'Already works well', aspire: 'We would like to start or do more', na: 'Does not apply', unknown: 'Not sure' };
const record = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const oneOf = (value, choices) => choices.includes(value) ? value : '';
export function freshPulse() { return { version: PULSE_VERSION, families: [], answers: {}, help: {}, information: '', tools: '', priority: '', screen: 'intro', questionIndex: 0 }; }
export function restorePulse(value) {
  const raw = record(value); if (raw.version !== PULSE_VERSION) return freshPulse();
  const answers = record(raw.answers), help = record(raw.help);
  const validAnswers = Object.fromEntries(OPPORTUNITIES.filter(o => STATUSES.some(([s]) => answers[o.id] === s)).map(o => [o.id, answers[o.id]]));
  return { ...freshPulse(),
    families: Array.isArray(raw.families) ? [...new Set(raw.families.filter(id => FAMILIES.some(f => f.id === id)))] : [],
    answers: validAnswers,
    help: Object.fromEntries(OPPORTUNITIES.filter(o => validAnswers[o.id] === 'friction' && ['none','part','underused','unknown'].includes(help[o.id])).map(o => [o.id,help[o.id]])),
    information: oneOf(raw.information, ['public','internal','confidential','unknown']), tools: oneOf(raw.tools, ['m365','google','mixed','other','unknown']),
    priority: OPPORTUNITIES.some(o => o.id === raw.priority) ? raw.priority : '',
    screen: ['intro','choose','questions','context','result'].includes(raw.screen) ? raw.screen : 'intro',
    questionIndex: Number.isInteger(raw.questionIndex) && raw.questionIndex >= 0 && raw.questionIndex < FAMILIES.length ? raw.questionIndex : 0,
  };
}
export function pulseQuestions(state) { return state.families.map(id => OPPORTUNITIES.find(o => o.id === PRIMARY[id])).filter(Boolean).slice(0,3); }
export function pulseSnapshot(raw) {
  const state = restorePulse(raw);
  const byStatus = status => OPPORTUNITIES.filter(o => state.answers[o.id] === status).map(o => ({ ...o, help: state.help[o.id] || 'not answered' }));
  const opportunities = byStatus('friction'), future = byStatus('aspire'), available = [...opportunities,...future];
  return { version: PULSE_VERSION, answers: state.answers, help: state.help, families: state.families, information: state.information || 'not answered', tools: state.tools || 'not answered', opportunities, future, covered: byStatus('works'), uncertain: byStatus('unknown'), notApplicable: byStatus('na'), unexplored: OPPORTUNITIES.filter(o => !state.answers[o.id]).map(o => o.id), startingPoint: available.find(o => o.id === state.priority) || available[0] || null };
}
export function loadPulse() { try { return restorePulse(JSON.parse(sessionStorage.getItem(PULSE_STORAGE_KEY))); } catch { return freshPulse(); } }
export function savePulse(state) { try { sessionStorage.setItem(PULSE_STORAGE_KEY,JSON.stringify(restorePulse(state))); } catch { /* private browsing/storage limits do not block completion */ } }
