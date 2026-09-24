import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SavingsEquation from './SavingsEquation';
import SiteHeader from './SiteHeader';
import { LEGACY_WORKFLOW_LABELS } from '../lib/aiOpportunity';
import { usePageMeta } from '../lib/seo';
import { loadChatWidget } from '../lib/chatWidget';
import './AiFunnel.css';

const FLOW_STEPS = [
  { time: '60 minutes', name: 'Discovery', youGet: 'a review of your actual work, covering tasks, handoffs, tools and people.' },
  { time: 'Organization-wide', name: 'Opportunity scan', youGet: 'a time-savings breakdown, net of checking and upkeep. Shared work counts once.' },
  { time: 'One workflow', name: 'Redesign', youGet: 'current vs improved process, with tools, responsibilities and human checkpoints.' },
  { time: 'Within 5 business days', name: 'Written plan', youGet: 'a prioritized tool roadmap (what to use, why, the alternatives), plus costs, setup effort and what information can safely go into which tool.', key: true },
  { time: '30 minutes', name: 'Findings call', youGet: 'a walkthrough together. The plan is yours to keep.' },
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
    "A practical AI audit of your organization's recurring work, with one workflow redesigned. We'll find at least 5 net hours a week, or your fee back. C$999."
  );
  useEffect(() => { loadChatWidget(); }, []);

  return <main className="bc-page ai-funnel">
    <SiteHeader showCta />

    <header className="ai-hero">
      <div>
        <p className="ai-eyebrow">AI workflow review and roadmap</p>
        <h1>The AI Handoff Plan</h1>
        <p>A practical AI review of your organization's recurring work, with one workflow redesigned and a roadmap your team can put into practice. You'll know what to hand to AI, what stays with your people, and which tools to start with.</p>
      </div>
      <img className="ai-hero-photo" alt=""
        src="/img/ai/01-plan-hero-1600.webp"
        srcSet="/img/ai/01-plan-hero-800.webp 800w, /img/ai/01-plan-hero-1600.webp 1600w"
        sizes="(max-width: 700px) 280px, 40vw"
        width="1600" height="1073" fetchpriority="high" />
    </header>

    {legacyWorkflow && <p className="ai-context">Your starting point: <strong>{legacyWorkflow}</strong>. We examine how the work happens before recommending a tool.</p>}

    <section className="ai-panel ai-panel--focal" aria-labelledby="ai-price-title">
      <h2 id="ai-price-title">C$999, taxes included</h2>
      <div className="ai-guarantee-band">
        <p className="ai-guarantee-headline">We'll find at least 5 net hours a week of AI time savings, or your fee back.</p>
        <p className="ai-guarantee-support">If the plan can't find tools with evidence-backed potential to save at least 5 net hours a week across your organization, your full fee comes back within 10 business days, no forms, no hoops.</p>
      </div>
      <p>If you cancel before your discovery session, and before any work on your plan has begun, we refund your full fee. See the <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> for how refunds work.</p>
      <p className="ai-cta-row"><a className="ai-button" href="#chat?topic=ai-handoff-plan">Start the conversation</a></p>
    </section>

    <section className="ai-panel" aria-labelledby="ai-implementation-title">
      <p className="ai-eyebrow">Who does what</p>
      <h2 id="ai-implementation-title">The plan is yours. Your team puts it in place.</h2>
      <p>The AI Handoff Plan tells you what to hand to AI, which tools to use and what it takes to set them up, with setup steps for the workflow we redesign. We favour tools you already have or can start using right away. Your team does the implementing, so the guarantee covers finding the hours, and the hours you actually get back depend on how fully the plan is put to work.</p>
      <p><strong>Want a hand?</strong> You can implement on your own, or ask us to work alongside your team through a Practical AI Retainer, an Embedded HR Retainer, or both (six-month minimum). If you start within 60 days of your findings call, the plan's fee is credited to your first invoice. You can decide on the findings call or any time in the 60 days after, and there's no pressure either way.</p>
      <div className="ai-table-wrap">
        <table className="ai-table">
          <thead><tr><th>We do</th><th>You do</th><th>Optional, if you want help</th></tr></thead>
          <tbody>
            <tr>
              <td>Map your recurring work, find the time, redesign one workflow, write the plan and the net-hours tally</td>
              <td>Choose what to adopt, approve security and privacy, set up the tools, train your team, run the new workflow</td>
              <td>A retainer where we work alongside your team (six-month minimum, plan fee credited if you start within 60 days)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section className="ai-credibility" aria-label="About BlueChip">
      <p>Built and run by BlueChip People Strategies: senior HR experience across training, recruitment and organizational decision-making, a background in education and coaching, and 25 years of high-stakes, globally competitive strategy. <a href="https://www.bluechip-people-strategies.com/about">More about BlueChip &rarr;</a></p>
    </section>

    <SavingsEquation defaultPerPersonHours={carriedHours} defaultEmployees={carriedEmployees} />

    <section className="ai-flow" aria-labelledby="ai-flow-title">
      <h2 id="ai-flow-title">How it works, and what you get.</h2>
      <img className="ai-flow-photo" alt=""
        src="/img/ai/05-human-checkpoint-1600.webp"
        srcSet="/img/ai/05-human-checkpoint-800.webp 800w, /img/ai/05-human-checkpoint-1600.webp 1600w"
        sizes="(max-width: 700px) 100vw, 640px"
        width="1600" height="1073" loading="lazy" />
      <ol className="ai-flow-steps">
        {FLOW_STEPS.map((s, i) => (
          <li className={`ai-flow-step ${s.key ? 'ai-flow-step--key' : ''}`} key={s.name}>
            <span className="ai-flow-num">{i + 1}</span>
            <p className="ai-flow-time">{s.time}</p>
            <p className="ai-flow-name">{s.name}</p>
            <p className="ai-flow-you-get"><span>You get</span> {s.youGet}</p>
          </li>
        ))}
      </ol>
      <p className="ai-flow-footnote">Before discovery, we agree the work covered and you review the terms. The plan arrives within five business days of discovery and receipt of the information needed for it.</p>
    </section>

    <details><summary>Look inside the plan</summary><p>Illustrative structure, not a client result.</p><ol><li>Current workflow and evidence</li><li>Recommended tool and alternatives</li><li>Baseline time, expected review time and net savings</li><li>Costs, permissions and setup effort</li><li>One redesigned workflow, implementation steps and success measures</li></ol><p>No savings figure is assigned until the actual work has been assessed.</p></details>
    {/* FAQ answers below are drafted verbatim per Thomas, 2026-09-24, and still need an Infy pass before this page goes live -- see the PR description. */}
    <details><summary>Does the guarantee mean five hours for every employee?</summary><p>No. The guarantee is five net hours a week across your whole organization, from one opportunity or several. But savings can multiply: when several people do the same kind of work, a change that saves one person an hour a week can save each of them about that much. That's why the plan counts the people doing each task, not just the task.</p></details>
    <details><summary>Do you set the tools up for us?</summary><p>Not as part of the plan itself. The plan gives you the tools and the setup steps. If you go further with us, yes. In an Implementation Sprint we set up the redesigned workflow with your team. On a Practical AI Retainer we handle the setup, then keep the tools tuned and updated as the software changes. Software licences and any installs your IT team needs to do stay with you.</p></details>
    <details><summary>Do I need to buy ongoing support?</summary><p>No. A retainer isn't required to keep your plan or to qualify for the refund. Going without one is the right choice if you'd rather move the plan forward yourselves. If you want a hand later, an Implementation Sprint or a retainer is there when you need it.</p></details>

    <section className="ai-panel" aria-label="Start the conversation"><h2>Talk through The AI Handoff Plan</h2><p>Start a conversation with BlueChip to confirm the fit, scope and next steps. An inquiry does not create a booking or take payment.</p><p><a className="ai-button" href="#chat?topic=ai-handoff-plan">Start the conversation</a></p></section>
    <p><Link to="/ai-opportunity-check">Start with the free AI Opportunity Check</Link></p>
    <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
  </main>;
}
