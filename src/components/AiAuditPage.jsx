import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AiCalculator from './AiCalculator';
import Emblem from './Emblem';
import { workflows } from '../lib/aiOpportunity';
import './AiFunnel.css';

// Inquiry only until the audit's own checkout is connected.
export default function AiAuditPage() {
  const [params] = useSearchParams();
  const workflow = workflows[params.get('workflow')];
  const [calc, setCalc] = useState({ hours: 5, rate: 40, weeks: 40 });
  return <main className="bc-page ai-funnel">
    <Link to="/ai-opportunity-check">Free AI Opportunity Check</Link>
    <header className="ai-hero"><div><p className="ai-eyebrow">Practical AI Audit</p>
    <h1>A clear plan for where AI can give your organisation time back.</h1>
    <p>Understand which tools fit your work, what they could save and how to get started.</p></div><Emblem slug="ai-audit" /></header>
    {workflow && <p className="ai-context">Your starting point: <strong>{workflow.label}</strong>. We examine how the work happens before recommending a tool.</p>}
    <section className="ai-panel"><h2>C$999 per organisation</h2><p><strong>Including applicable tax.</strong></p><p>Your audit fee is refunded in full if we can't identify tool recommendations with evidence-backed potential to save your organisation at least five net hours a week in total. That is five hours across the organisation, not per employee.</p><p>For a sense of scale, five hours a week could be worth about <strong>$8,000 a year in staff capacity</strong>, based on an illustrative employee cost of $40 an hour over 40 working weeks. That's an estimate of potential capacity, not a guaranteed cash saving, and your own figure will depend on your actual staff costs.</p><p>The guarantee covers identifying the opportunities. You implement the recommendations, and actual results depend on implementation, adoption and workload.</p><p>If you cancel before your discovery session, before any audit work has begun, your fee is refunded in full. See the <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> for how refunds work.</p></section>
    <section className="ai-calc-inline" aria-labelledby="ai-calc-inline-title"><p className="ai-eyebrow">Calculator</p><h2 id="ai-calc-inline-title">What could that time be worth?</h2><p>Adjust the numbers to fit your organisation. Nothing leaves this page.</p><AiCalculator calc={calc} setCalc={setCalc} /></section>
    <section><h2>A focused audit, with clear deliverables.</h2><ul><li>One 60-minute discovery session.</li><li>An organisation-wide opportunity scan.</li><li>One priority workflow redesigned.</li><li>A written report within five business days of discovery and receipt of the information needed for the audit.</li><li>A 30-minute findings call.</li></ul></section>
    <h2>What you take away</h2>
    <div className="ai-inclusions">
      <section><h3>A review of your actual work</h3><p>Recurring tasks, handoffs, current tools and the people doing the work.</p></section>
      <section><h3>A prioritised tool roadmap</h3><p>What to use, why it fits, the alternatives, and where a simpler process or an existing tool is enough.</p></section>
      <section><h3>A time-savings breakdown</h3><p>Baseline, frequency and estimated net savings, including checking, corrections and upkeep. Shared work counts once.</p></section>
      <section><h3>Costs and practical boundaries</h3><p>Software costs, setup effort, which information can safely go into which tool, and the work that needs human review.</p></section>
      <section><h3>One redesigned workflow</h3><p>A map of the current process and an improved sequence, with unnecessary steps removed, recommended tools, responsibilities, human checkpoints and implementation steps.</p></section>
      <section><h3>A findings walkthrough</h3><p>Review the report and calculations together. The plan is yours to keep.</p></section>
    </div>
    <details><summary>Look inside the audit report</summary><p>Illustrative report structure, not a client result.</p><ol><li>Current workflow and evidence</li><li>Recommended tool and alternatives</li><li>Baseline time, expected review time and net savings</li><li>Costs, permissions and setup effort</li><li>One redesigned workflow, implementation steps and success measures</li></ol><p>No savings figure is assigned until the actual work has been assessed.</p></details>
    <h2>How the audit works</h2><ol className="ai-steps"><li>Agree the work covered and review the terms.</li><li>Complete a 60-minute discovery session.</li><li>Receive your report and findings walkthrough.</li><li>Choose and implement your next steps.</li></ol>
    <details><summary>Does the guarantee mean five hours for every employee?</summary><p>No. It is five net hours per week across the organisation in total, from one or several workflows. It does not have to come entirely from the one workflow we redesign.</p></details>
    <details><summary>Is implementation included?</summary><p>No. Your organisation implements the redesigned workflow and the other recommendations, and is responsible for the costs of doing so, including software subscriptions and licences, configuration, integrations, automation builds, training and ongoing support. The audit fee covers the audit only. The report lists the expected software costs and setup effort, so you can budget and decide what is worth doing before you commit to any tool. If you want help with implementation, support focused on AI alone, or AI combined with HR advice, can be quoted separately.</p></details>
    <details><summary>Do I need to buy ongoing support?</summary><p>No. A retainer is not required to keep your report or qualify for the refund.</p></details>
    <section className="ai-panel" aria-label="Discuss your audit"><h2>Talk through your Practical AI Audit</h2><p>Start a conversation with BlueChip to confirm the fit, scope and next steps. An inquiry does not create a booking or take payment.</p><p><a href="https://www.bluechip-people-strategies.com/embedded-hr-retainers#chat">Discuss your Practical AI Audit</a></p><p>If the audit leads into a Practical AI and/or Embedded HR Retainer (six-month minimum), your audit fee is credited against your first invoice.</p></section>
    <p><Link to="/ai-opportunity-check">Start with the free AI Opportunity Check</Link></p>
      <p className="ai-legal"><a href="https://www.bluechip-people-strategies.com/terms">Terms</a> · <a href="https://www.bluechip-people-strategies.com/refund">Refund Policy</a> · <a href="https://www.bluechip-people-strategies.com/privacy">Privacy</a></p>
  </main>;
}
