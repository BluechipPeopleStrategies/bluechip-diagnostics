import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import PulseScale from './PulseScale.jsx';
import { PLAN_FEE, dollars, FUTURE_PRICE_NOTICE } from '../lib/planPricing.js';
import GlassStage from './glass/GlassStage';
import GlassPanel from './glass/GlassPanel';
import {
  DiscoveryIcon, PlanDocIcon, CallIcon, ChecklistIcon, RouteIcon, ClockIcon,
} from './PlanIcons';
import { LEGACY_WORKFLOW_LABELS } from '../lib/aiOpportunity';
import { usePageMeta } from '../lib/seo';
import { loadChatWidget } from '../lib/chatWidget';
import PlanButton from './plan/PlanButton';
import PlanHeroArt from './plan/PlanHeroArt';
import PlanFlow from './plan/PlanFlow';
import PlanInside from './plan/PlanInside';
import PlanClose from './plan/PlanClose';
import usePlanMessageExperiment from './plan/usePlanMessageExperiment.js';
import {
  EDITIONS, OUTCOME_MESSAGE, GENERAL_PATH, PUBLIC_SECTOR_PATH, REFUND_URL,
  PLAN_CALLS, PLAN_EXTRA_COSTS, SAFETY_NET, SAFETY_NET_DEFINITIONS, RETAINER_HEADING, RETAINER_BODY,
} from './plan/planCopy';
import './AiFunnel.css';
import './AiHandoffGlass.css';
import './plan/plan.css';

// Page order (Thomas, 2026-10-08): the capacity-first lead, the example, the "What you get for
// C$795" box, the guarantee as "Your safety net", then "Start the conversation". The rest of the
// page (how it works, what is inside, questions) follows. Two editions share this component:
// general at /ai-handoff-plan, public sector at /ai-handoff-plan/public-sector.

// Written-plan kit, followed by the four delivery steps shared by both editions.
const PLAN_KIT = [
  { title: '4-day quick-start guide', description: 'Day-by-day steps to set up, test and check the first change.', Icon: RouteIcon },
  { title: 'Starter kit', description: 'Prompts, templates and a review checklist.', Icon: ChecklistIcon },
  { title: 'Sign-off summary', description: 'One page to share and approve.', Icon: PlanDocIcon },
  { title: 'Hours tracker', description: 'See how time changes across the agreed work.', Icon: ClockIcon },
];
const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', Icon: DiscoveryIcon, bullets: ['Meet virtually with up to two people who do the work', 'Review the work and agree priorities'] },
  { time: 'Written for your team', name: 'Handoff plan', Icon: PlanDocIcon, bullets: ['What AI could take on, what your people keep', 'Tool choice, costs and setup effort', 'What information can go into which tool', 'Projected net team hours a week'], key: true },
  { time: '45 minutes', name: 'Findings and setup', Icon: CallIcon, bullets: ['Walk through your AI plan', 'Try a first step together in an approved tool', 'If needed: IT request ready to send'] },
  { time: 'About 30 days later', name: 'Check-in', Icon: ChecklistIcon, bullets: ['15-minute check-in on how it is going'] },
];

// Visible edition switch: two links, the current one marked in words (aria-current) as well as
// by weight. Keeps any query string, so a carried ?workflow= link survives a switch.
function EditionSwitch({ edition, search }) {
  const items = [
    { key: 'general', to: GENERAL_PATH },
    { key: 'public-sector', to: PUBLIC_SECTOR_PATH },
  ];
  return (
    <nav className="plan-edition" aria-label="Choose your edition">
      <span className="plan-edition-lead">This page is for</span>
      <ul className="plan-edition-list">
        {items.map(({ key, to }) => (
          <li key={key}>
            <Link to={{ pathname: to, search }} className={`plan-edition-link${edition === key ? ' is-current' : ''}`}
              aria-current={edition === key ? 'page' : undefined}>
              {edition === key && <span className="plan-edition-tick" aria-hidden="true">&#10003;</span>}
              {EDITIONS[key].switchLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// One labeled illustration. The equation is real text for every reader.
function CapacityExample({ guardrail }) {
  return <div className="plan-scale-learning"><PulseScale /><p className="plan-guardrail">{guardrail}</p></div>;
}

function WorkflowOverview() {
  return <section className="plan-workflow" aria-labelledby="plan-workflow-title">
    <h2 id="plan-workflow-title">Your work. Your call.</h2>
    <ol className="plan-workflow-list">
      <li><span className="plan-workflow-number">01</span><strong>Start with your team’s work</strong><span>We look at the tasks your people already do.</span></li>
      <li><span className="plan-workflow-number">02</span><strong>Find where AI could help</strong><span>We show which steps AI could take on and what still needs a person.</span></li>
      <li><span className="plan-workflow-number">03</span><strong>You make the call</strong><span>You decide what to hand over, what stays with your people, and what to try first.</span></li>
    </ol>
  </section>;
}

// Inquiry only until the plan's own checkout is connected.
export default function AiHandoffPlanPage({ edition = 'general' }) {
  const [params] = useSearchParams();
  const legacyWorkflow = LEGACY_WORKFLOW_LABELS[params.get('workflow')]; // keeps old ?workflow= links working
  const search = params.toString() ? `?${params.toString()}` : '';
  const copy = EDITIONS[edition] || EDITIONS.general;
  const experiment = usePlanMessageExperiment(params.get('message-variant'), edition);
  const message = experiment.variant === 'b' ? (OUTCOME_MESSAGE[edition] || OUTCOME_MESSAGE.general) : copy;

  usePageMeta(copy.title, copy.description);
  useEffect(() => { loadChatWidget(); }, []);

  return <GlassStage>
    <main className={`bc-page ai-funnel ai-glass ai-plan ai-plan--${edition}`}
      data-message-variant={experiment.active || experiment.preview ? experiment.variant : 'default'}
      onClickCapture={event => {
        if (event.target.closest?.('a[href^="#chat"]')) experiment.trackConversationClick();
      }}>
      <SiteHeader showCta chatTopic={copy.chatTopic} />

      <header className="ai-hero glass-hero">
        <div className="glass-hero-copy">
          <h1>The AI Handoff Plan</h1>
          <EditionSwitch edition={edition} search={search} />
          <h2 className="plan-headline">{message.headline}</h2>
          <p className="glass-lede">{message.lead}</p>
        </div>
        <PlanHeroArt />
      </header>

      {legacyWorkflow && <p className="ai-context">Your starting point: <strong>{legacyWorkflow}</strong>. We examine how the work happens before recommending a tool.</p>}

      <WorkflowOverview />
      <CapacityExample guardrail={copy.guardrail} />

      <div className="glass-stack">
        <span className="glass-sheet glass-sheet--back" aria-hidden="true" />
        <span className="glass-sheet glass-sheet--mid" aria-hidden="true" />
        <GlassPanel as="section" className="glass-panel glass-panel--focal plan-box" aria-labelledby="ai-price-title"
          plasma={{ radius: 24, tint: '#0E2140', opacity: 0.62, elevation: 0.7 }}>
          <h2 id="ai-price-title">What your AI Handoff Plan includes</h2>
          <p className="plan-box-opener">{copy.opener}</p>
          <PlanFlow steps={FLOW_STEPS} />
          <ul className="plan-included-tools" aria-label="Included with your written plan">
            {PLAN_KIT.map(({title,description,Icon}) => <li key={title}><span className="plan-kit-icon"><Icon /></span><div><strong>{title}</strong><p>{description}</p></div></li>)}
          </ul>
          <div className="plan-scope-pair">
            <section className="plan-participation" aria-labelledby="plan-time-title">
              <h3 id="plan-time-title">Time we need from you</h3>
              <p><strong>About 2 hours each</strong> for 1 or 2 people who do the work.</p>
              <ul className="plan-call-list">{PLAN_CALLS.map(call => <li key={call.name}><span>{call.name}</span><strong>{call.minutes} min</strong></li>)}</ul>
              <p className="plan-scope-small">You join the 45-minute findings call. If you are one of those participants, it is already included in your 2 hours.</p>
            </section>
            <section className="plan-extra-costs" aria-labelledby="plan-extras-title">
              <h3 id="plan-extras-title">If you choose to implement</h3>
              <p className="plan-scope-small">We start with your existing tools and look for the most economical fit.</p>
              <p className="plan-scope-small">Possible extra costs, only if needed:</p>
              <ul>{PLAN_EXTRA_COSTS.map(item => <li key={item}>{item}</li>)}</ul>
              <p className="plan-scope-small">You approve any extra BlueChip work and price before it starts.</p>
            </section>
          </div>
          <p className="plan-delivery-details">Delivery details: <a href="https://www.bluechip-people-strategies.com/terms">see our Terms</a>.</p>
        </GlassPanel>
      </div>

      <PlanInside />

      <GlassPanel as="section" className="glass-panel plan-booking-facts" aria-labelledby="plan-booking-title" plasma={{ radius: 20, opacity: 0.6 }}>
        <h2 id="plan-booking-title">Your investment. Your safety net.</h2>
        <div className="plan-booking-grid">
          <div><p className="plan-booking-label">One-time investment</p><p className="plan-booking-amount">{dollars(PLAN_FEE)}</p><p className="plan-booking-note">{FUTURE_PRICE_NOTICE}</p><p className="plan-scope-agreement">We'll agree the people and work to look at together before you pay{edition === 'public-sector' ? ' or confirm a purchase order' : ''}. Discovery helps us choose the best place to start.</p></div>
          <div className="plan-minimum-value"><p className="plan-booking-label">What 3 net team hours could mean</p><p className="plan-booking-amount">C$5,760<span> / year</span></p><p className="plan-booking-note">3 hours/week × 48 working weeks × C$40/hour, if achieved.</p><p className="plan-booking-note">Illustrative staff-time value, not a business average or cash savings.</p></div>
        </div>
        <section className="plan-safety" aria-labelledby="plan-safety-title">
        <p className="plan-safety-body"><strong id="plan-safety-title">Your safety net:</strong> {SAFETY_NET}</p>
        <p className="plan-safety-defs"><em>{SAFETY_NET_DEFINITIONS}</em></p>
        <p className="plan-safety-refund"><a href={REFUND_URL}>Refund Policy</a></p>
        <p className="ai-cta-row"><PlanButton className="plan-btn--safety" href={`#chat?topic=${copy.chatTopic}`}>Start the conversation</PlanButton></p>
        </section>
        <div className="plan-booking-options"><p className="plan-booking-note">Not sure about timing? Send us a message and we’ll find a time that works.</p><a className="plan-timing-link" href={`#chat?topic=${copy.chatTopic}`}>Ask us about timing →</a><details><summary>Payment options</summary><p className="plan-payment-note">Prefer to pay another way? <a href={`#chat?topic=${copy.chatTopic}`}>Reach out, and we can work something out.</a> Municipalities and public bodies can use a purchase order and invoice.</p></details></div>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel" aria-labelledby="ai-next-title">
        <h2 id="ai-next-title">{RETAINER_HEADING}</h2>
        <p>Once you have your plan, you choose how to implement it: your team, another provider, or BlueChip.</p>
        <p>If you'd like BlueChip to drive implementation, we'll agree the scope and price with you first.</p>
        <details className="plan-retainer-credit"><summary>Retainer credit</summary><p>{RETAINER_BODY}</p></details>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel glass-faq" aria-labelledby="plan-faq-title" plasma={{ radius: 18, opacity: 0.5 }}>
        <h2 id="plan-faq-title">Questions about getting started</h2>
        <details open><summary>What if we don't know where to start with AI?</summary><p>That's exactly what the AI Handoff Plan helps you figure out. You know your team's work, and we bring the practical AI knowledge. We look at it together and recommend a useful place to start, so you don't have to choose a tool or design a project before talking to us.</p></details>
        <details><summary>What will we have when we're done?</summary><p>A written AI Handoff Plan that explains where AI can help, which tools fit your work, and what your team should try first. You'll also have setup steps, prompts, templates and a review checklist, with a one-page summary you can share with the people making the decision.</p></details>
        <details><summary>Why wouldn't we just ask an AI tool what to do?</summary><p>You can, and it may give you useful ideas. We work through how your team actually does the work, including the handoffs, information, costs and human checks. Your AI plan turns that into a recommendation your team can act on, with a first step to try together.</p></details>
        <details><summary>What if we're already using AI?</summary><p>We start with what you already do and the tools you have. Your AI plan can help you improve an existing use, connect steps that still take manual work, or decide which opportunity to tackle next.</p></details>
        <details><summary>How does the three-hour promise work?</summary><p>We'll show you where to get at least 3 hours a week back across the people and work we review together. We account for the time needed to check AI's work and keep it running. If your AI plan doesn't identify that opportunity, we automatically refund your full fee within 10 business days of your findings call.</p><p>Your AI plan shows where the time can come from and how to put the changes into practice. You choose which changes to make, and the time you get back depends on putting them to work.</p><p><a href={REFUND_URL}>Read the refund details</a>.</p></details>
        <details><summary>Is that three hours for every person?</summary><p>The promise is at least 3 hours a week in total across the people and work we review together. The opportunity may sit with one person or be shared across your team, and your AI plan shows how it adds up.</p></details>
        <details><summary>How much time will our team need?</summary><p>About 2 hours each for 1 or 2 people who do the work: a 60-minute discovery session, a 45-minute findings call and a 15-minute check-in. You join the findings call, and if you're one of those participants, it's already included in your 2 hours.</p></details>
        <details><summary>Do you help us take the first step?</summary><p>Yes. We use your 45-minute findings call to walk through your AI plan and help you try a first step in a tool your organization allows. If IT needs to act first, we can prepare the request. Further setup or a wider rollout can be scoped separately if you'd like our help.</p></details>
        <details><summary>Will we need to buy new software?</summary><p>We start with the tools you already have and look for the most economical fit. Your AI plan identifies any recommended software or licence costs, so you can decide what to put in place. Those costs are separate from your plan fee.</p></details>
        <details><summary>Do I need to buy ongoing support?</summary><p>No. You can keep your AI plan and put it in place yourself or with another provider.</p><p>If you'd like BlueChip to help with implementation, we'll agree the scope and price with you first.</p></details>
        <details><summary>Can a municipality or public body use a purchase order?</summary><p>Yes. We agree the scope with you before you confirm the purchase order, then work through your normal invoicing process.</p></details>
        <details><summary>What should we bring to the first conversation?</summary><p>Tell us about work your team repeats, something that takes longer than you'd like, or simply that you'd like help figuring out where AI fits. We'll help you work out the next step.</p></details>
      </GlassPanel>

      <PlanClose chatTopic={copy.chatTopic} />
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/about">About BlueChip</a> &middot; <a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
    </main>
  </GlassStage>;
}
