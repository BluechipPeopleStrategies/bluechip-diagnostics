import { PLAN_FEE, SCALE } from '../lib/pulseDiscovery.js';
import { dollars } from '../lib/planPricing.js';
import './AiPulseDiscovery.css';
export default function PulseScale() {
  const s = SCALE;
  return <section className="pulse-panel pulse-scale" id="pulse-scale" aria-labelledby="pulse-scale-title">
    <p className="pulse-eyebrow">Small gains across your team</p>
    <h2 id="pulse-scale-title">What could your team do with {s.teamHours} hours back each week?</h2>
    <p className="pulse-lead">Imagine finding <strong>{s.hours} net hours a week for {s.people} people on your team.</strong> Those small gains add up across your organization.</p>
    <div className="pulse-equation" role="group" aria-label="Illustrative team hours">
      <div><strong>{s.people}</strong><span>people</span></div><b aria-label="times">×</b><div><strong>{s.hours}</strong><span>net hours each / week</span></div><b aria-label="equals">=</b><div><strong>{s.teamHours}</strong><span>team hours / week</span></div>
    </div>
    <div className="pulse-value"><div><p className="pulse-small">POTENTIAL ANNUAL STAFF-TIME VALUE</p><p className="pulse-amount">{dollars(s.annualValue)}</p><p>{s.annualHours.toLocaleString('en-CA')} hours a year for customers, follow-ups and work that keeps getting pushed back.</p><p className="pulse-small">{s.teamHours} hours × {dollars(s.rate)}/hour × {s.weeks} working weeks.</p></div><div className="pulse-fee"><strong>About {Math.round(s.annualValue / PLAN_FEE)}×</strong><p>the current one-time <b>{dollars(PLAN_FEE)}</b> plan fee in illustrative annual staff-time value.</p><p className="pulse-small">An illustration, not your measured ROI. Software, setup and rollout costs are additional.</p></div></div>
    <p className="pulse-small">Imagine this scenario; it is not a result calculated from your answers, a business average or a client outcome. Staff time freed for other work is not a cash saving. Net time allows for checking the AI&apos;s work and keeping the tools running.</p>
  </section>;
}
