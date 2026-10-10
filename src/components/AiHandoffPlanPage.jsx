import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import GlassStage from './glass/GlassStage';
import GlassPanel from './glass/GlassPanel';
import {
  DiscoveryIcon, PlanDocIcon, CallIcon, ChecklistIcon, HelpIcon, RouteIcon,
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
  EDITIONS, GENERAL_PATH, PUBLIC_SECTOR_PATH, REFUND_URL, ILLUSTRATION, ILLUSTRATION_BASIS, ILLUSTRATION_TEXT,
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
const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', Icon: DiscoveryIcon, youGet: 'a discovery session with up to two of the people who do the work.' },
  { time: 'Within 5 business days of having what it needs', name: 'Written plan', Icon: PlanDocIcon, youGet: 'a written AI plan: which parts of the workflow AI can take on and which stay with your people, how the hours add up across the people who do it, which tool to start with and why, the costs, the setup effort, and what should and shouldn\'t go into each tool. It comes with a starter kit (prompts, templates and a checklist for checking the AI\'s work), a one-page summary for whoever signs off, and a simple hours tracker.', key: true },
  { time: '45 minutes', name: 'Findings and setup call', Icon: CallIcon, youGet: 'a findings and setup call where the first step gets set up in a tool you already allow, or, if none fits yet, the IT request gets written and ready to send.' },
  { time: 'About 30 days later', name: 'Check-in', Icon: ChecklistIcon, youGet: 'a 15-minute check-in on how it is going.' },
];

// Where your AI plan sits in the whole journey. Every node says in words whether it is free,
// paid, what it delivers, or optional, so nothing depends on the gold highlight.
const JOURNEY = [
  { tag: 'Free', name: 'AI Pulse', Icon: ChecklistIcon },
  { tag: 'Paid', name: 'The AI Handoff Plan', Icon: RouteIcon, key: true },
  { tag: 'You get', name: 'Written plan and findings call', Icon: PlanDocIcon },
  { tag: 'Optional', name: 'A retainer, if you want help', Icon: HelpIcon, optional: true },
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

// The page's one illustration, in hours only. The two tiles repeat the paragraph's figures for a
// quick read and are hidden from screen readers so the numbers are not announced twice.
function CapacityExample({ guardrail }) {
  const { small, big } = ILLUSTRATION;
  return (
    <GlassPanel as="section" className="glass-panel plan-example" aria-labelledby="plan-example-title" plasma={{ radius: 20, opacity: 0.55, elevation: 0.5 }}>
      <p className="ai-eyebrow" id="plan-example-title">An example</p>
      <div className="plan-example-tiles" aria-hidden="true">
        <div className="plan-example-tile">
          <span className="plan-example-people">{small.people} people</span>
          <strong>{small.weekly} hours a week</strong>
          <span>about {small.yearly} hours a year</span>
        </div>
        <div className="plan-example-tile">
          <span className="plan-example-people">{big.people} people</span>
          <strong>{big.weekly} hours a week</strong>
          <span>about {big.weeks} working weeks a year</span>
        </div>
      </div>
      <p className="plan-example-text">{ILLUSTRATION_TEXT}</p>
      <p className="plan-example-basis"><em>{ILLUSTRATION_BASIS}</em></p>
      <p className="plan-guardrail">{guardrail}</p>
    </GlassPanel>
  );
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

      <CapacityExample guardrail={copy.guardrail} />

      <div className="glass-stack">
        <span className="glass-sheet glass-sheet--back" aria-hidden="true" />
        <span className="glass-sheet glass-sheet--mid" aria-hidden="true" />
        <GlassPanel as="section" className="glass-panel glass-panel--focal plan-box" aria-labelledby="ai-price-title"
          plasma={{ radius: 24, tint: '#0E2140', opacity: 0.62, elevation: 0.7 }}>
          <h2 id="ai-price-title">What you get for C$795</h2>
          <p className="plan-box-opener">{copy.opener}</p>
          <p className="plan-box-note"><strong>Your time:</strong> {BOX_YOUR_TIME}</p>
          <p className="plan-box-note"><strong>Not included:</strong> {BOX_NOT_INCLUDED}</p>
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

        <p className="ai-eyebrow glass-journey-title" id="ai-journey-title">Where your AI plan fits</p>
        <ol className="glass-journey" aria-labelledby="ai-journey-title">
          {JOURNEY.map(({ tag, name, Icon, key, optional }) => (
            <li key={name} className={`glass-journey-node${key ? ' is-key' : ''}${optional ? ' is-optional' : ''}`}>
              <Icon className="glass-journey-icon" />
              <span className="glass-journey-tag">{tag}</span>
              <span className="glass-journey-name">{name}</span>
            </li>
          ))}
        </ol>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel glass-strip ai-credibility" aria-label="About BlueChip" plasma={{ radius: 14, opacity: 0.5 }}>
        <p>Built and run by BlueChip People Strategies. <a href="https://www.bluechip-people-strategies.com/about">More about us &rarr;</a></p>
      </GlassPanel>

      <section className="ai-flow glass-flow" aria-labelledby="ai-flow-title">
        <div className="ai-flow-head">
          <div>
            <h2 id="ai-flow-title">How it works, and what you get.</h2>
            <p className="ai-flow-footnote">Before we invoice, we agree with you which roles do the chosen workflow. Your written plan arrives within five business days of having what it needs.</p>
          </div>
          <GlassPanel className="glass-panel glass-flow-frame" plasma={{ radius: 18, opacity: 0.35 }}>
            <img className="ai-flow-photo" alt=""
              src="/img/ai/05-human-checkpoint-1600.webp"
              srcSet="/img/ai/05-human-checkpoint-800.webp 800w, /img/ai/05-human-checkpoint-1600.webp 1600w"
              sizes="(max-width: 700px) 100vw, 380px"
              width="1600" height="1073" loading="lazy" />
          </GlassPanel>
        </div>
        <PlanFlow steps={FLOW_STEPS} />
      </section>

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
