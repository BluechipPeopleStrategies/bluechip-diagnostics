// Copy for the AI Handoff Plan page, both editions. Final strings come from the BlueChip docs
// (2026-10-08): offers-and-site-SOURCE-OF-TRUTH.md section 4, ai-handoff-plan-infy-batch-3.md,
// ai-handoff-plan-795-infy-review-workflow-scope.md and ai-handoff-plan-795-offer.md ("What you
// get for C$795" box). Naming rule: "the AI Handoff Plan" at first mention, "your AI plan" after,
// never a bare "the plan". No em dashes in any string.
import { PLAN_FEE, dollars } from '../../lib/planPricing.js';
import { ILLUSTRATION_WEEKS, ILLUSTRATION_WEEK_HOURS } from '../../lib/aiOpportunity';

export const PUBLIC_SECTOR_PATH = '/ai-handoff-plan/public-sector';
export const GENERAL_PATH = '/ai-handoff-plan';
export const REFUND_URL = 'https://www.bluechip-people-strategies.com/refund';

export const EDITIONS = {
  general: {
    path: GENERAL_PATH,
    chatTopic: 'ai-handoff-plan',
    switchLabel: 'Business or nonprofit',
    headline: 'Where is repeat work costing your team time?',
    lead: "We look across your team's work and recommend where AI could help, what your people keep, and where to start.",
    guardrail: "AI doesn't replace your people's judgment on people decisions. Your AI plan looks for time your organization can redirect, not people to cut.",
    opener: 'A review of your work. A prioritised AI Handoff Plan. A first step to try.',
    title: 'The AI Handoff Plan | BlueChip',
    description: `A review of your team's work with a prioritised AI Handoff Plan. Current fee ${dollars(PLAN_FEE)}, confirmed before booking. Evidence-backed potential for 3 net team hours a week, or a full-fee refund.`,
  },
  'public-sector': {
    path: PUBLIC_SECTOR_PATH,
    chatTopic: 'public-sector',
    switchLabel: 'Municipality or public body',
    headline: 'What is repeat work taking away from council priorities?',
    lead: "We look across your team's work and recommend where AI could help, what your staff keep, and how time could go back to council priorities.",
    guardrail: "AI doesn't replace CAO judgment, council governance, or your privacy and records requirements. Your AI plan looks for time that can go back to council priorities, not positions to cut, and what you do with any time it frees up stays your decision.",
    opener: 'A review of your work. A prioritised AI Handoff Plan. A first step to try.',
    title: 'The AI Handoff Plan for municipalities and public bodies | BlueChip',
    description: `A review of your team's work with a prioritised AI Handoff Plan. Current fee ${dollars(PLAN_FEE)}, confirmed before booking. Evidence-backed potential for 3 net team hours a week, or a full-fee refund.`,
  },
};

// The hours-only illustration (Infy batch 3). Every figure is derived, so it cannot drift:
// 5 people x 1 hour x 48 weeks = 240 hours; 12 people = 12 hours a week = 576 hours = 15.4 weeks.
const SMALL_TEAM = 5;
const BIG_TEAM = 12;
export const ILLUSTRATION = {
  small: { people: SMALL_TEAM, weekly: SMALL_TEAM, yearly: SMALL_TEAM * ILLUSTRATION_WEEKS },
  big: {
    people: BIG_TEAM,
    weekly: BIG_TEAM,
    weeks: Math.floor((BIG_TEAM * ILLUSTRATION_WEEKS) / ILLUSTRATION_WEEK_HOURS), // 15.36 -> "about 15"
  },
};
export const ILLUSTRATION_BASIS = `Based on ${ILLUSTRATION_WEEKS} working weeks a year and a ${ILLUSTRATION_WEEK_HOURS}-hour week.`;
export const ILLUSTRATION_TEXT = `Say ${ILLUSTRATION.small.people} people do that work, and your AI plan finds a change that could give each of them an hour a week, after checking the AI's work. That's ${ILLUSTRATION.small.weekly} hours a week across your team, about ${ILLUSTRATION.small.yearly} hours over a working year. With ${ILLUSTRATION.big.people} people, it's ${ILLUSTRATION.big.weekly} hours a week, about ${ILLUSTRATION.big.weeks} working weeks of time a year. It's an example to show the scale, not a promise or a client result.`;

// "What you get for C$795" box: the short opener, "Your time" and "Not included" only. The seven
// inclusions now live in the four delivery steps and written-plan kit
// (AiHandoffPlanPage FLOW_STEPS and PLAN_KIT). The guarantee line sits
// in the "Your safety net" block below the box (Infy batch 3, item 1).
export const PLAN_CALLS = [
  { name: 'Discovery', minutes: 60 },
  { name: 'Findings and first step', minutes: 45 },
  { name: 'Check-in', minutes: 15 },
];
export const PLAN_EXTRA_COSTS = [
  'Software and licences',
  'IT installations and wider rollout',
  'Implementation beyond the limited first-step help in your 45-minute findings call',
];

// "Your safety net" (Infy batch 3, item 1c). Body-text size, never behind a link or accordion.
export const SAFETY_NET = "if your plan identifies less than 3 net team hours a week, we automatically refund your full fee within 10 business days of your findings call.";
export const SAFETY_NET_DEFINITIONS = "Based on evidence-backed potential across the agreed people and work, after checking and upkeep. The guarantee covers plan findings, not achieved savings.";

export const CTA_LEAD = "Tell us what you'd like to improve. No booking or payment required to ask.";

// Retainer line (Infy batch 3, item 3), with the retainer named as Thomas confirmed it
// ("Practical AI and/or Embedded HR"). No roadmap, no scope, no six-month minimum, no link.
export const RETAINER_HEADING = 'Your plan. Your choice.';
export const RETAINER_BODY = 'If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, the eligible plan fee you paid is credited against its first invoice.';
export const RETAINER_LINE = `${RETAINER_HEADING}. ${RETAINER_BODY}`;
