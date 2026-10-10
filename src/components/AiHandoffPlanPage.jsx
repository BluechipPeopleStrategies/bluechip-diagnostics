import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
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
  EDITIONS, GENERAL_PATH, PUBLIC_SECTOR_PATH, REFUND_URL, ILLUSTRATION,
  BOX_YOUR_TIME, BOX_NOT_INCLUDED, SAFETY_NET, SAFETY_NET_DEFINITIONS, CTA_LEAD, RETAINER_HEADING, RETAINER_BODY,
} from './plan/planCopy';
import './AiFunnel.css';
import './AiHandoffGlass.css';
import './plan/plan.css';

// Page order (Thomas, 2026-10-08): the capacity-first lead, the example, the "What you get for
// C$795" box, the guarantee as "Your safety net", then "Start the conversation". The rest of the
// page (how it works, what is inside, questions) follows. Two editions share this component:
// general at /ai-handoff-plan, public sector at /ai-handoff-plan/public-sector.

// How the visit runs, from the box. Same steps, same times, same order as the box and the letter.
const PLAN_KIT = [
  "A starter kit: the prompts, templates and a checklist for checking the AI's work",
  'A one-page summary for whoever signs off',
  "A simple hours tracker for the people doing the work, to see how the workflow's time changes",
];
const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', Icon: DiscoveryIcon, youGet: 'a session with up to two people who do the work.' },
  { time: 'Within 5 business days*', name: 'Written plan', Icon: PlanDocIcon, youGet: 'the workflow, tools, costs, setup effort and net team hours, and what AI can take on.', key: true },
  { time: '45 minutes', name: 'Findings and setup', Icon: CallIcon, youGet: 'the first step set up in an allowed tool, or an IT request ready to send.' },
  { time: 'About 30 days later', name: 'Check-in', Icon: ChecklistIcon, youGet: 'a 15-minute check-in on how it is going.' },
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
  const { small } = ILLUSTRATION;
  return (
    <GlassPanel as="section" className="glass-panel plan-example" aria-labelledby="plan-example-title" plasma={{ radius: 20, opacity: 0.55, elevation: 0.5 }}>
      <h2 id="plan-example-title">Small amounts of time add up</h2>
      <p className="plan-example-label">Illustration, not a promise or a client result.</p>
      <div className="plan-equation" role="group" aria-label="Illustrative team hours">
        <div><strong>{small.people}</strong><span>people</span></div>
        <span className="plan-equation-sign" aria-label="times">×</span>
        <div><strong>1</strong><span>net hour each / week</span></div>
        <span className="plan-equation-sign" aria-label="equals">=</span>
        <div className="plan-equation-total"><strong>{small.weekly}</strong><span>team hours / week</span></div>
      </div>
      <p className="plan-example-basis">About {small.yearly} hours a year at 48 working weeks. Net time allows for checking AI's work and keeping the tools running.</p>
      <p className="plan-guardrail">{guardrail}</p>
    </GlassPanel>
  );
}

function WorkflowOverview() {
  return <section className="plan-workflow" aria-labelledby="plan-workflow-title">
    <h2 id="plan-workflow-title">One workflow. Shared time.</h2>
    <ol className="plan-workflow-list">
      <li><span className="plan-workflow-number">01</span><strong>One repeated workflow</strong><span>Start with work your team already does.</span></li>
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
          <p className="ai-eyebrow">A written AI review of one workflow</p>
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
          <h2 id="ai-price-title">What you get for C$795</h2>
          <p className="plan-box-opener">{copy.opener}</p>
          <PlanFlow steps={FLOW_STEPS} />
          <ul className="plan-included-tools" aria-label="Included with your written plan">
            {PLAN_KIT.map(item => <li key={item}>{item}</li>)}
          </ul>
          <p className="plan-box-timing">*Within five business days of having what the written plan needs. Before invoicing, we agree which roles do the workflow.</p>
          <div className="plan-scope-pair">
          <p className="plan-box-note"><strong>Your time:</strong> {BOX_YOUR_TIME}</p>
          <p className="plan-box-note"><strong>Not included:</strong> {BOX_NOT_INCLUDED}</p>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel as="section" className="glass-panel plan-safety" aria-labelledby="plan-safety-title" plasma={{ radius: 20, opacity: 0.5 }}>
        <p className="plan-safety-body"><strong id="plan-safety-title">Your safety net:</strong> {SAFETY_NET}</p>
        <p className="plan-safety-defs"><em>{SAFETY_NET_DEFINITIONS}</em></p>
        <p className="plan-safety-refund">See our <a href={REFUND_URL}>Refund Policy</a>, section 1.</p>
        <p className="plan-cta-lead">{CTA_LEAD}</p>
        <p className="ai-cta-row"><PlanButton href={`#chat?topic=${copy.chatTopic}`}>Start the conversation</PlanButton></p>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel" aria-labelledby="ai-next-title">
        <h2 id="ai-next-title">{RETAINER_HEADING}</h2>
        <p>{RETAINER_BODY} Conditions are in our <a href={REFUND_URL}>Refund Policy</a>, section 1.</p>

      </GlassPanel>

      <GlassPanel as="section" className="glass-panel glass-strip ai-credibility" aria-label="About BlueChip" plasma={{ radius: 14, opacity: 0.5 }}>
        <p>Built and run by BlueChip People Strategies. <a href="https://www.bluechip-people-strategies.com/about">More about us &rarr;</a></p>
      </GlassPanel>

      <PlanInside />

      <GlassPanel className="glass-panel glass-faq" plasma={{ radius: 18, opacity: 0.5 }}>
        <details><summary>Does the guarantee mean three hours for every employee?</summary><p>No. The 3 hours are the total across the people who do that workflow, not 3 hours each. The people who do the work means everyone who regularly does that workflow, agreed with you before we start.</p></details>
        <details><summary>Do you set the tools up for us?</summary><p>On the findings and setup call, one or two of the people who do the work set up the first step with us, in a tool you already allow. If none fits yet, the call ends with the IT request written and ready to send. Software and licences, anything your IT team installs, and rolling the change out to the rest of the team are not included.</p></details>
        <details><summary>Do I need to buy ongoing support?</summary><p>No. You can keep your AI plan and put it in place yourself or with another provider.</p></details>
      </GlassPanel>

      <PlanClose chatTopic={copy.chatTopic} />
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href={REFUND_URL}>Refund Policy</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
    </main>
  </GlassStage>;
}
