import { SCALE } from '../lib/pulseDiscovery.js';
import { dollars } from '../lib/planPricing.js';
import './AiPulseDiscovery.css';
export default function PulseScale() {
  const s = SCALE;
  const fourWeekHours = s.teamHours * 4;
  const fourWeekValue = fourWeekHours * s.rate;
  return <section className="pulse-panel pulse-scale" id="pulse-scale" aria-labelledby="pulse-scale-title">
    <p className="pulse-eyebrow">Imagine a small weekly gain</p>
    <h2 id="pulse-scale-title">Repetitive work can keep pushing your team&apos;s priorities back.</h2>
    <p className="pulse-lead">What if <strong>{s.people} people could each reclaim {s.hours} net hours a week</strong> for higher-value work?</p>
    <div className="pulse-equation" role="group" aria-label="Illustrative team hours">
      <div><strong>{s.people}</strong><span>people</span></div><b aria-label="times">×</b><div><strong>{s.hours}</strong><span>net hours each / week</span></div><b aria-label="equals">=</b><div><strong>{s.teamHours}</strong><span>team hours / week</span></div>
    </div>
    <div className="pulse-value">
      <div>
        <p className="pulse-small">ANNUAL STAFF-TIME VALUE IN THIS ILLUSTRATION</p>
        <p className="pulse-amount">{dollars(s.annualValue)}</p>
        <p><strong>{s.annualHours.toLocaleString('en-CA')} team hours a year.</strong> What else could your team do with that time?</p>
        <p className="pulse-small">{s.teamHours} hours × {dollars(s.rate)}/hour × {s.weeks} working weeks.</p>
      </div>
      <div className="pulse-fee">
        <p className="pulse-small">THE NEXT FOUR WEEKS</p>
        <strong>{fourWeekHours} team hours</strong>
        <p>In the same illustration, four more weeks of that work represents <b>{dollars(fourWeekValue)}</b> in staff-time value.</p>
        <p className="pulse-small">Time your team could redirect if those hours can be recovered.</p>
      </div>
    </div>
    <p className="pulse-small">This illustration is not a result calculated from your answers, a business average or a client outcome. It is not your measured loss or ROI. Staff time freed for other work is not a cash saving. Net time allows for checking the AI&apos;s work and keeping the tools running.</p>
    <p className="pulse-small">Software and implementation beyond the included first step cost extra.</p>
  </section>;
}
