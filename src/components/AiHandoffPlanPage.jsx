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
import {
  EDITIONS, GENERAL_PATH, PUBLIC_SECTOR_PATH, REFUND_URL,
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
  { time: '45 minutes', name: 'Findings and setup', Icon: CallIcon, bullets: ['Walk through your AI plan', 'First-step help in an approved tool, within this call', 'If needed: IT request ready to send'] },
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

  usePageMeta(copy.title, copy.description);
  useEffect(() => { loadChatWidget(); }, []);

  return <GlassStage>
    <main className={`bc-page ai-funnel ai-glass ai-plan ai-plan--${edition}`}>
      <SiteHeader showCta chatTopic={copy.chatTopic} />

      <header className="ai-hero glass-hero">
        <div className="glass-hero-copy">
          <h1>The AI Handoff Plan</h1>
          <EditionSwitch edition={edition} search={search} />
          <h2 className="plan-headline">{copy.headline}</h2>
          <p className="glass-lede">{copy.lead}</p>
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
          <div><p className="plan-booking-label">One-time investment</p><p className="plan-booking-amount">{dollars(PLAN_FEE)}</p><p className="plan-booking-note">{FUTURE_PRICE_NOTICE}</p><p className="plan-scope-agreement">Before payment{edition === 'public-sector' ? ' or confirming a purchase order' : ''}, we agree the people and work areas to review. We set priorities together during discovery.</p></div>
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
        <h2 id="plan-faq-title">FAQ</h2>
        <details><summary>Does the guarantee mean three hours for every employee?</summary><p>No. The 3 hours are a total across the agreed people and work reviewed, not 3 hours per person or per task. We agree the people and work areas before payment, or before confirming a public-body purchase order, then set priorities during discovery.</p></details>
        <details><summary>Do you set the tools up for us?</summary><p>During the existing 45-minute findings call, we help with a first step in an approved tool, within the time available. If IT action is needed, we can prepare an IT request instead. If you choose to implement, any needed software, licences, IT installations or wider rollout are separate. We start with your existing tools and agree any extra BlueChip work and price first.</p></details>
        <details><summary>Do I need to buy ongoing support?</summary><p>No. You can keep your AI plan and put it in place yourself or with another provider.</p></details>
      </GlassPanel>

      <PlanClose chatTopic={copy.chatTopic} />
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/about">About BlueChip</a> &middot; <a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
    </main>
  </GlassStage>;
}
