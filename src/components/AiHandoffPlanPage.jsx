import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import PulseScale from './PulseScale.jsx';
import { PLAN_FEE, dollars, FUTURE_PRICE_NOTICE, PLAN_CAPACITY_NOTICE } from '../lib/planPricing.js';
import GlassStage from './glass/GlassStage';
import GlassPanel from './glass/GlassPanel';
import {
  DiscoveryIcon, PlanDocIcon, CallIcon, ChecklistIcon,
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
  BOX_YOUR_TIME, BOX_NOT_INCLUDED, SAFETY_NET, SAFETY_NET_DEFINITIONS, CTA_LEAD, RETAINER_HEADING, RETAINER_BODY,
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
  "Four-day quick-start plan: a day-by-day guide your team follows to set up, test and check the AI's work",
  'Starter kit: prompts, templates and a review checklist',
  'One-page summary for sign-off',
  "Hours tracker: see how time across the agreed work changes",
];
const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', Icon: DiscoveryIcon, bullets: ['Meet virtually with up to two people who do the work', 'Review the work and agree priorities'] },
  { time: 'Within 5 business days*', name: 'Handoff plan', Icon: PlanDocIcon, bullets: ['What AI could take on, what your people keep', 'Tool choice, costs and setup effort', 'What information can go into which tool', 'Projected net team hours a week'], key: true },
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
    <h2 id="plan-workflow-title">Your work. Shared time.</h2>
    <ol className="plan-workflow-list">
      <li><span className="plan-workflow-number">01</span><strong>The work you repeat</strong><span>Start with work your team already does.</span></li>
      <li><span className="plan-workflow-number">02</span><strong>AI handles suitable steps</strong><span>Your AI plan identifies what could be handed over.</span></li>
      <li><span className="plan-workflow-number">03</span><strong>People review and decide</strong><span>Judgment and checking stay with your people.</span></li>
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
            {PLAN_KIT.map(item => <li key={item}>{item}</li>)}
          </ul>
          <p className="plan-box-timing">*Within five business days after all needed information is received. People and work areas are agreed before payment, or before confirming a public-body purchase order. Priorities are set during discovery.</p>
          <div className="plan-scope-pair">
          <p className="plan-box-note"><strong>Your time:</strong> {BOX_YOUR_TIME}</p>
          <p className="plan-box-note"><strong>Not included:</strong> {BOX_NOT_INCLUDED}</p>
          </div>
        </GlassPanel>
      </div>

      <PlanInside />

      <GlassPanel as="aside" className="glass-panel plan-booking-facts" aria-labelledby="plan-booking-title" plasma={{ radius: 20, opacity: 0.6 }}>
        <h2 id="plan-booking-title">Fee & availability</h2>
        <div className="plan-booking-grid">
          <div><p className="plan-booking-label">One-time fee</p><p className="plan-booking-amount">{dollars(PLAN_FEE)}</p><p className="plan-booking-note">{FUTURE_PRICE_NOTICE}</p></div>
          <div><p className="plan-booking-label">Monthly capacity</p><p className="plan-booking-note">{PLAN_CAPACITY_NOTICE}</p><p className="plan-booking-note">Ask us about timing before you book.</p></div>
        </div>
        <p className="plan-payment-note">Prefer to pay another way? <a href={`#chat?topic=${copy.chatTopic}`}>Reach out, and we can work something out.</a> Municipalities and public bodies can use a purchase order and invoice.</p>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel plan-safety" aria-labelledby="plan-safety-title" plasma={{ radius: 20, opacity: 0.5 }}>
        <p className="plan-safety-body"><strong id="plan-safety-title">Your safety net:</strong> {SAFETY_NET}</p>
        <p className="plan-safety-defs"><em>{SAFETY_NET_DEFINITIONS}</em></p>
        <p className="plan-safety-refund"><a href={REFUND_URL}>Refund Policy</a></p>
        <p className="plan-cta-lead">{CTA_LEAD}</p>
        <p className="ai-cta-row"><PlanButton href={`#chat?topic=${copy.chatTopic}`}>Start the conversation</PlanButton></p>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel" aria-labelledby="ai-next-title">
        <h2 id="ai-next-title">{RETAINER_HEADING}</h2>
        <p>Use your plan yourself, with another provider, or with BlueChip. No retainer required.</p>
        <p>Further BlueChip implementation is priced separately, with HR support included within that agreed scope.</p>
        <details className="plan-retainer-credit"><summary>Retainer credit</summary><p>{RETAINER_BODY}</p></details>
      </GlassPanel>

      <GlassPanel className="glass-panel glass-faq" plasma={{ radius: 18, opacity: 0.5 }}>
        <details><summary>Does the guarantee mean three hours for every employee?</summary><p>No. The 3 hours are a total across the agreed people and work reviewed, not 3 hours per person or per task. We agree the people and work areas before payment, or before confirming a public-body purchase order, then set priorities during discovery.</p></details>
        <details><summary>Do you set the tools up for us?</summary><p>During the existing 45-minute findings call, we help with a first step in an approved tool, within the time available. If IT action is needed, we can prepare an IT request instead. Software and licences, anything your IT team installs, and rolling the change out to the rest of the team are not included.</p></details>
        <details><summary>Do I need to buy ongoing support?</summary><p>No. You can keep your AI plan and put it in place yourself or with another provider.</p></details>
      </GlassPanel>

      <PlanClose chatTopic={copy.chatTopic} />
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/about">About BlueChip</a> &middot; <a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
    </main>
  </GlassStage>;
}
