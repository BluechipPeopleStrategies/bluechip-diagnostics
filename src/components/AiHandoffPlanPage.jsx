import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AiCalculator from './AiCalculator';
import Emblem from './Emblem';
import SavingsEquation from './SavingsEquation';
import SiteHeader from './SiteHeader';
import { LEGACY_WORKFLOW_LABELS } from '../lib/aiOpportunity';
import { usePageMeta } from '../lib/seo';
import { loadChatWidget } from '../lib/chatWidget';
import './AiFunnel.css';

// Inquiry only until the plan's own checkout is connected.
export default function AiHandoffPlanPage() {
  const [params] = useSearchParams();
  const legacyWorkflow = LEGACY_WORKFLOW_LABELS[params.get('workflow')]; // keeps old ?workflow= links working
  const [calc, setCalc] = useState({ people: 1, hours: 5, rate: 40, weeks: 48 });

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
        <p>A practical AI audit of your organization's recurring work, with one workflow redesigned and a roadmap your team can put into practice. You'll know what to hand to AI, what stays with your people, and which tools to start with.</p>
      </div>
      <Emblem slug="ai-handoff-plan" />
    </header>

    {legacyWorkflow && <p className="ai-context">Your starting point: <strong>{legacyWorkflow}</strong>. We examine how the work happens before recommending a tool.</p>}

    <section className="ai-panel ai-panel--focal" aria-labelledby="ai-price-title">
      <h2 id="ai-price-title">C$999, taxes included</h2>
      <div className="ai-guarantee-band">
        <p className="ai-guarantee-headline">We'll find at least 5 net hours a week of AI time savings, or your fee back.</p>
        <p className="ai-guarantee-support">If the plan can't find tools with evidence-backed potential to save at least 5 net hours a week across your organization, your full fee comes back within 10 business days, no forms, no hoops.</p>
      </div>
      <p>If you cancel before your discovery session, and before any work on your plan has begun, we refund your full fee. See the <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> for how refunds work.</p>
      <p className="ai-cta-row"><a className="ai-button" href="#chat">Start the conversation</a></p>
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

    <SavingsEquation />

    <section className="ai-calc-inline" aria-labelledby="ai-calc-inline-title"><p className="ai-eyebrow">Calculator</p><h2 id="ai-calc-inline-title">What could that time be worth?</h2><p>Adjust the numbers to fit your organization. Nothing leaves this page.</p><AiCalculator calc={calc} setCalc={setCalc} /></section>

    <section><h2>A focused plan, with clear deliverables.</h2><ul><li>One 60-minute discovery session.</li><li>An organization-wide opportunity scan.</li><li>One priority workflow redesigned.</li><li>A written plan within five business days of discovery and receipt of the information needed for it.</li><li>A 30-minute findings call.</li></ul></section>
    <h2>What you take away</h2>
    <div className="ai-inclusions">
      <section><h3>A review of your actual work</h3><p>Recurring tasks, handoffs, current tools and the people doing the work.</p></section>
      <section><h3>A prioritised tool roadmap</h3><p>What to use, why it fits, the alternatives, and where a simpler process or an existing tool is enough.</p></section>
      <section><h3>A time-savings breakdown</h3><p>Baseline, frequency and estimated net savings, including checking, corrections and upkeep. Shared work counts once.</p></section>
      <section><h3>Costs and practical boundaries</h3><p>Software costs, setup effort, which information can safely go into which tool, and the work that needs human review.</p></section>
      <section><h3>One redesigned workflow</h3><p>A map of the current process and an improved sequence, with unnecessary steps removed, recommended tools, responsibilities, human checkpoints and implementation steps.</p></section>
      <section><h3>A findings walkthrough</h3><p>Review the plan and calculations together. It's yours to keep.</p></section>
    </div>
    <details><summary>Look inside the plan</summary><p>Illustrative structure, not a client result.</p><ol><li>Current workflow and evidence</li><li>Recommended tool and alternatives</li><li>Baseline time, expected review time and net savings</li><li>Costs, permissions and setup effort</li><li>One redesigned workflow, implementation steps and success measures</li></ol><p>No savings figure is assigned until the actual work has been assessed.</p></details>
    <h2>How the plan works</h2><ol className="ai-steps"><li>Agree the work covered and review the terms.</li><li>Complete a 60-minute discovery session.</li><li>Receive your plan and findings walkthrough.</li><li>Choose and implement your next steps.</li></ol>
    <details><summary>Does the guarantee mean five hours for every employee?</summary><p>No. It is five net hours per week across the organization in total, from one or several workflows. It does not have to come entirely from the one workflow we redesign.</p></details>
    <details><summary>Do you set the tools up for us?</summary><p>Not as part of the plan. You get the plan, the recommended tools and what it takes to set them up, with setup steps for the workflow we redesign, and your team puts it in place. We favour tools you already have or can start with right away. If you'd like a hand, we can work alongside your team through a retainer (six-month minimum), and the plan's fee is credited if you start within 60 days of your findings call.</p></details>
    <details><summary>Do I need to buy ongoing support?</summary><p>No. A retainer is not required to keep your plan or qualify for the refund.</p></details>

    <section className="ai-panel" aria-label="Start the conversation"><h2>Talk through The AI Handoff Plan</h2><p>Start a conversation with BlueChip to confirm the fit, scope and next steps. An inquiry does not create a booking or take payment.</p><p><a className="ai-button" href="#chat">Start the conversation</a></p></section>
    <p><Link to="/ai-opportunity-check">Start with the free AI Opportunity Check</Link></p>
    <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/terms">Terms</a> &middot; <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> &middot; <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
  </main>;
}
