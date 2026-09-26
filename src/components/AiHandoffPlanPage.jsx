import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SavingsEquation from './SavingsEquation';
import SiteHeader from './SiteHeader';
import GlassStage from './glass/GlassStage';
import GlassPanel from './glass/GlassPanel';
import {
  DiscoveryIcon, ScanIcon, RouteIcon, PlanDocIcon, CallIcon,
  ChecklistIcon, HelpIcon, TickIcon, ReturnIcon,
} from './PlanIcons';
import { LEGACY_WORKFLOW_LABELS, GUARANTEE_NET_HOURS } from '../lib/aiOpportunity';
import { usePageMeta } from '../lib/seo';
import { loadChatWidget } from '../lib/chatWidget';
import PlanButton from './plan/PlanButton';
import PlanHeroArt from './plan/PlanHeroArt';
import PlanFlow from './plan/PlanFlow';
import PlanInside from './plan/PlanInside';
import PlanClose from './plan/PlanClose';
import './AiFunnel.css';
import './AiHandoffGlass.css';
import './plan/plan.css';

// Combined page (2026-09-26, decision D7): #50's glass page and scope copy are the base; #52's
// hero art, drawn step track, plan mockup, buttons, closing card, header and FAQ links are ported
// onto it (walkthrough items 35-42, 58).

// Where the named offerings in the copy below are explained (punch list item 38). Both live on
// the main site's retainers page: its "Then, three ways to put it in place" block describes the
// Implementation Sprint (anchor #practical-ai-audit), and the page itself is the retainers page.
const RETAINERS_URL = 'https://www.bluechip-people-strategies.com/embedded-hr-retainers';
const SPRINT_URL = `${RETAINERS_URL}#practical-ai-audit`;

// Scope (Thomas, 2026-09-25): the plan no longer commits to redesigning one workflow. Step 3 is
// a walkthrough of the client's key workflows, with where AI fits and where it doesn't.
const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', Icon: DiscoveryIcon, youGet: 'a review of your actual work, covering tasks, handoffs, tools and people.' },
  { time: 'Organization-wide', name: 'Opportunity scan', Icon: ScanIcon, youGet: 'a time-savings breakdown, net of checking and upkeep. Shared work counts once.' },
  { time: 'Key workflows', name: 'Walkthrough', Icon: RouteIcon, youGet: "your key workflows talked through, with where AI fits and where it doesn't, and a first step for each." },
  { time: 'Within 5 business days', name: 'Written plan', Icon: PlanDocIcon, youGet: 'a prioritized tool roadmap (what to use, why, the alternatives), plus costs, setup effort and what information can safely go into which tool.', key: true },
  { time: '30 minutes', name: 'Findings call', Icon: CallIcon, youGet: "a walkthrough together, ending with the one recommendation we'd start with. The plan is yours to keep." },
];

// Where the plan sits in the whole journey. Every node says in words whether it is free, the
// plan itself, what the plan delivers, or optional, so nothing depends on the gold highlight.
const JOURNEY = [
  { tag: 'Free', name: 'Free AI Opportunity Check', Icon: ChecklistIcon },
  { tag: 'C$999', name: 'The AI Handoff Plan', Icon: RouteIcon, key: true },
  { tag: 'You get', name: 'Written plan and findings call', Icon: PlanDocIcon },
  { tag: 'Optional', name: 'A retainer, if you want help', Icon: HelpIcon, optional: true },
];

// Number(null) and Number('') both evaluate to 0, which is finite -- so a plain isFinite check
// can't distinguish "no query param" from "param is 0" and would silently clamp an absent
// perPersonHours/employees param to the slider's minimum instead of falling back to the
// intended default. Missing/blank raw values fall back explicitly, before Number() ever runs.
function clampNumber(raw, min, max, fallback) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

// The guarantee, drawn: what the plan finds, minus the time spent checking the tools' work and
// keeping them up, leaves the net hours; the line is GUARANTEE_NET_HOURS. Bars are HTML, not SVG
// text, so every label stays at readable size on a phone. The checking segment is hatched and
// the guarantee line is a labelled rule, so no part of it relies on colour.
function NetHoursDiagram() {
  const scaleMax = 5; // illustrative scale, hours a week
  const line = `${(GUARANTEE_NET_HOURS / scaleMax) * 100}%`;
  return (
    <figure className="nh" aria-labelledby="nh-title">
      <figcaption id="nh-title" className="nh-title">How the {GUARANTEE_NET_HOURS} hours are counted</figcaption>
      <div className="nh-chart" style={{ '--line': line }}>
        <div className="nh-row">
          <span className="nh-label">Time the plan finds</span>
          <span className="nh-track"><span className="nh-bar nh-bar--found" style={{ '--w': '92%' }} /></span>
        </div>
        <div className="nh-row">
          <span className="nh-label">Minus checking and upkeep</span>
          <span className="nh-track"><span className="nh-bar nh-bar--check" style={{ '--x': '74%', '--w': '18%' }} /></span>
        </div>
        <div className="nh-row nh-row--net">
          <span className="nh-label">Net hours a week</span>
          <span className="nh-track"><span className="nh-bar nh-bar--net" style={{ '--w': '74%' }} /></span>
        </div>
        <span className="nh-line" aria-hidden="true"><span>{GUARANTEE_NET_HOURS} net hours a week</span></span>
      </div>
      <ul className="nh-outcomes">
        <li><TickIcon className="nh-icon" /><span><b>At or above the line:</b> the guarantee is met.</span></li>
        <li><ReturnIcon className="nh-icon" /><span><b>Below the line:</b> your full fee back.</span></li>
      </ul>
      <p className="nh-note">Illustration, not a client result.</p>
    </figure>
  );
}

// Inquiry only until the plan's own checkout is connected.
export default function AiHandoffPlanPage() {
  const [params] = useSearchParams();
  const legacyWorkflow = LEGACY_WORKFLOW_LABELS[params.get('workflow')]; // keeps old ?workflow= links working
  // Carried over from the free check's "See how the plan works" CTA, so the team calculator
  // below starts from the visitor's own numbers instead of the generic defaults.
  const carriedHours = clampNumber(params.get('perPersonHours'), 0.5, 10, 1);
  const carriedEmployees = clampNumber(params.get('employees'), 1, 500, 25);

  usePageMeta(
    'The AI Handoff Plan: Practical AI Audit | BlueChip',
    "A practical AI audit of your organization's recurring work, with your key workflows talked through. We'll find at least 3 net hours a week, or your fee back. C$999."
  );
  useEffect(() => { loadChatWidget(); }, []);

  return <GlassStage>
    <main className="bc-page ai-funnel ai-glass ai-plan">
      <SiteHeader showCta />

      <header className="ai-hero glass-hero">
        <div className="glass-hero-copy">
          <p className="ai-eyebrow">AI workflow review and roadmap</p>
          <h1>The AI Handoff Plan</h1>
          <p className="glass-lede">A practical AI review of your organization's recurring work, with your key workflows talked through and a roadmap your team can put into practice. You'll know what to hand to AI, what stays with your people, and which tools to start with.</p>
        </div>
        <PlanHeroArt />
      </header>

      {legacyWorkflow && <p className="ai-context">Your starting point: <strong>{legacyWorkflow}</strong>. We examine how the work happens before recommending a tool.</p>}

      <div className="glass-stack">
        <span className="glass-sheet glass-sheet--back" aria-hidden="true" />
        <span className="glass-sheet glass-sheet--mid" aria-hidden="true" />
        <GlassPanel as="section" className="glass-panel glass-panel--focal" aria-labelledby="ai-price-title"
          plasma={{ radius: 24, tint: '#0E2140', opacity: 0.62, elevation: 0.7 }}>
          <div className="glass-price-grid">
            <div className="glass-price-main">
              <h2 id="ai-price-title">C$999, taxes included</h2>
              <div className="ai-guarantee-band">
                <p className="ai-guarantee-headline">We'll find at least 3 net hours a week of AI time savings, or your fee back.</p>
                <p className="ai-guarantee-support">If the plan can't find tools with evidence-backed potential to save at least 3 net hours a week across your organization, your full fee comes back within 10 business days of your findings call, no forms, no hoops.</p>
              </div>
              <p>If you cancel before your discovery session, and before any work on your plan has begun, we refund your full fee. See the <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> for how refunds work.</p>
              <p className="ai-cta-row"><PlanButton href="#chat?topic=ai-handoff-plan">Start the conversation</PlanButton></p>
            </div>
            <NetHoursDiagram />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel as="section" className="glass-panel" aria-labelledby="ai-implementation-title">
        <p className="ai-eyebrow">Who does what</p>
        <h2 id="ai-implementation-title">The plan is yours. Your team puts it in place.</h2>
        <p>The AI Handoff Plan tells you what to hand to AI, which tools to use and what it takes to set them up. We favour tools you already have or can start using right away. Your team does the implementing, so the guarantee covers finding the hours, and the hours you actually get back depend on how fully the plan is put to work.</p>
        <p><strong>Want a hand?</strong> You can implement on your own, or ask us to work alongside your team through a <a href={RETAINERS_URL}>Practical AI Retainer</a>, an <a href={RETAINERS_URL}>Embedded HR Retainer</a>, or both (six-month minimum). If you start within 60 days of your findings call, the plan's fee is credited to your first invoice. You can decide on the findings call or any time in the 60 days after, and there's no pressure either way.</p>

        <p className="ai-eyebrow glass-journey-title" id="ai-journey-title">Where the plan fits</p>
        <ol className="glass-journey" aria-labelledby="ai-journey-title">
          {JOURNEY.map(({ tag, name, Icon, key, optional }) => (
            <li key={name} className={`glass-journey-node${key ? ' is-key' : ''}${optional ? ' is-optional' : ''}`}>
              <Icon className="glass-journey-icon" />
              <span className="glass-journey-tag">{tag}</span>
              <span className="glass-journey-name">{name}</span>
            </li>
          ))}
        </ol>

        <div className="ai-table-wrap">
          <table className="ai-table">
            <thead><tr><th>We do</th><th>You do</th><th>Optional, if you want help</th></tr></thead>
            <tbody>
              <tr>
                <td data-label="We do">Map your recurring work, find the time, talk through your key workflows, write the plan and the net-hours tally</td>
                <td data-label="You do">Choose what to adopt, approve security and privacy, set up the tools, train your team, run the new workflow</td>
                <td data-label="Optional, if you want help">A retainer where we work alongside your team (six-month minimum, plan fee credited if you start within 60 days)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <GlassPanel as="section" className="glass-panel glass-strip ai-credibility" aria-label="About BlueChip" plasma={{ radius: 14, opacity: 0.5 }}>
        <p>Built and run by BlueChip People Strategies: senior HR experience across training, recruitment and organizational decision-making, a background in education and coaching, and 25 years of high-stakes, globally competitive strategy. <a href="https://www.bluechip-people-strategies.com/about">More about BlueChip &rarr;</a></p>
      </GlassPanel>

      <SavingsEquation defaultPerPersonHours={carriedHours} defaultEmployees={carriedEmployees} />

      <section className="ai-flow glass-flow" aria-labelledby="ai-flow-title">
        <div className="ai-flow-head">
          <div>
            <h2 id="ai-flow-title">How it works, and what you get.</h2>
            <p className="ai-flow-footnote">Before discovery, we agree the work covered and you review the terms. The plan arrives within five business days of discovery and receipt of the information needed for it.</p>
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
        {/* FAQ answers below are drafted verbatim per Thomas, 2026-09-24, and still need an Infy pass before this page goes live -- see the PR description. */}
        <details><summary>Does the guarantee mean three hours for every employee?</summary><p>No. The guarantee is three net hours a week across your whole organization, from one opportunity or several. But savings can multiply: when several people do the same kind of work, a change that saves one person an hour a week can save each of them about that much. That's why the plan counts the people doing each task, not just the task.</p></details>
        <details><summary>Do you set the tools up for us?</summary><p>Not as part of the plan itself. The plan gives you the tools and the setup steps. If you go further with us, yes. In an <a href={SPRINT_URL}>Implementation Sprint</a> we set up the first workflow your plan recommends, with your team. On a <a href={RETAINERS_URL}>Practical AI Retainer</a> we handle the setup, then keep the tools tuned and updated as the software changes. Software licences and any installs your IT team needs to do stay with you.</p></details>
        <details><summary>Do I need to buy ongoing support?</summary><p>No. A retainer isn't required to keep your plan or to decide if we can meet your needs. Going without one is the right choice if you'd rather move the plan forward yourselves. If you want a hand later, an <a href={SPRINT_URL}>Implementation Sprint</a> or a retainer is there when you need it.</p></details>
      </GlassPanel>

      <PlanClose />
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
    </main>
  </GlassStage>;
}
