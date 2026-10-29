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

// Experiment B changes only the hero message; the offer and FAQ stay identical.
export const OUTCOME_MESSAGE = {
  general: {
    headline: 'Give your team time back from repeat work.',
    lead: "We show where AI can take work off your team's plate, with a practical plan and a clear first step. You don't need to choose the tools or figure it out on your own.",
  },
  'public-sector': {
    headline: 'Free up staff time for council priorities.',
    lead: "We show where AI can help with repeat work, with a practical plan and a clear first step. You don't need to choose the tools or figure it out on your own.",
  },
};

export const EDITIONS = {
  general: {
    path: GENERAL_PATH,
    chatTopic: 'ai-handoff-plan',
    switchLabel: 'Business or nonprofit',
    headline: "Not sure where AI fits in your team's work?",
    lead: "You don't need to know the tools or arrive with a plan. We look at the work with you, show where AI can save time, and give you a practical first step.",
    guardrail: "AI doesn't replace your people's judgment on people decisions. Your AI plan looks for time your organization can redirect, not people to cut.",
    opener: "A clear plan for where AI can help your team, which tools to use, and what to try first.",
    title: 'The AI Handoff Plan | BlueChip',
    description: `Not sure where to start with AI? Get a practical AI Handoff Plan for your team's work. Current fee ${dollars(PLAN_FEE)}, confirmed before booking. We'll show you where to get at least 3 hours a week back across your team, or refund your plan fee.`,
  },
  'public-sector': {
    path: PUBLIC_SECTOR_PATH,
    chatTopic: 'public-sector',
    switchLabel: 'Municipality or public body',
    headline: 'Not sure where AI fits in your municipality?',
    lead: "You don't need to know the tools or arrive with a plan. We help you find practical ways to free up staff time for council priorities, with a clear first step your team can take.",
    guardrail: "AI doesn't replace CAO judgment, council governance, or your privacy and records requirements. Your AI plan looks for time that can go back to council priorities, not positions to cut, and what you do with any time it frees up stays your decision.",
    opener: "A clear plan for where AI can help your team, which tools to use, and what to try first.",
    title: 'The AI Handoff Plan for municipalities and public bodies | BlueChip',
    description: `A practical AI Handoff Plan for municipalities and public bodies. Current fee ${dollars(PLAN_FEE)}, confirmed before booking. We'll show you where to get at least 3 hours a week back across your team, or refund your plan fee.`,
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
  'Additional implementation support beyond your findings call',
];

// "Your safety net" (Infy batch 3, item 1c). Body-text size, never behind a link or accordion.
export const SAFETY_NET = "We'll show you where to get at least 3 hours a week back across your team, or refund your plan fee.";
export const SAFETY_NET_DEFINITIONS = "Your AI plan identifies the opportunities and accounts for the time spent checking the work and keeping it running.";

export const CTA_LEAD = "Tell us what you'd like to improve. No booking or payment required to ask.";

// Retainer line (Infy batch 3, item 3), with the retainer named as Thomas confirmed it
// ("Practical AI and/or Embedded HR"). No roadmap, no scope, no six-month minimum, no link.
export const RETAINER_HEADING = 'Your plan. Your choice.';
export const RETAINER_BODY = 'If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your AI Handoff findings call, the eligible plan fee you paid is credited against its first invoice.';
export const RETAINER_LINE = `${RETAINER_HEADING}. ${RETAINER_BODY}`;
