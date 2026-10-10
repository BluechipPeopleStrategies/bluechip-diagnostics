// Copy for the AI Handoff Plan page, both editions. Final strings come from the BlueChip docs
// (2026-10-08): offers-and-site-SOURCE-OF-TRUTH.md section 4, ai-handoff-plan-infy-batch-3.md,
// ai-handoff-plan-795-infy-review-workflow-scope.md and ai-handoff-plan-795-offer.md ("What you
// get for C$795" box). Naming rule: "the AI Handoff Plan" at first mention, "your AI plan" after,
// never a bare "the plan". No em dashes in any string.
import { ILLUSTRATION_WEEKS, ILLUSTRATION_WEEK_HOURS } from '../../lib/aiOpportunity';

export const PUBLIC_SECTOR_PATH = '/ai-handoff-plan/public-sector';
export const GENERAL_PATH = '/ai-handoff-plan';
export const REFUND_URL = 'https://www.bluechip-people-strategies.com/refund';

export const EDITIONS = {
  general: {
    path: GENERAL_PATH,
    chatTopic: 'ai-handoff-plan',
    switchLabel: 'Business or nonprofit',
    headline: 'Which routine task could your team hand to AI?',
    lead: "Pick one workflow. We assess what AI could take on, what stays with your people, and how much time the team could get back.",
    guardrail: "AI doesn't replace your people's judgment on people decisions. Your AI plan looks for time your organization can redirect, not people to cut.",
    opener: 'One workflow. A written AI plan. Help setting up the first step.',
    title: 'The AI Handoff Plan | BlueChip',
    description: 'Pick one workflow your team repeats, and for C$795 you get a written plan showing a realistic way to use AI to give the people who do it back at least 3 net hours a week between them, or your full fee comes back.',
  },
  'public-sector': {
    path: PUBLIC_SECTOR_PATH,
    chatTopic: 'public-sector',
    switchLabel: 'Municipality or public body',
    headline: 'Make more time for council priorities.',
    lead: "Pick one routine workflow. We assess what AI could take on, what stays with your staff, and how much time could go back to council priorities.",
    guardrail: "AI doesn't replace CAO judgment, council governance, or your privacy and records requirements. Your AI plan looks for time that can go back to council priorities, not positions to cut, and what you do with any time it frees up stays your decision.",
    opener: 'One workflow. A written AI plan. Help setting up the first step.',
    title: 'The AI Handoff Plan for municipalities and public bodies | BlueChip',
    description: 'Name one workflow your staff repeat, and for C$795 you get a written plan showing a realistic way to use AI to give the people who do it back at least 3 net hours a week between them, or your full fee comes back.',
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
// inclusions that used to be a numbered list now live in the four "How it works" steps
// (AiHandoffPlanPage FLOW_STEPS), so nothing the old list named is lost. The guarantee line sits
// in the "Your safety net" block below the box (Infy batch 3, item 1).
export const BOX_YOUR_TIME = 'a short conversation with you before we start, and you on the findings call. Beyond that, about two hours each from one or two of the people who do the work, across the discovery session, the findings and setup call, and the check-in.';
export const BOX_NOT_INCLUDED = 'software and licences, anything your IT team installs, rolling the change out to the rest of the team, and any other workflow.';

// "Your safety net" (Infy batch 3, item 1c). Body-text size, never behind a link or accordion.
export const SAFETY_NET = "if your AI plan can't show at least 3 net hours a week in total across the people who do that workflow, your full fee comes back automatically within 10 business days of your findings call. No forms, no hoops. It's a promise about what your AI plan finds, not about what happens afterwards.";
export const SAFETY_NET_DEFINITIONS = "Net means after the weekly time needed to check the AI's work and keep the tools running.";

export const CTA_LEAD = "Tell us which workflow you'd start with and roughly how many people do it, and we'll tell you plainly whether it looks like a good place to start. Asking doesn't book the AI Handoff Plan or take payment.";

// Retainer line (Infy batch 3, item 3), with the retainer named as Thomas confirmed it
// ("Practical AI and/or Embedded HR"). No roadmap, no scope, no six-month minimum, no link.
export const RETAINER_HEADING = 'What comes next is up to you';
export const RETAINER_BODY = 'You can keep your AI plan and put it in place yourself or with another provider, or ask us about ongoing help. If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice.';
export const RETAINER_LINE = `${RETAINER_HEADING}. ${RETAINER_BODY}`;
