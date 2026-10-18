import { SCALE } from '../lib/pulseDiscovery.js';
import { dollars } from '../lib/planPricing.js';
import './AiPulseDiscovery.css';
export default function PulseScale() {
  const s = SCALE;
  const fourWeekHours = s.teamHours * 4;
  const fourWeekValue = fourWeekHours * s.rate;
  return <section className="pulse-panel pulse-scale" id="pulse-scale" aria-labelledby="pulse-scale-title">
    <p className="pulse-eyebrow">The time adds up</p>
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
    <p className="pulse-small">Example only, not a result from your answers or a promise. Time value is not cash savings. Hours allow for checking and upkeep.</p>
    <p className="pulse-small">If you choose to implement, extra software or setup costs apply only where needed.</p>
  </section>;
}
