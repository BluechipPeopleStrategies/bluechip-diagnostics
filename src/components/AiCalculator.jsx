import { estimateCapacity, teamHours } from '../lib/aiOpportunity';

export const money = (n) => 'C$' + Math.round(n).toLocaleString('en-CA');
const num = (n) => Math.round(n).toLocaleString('en-CA');

// Inputs + result for the staff-capacity illustration. State lives with the caller.
export default function AiCalculator({ calc, setCalc }) {
  const value = estimateCapacity(calc);
  const weekly = teamHours(calc);
  const yearly = weekly * (Number(calc.weeks) || 0);
  function setField(key, raw, min, max) {
    const n = Number(raw);
    setCalc(c => ({ ...c, [key]: Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : c[key] }));
  }
  return <>
    <div className="ai-calc-grid">
      <label>Hours a week one person could get back
        <input type="number" inputMode="decimal" min="0.5" max="40" step="0.5" value={calc.hours} onChange={(e) => setField('hours', e.target.value, 0.5, 40)} />
      </label>
      <label>How many people on your team would say the same, or more?
        <input type="number" inputMode="numeric" min="1" max="1000" value={calc.people ?? 1} onChange={(e) => setField('people', e.target.value, 1, 1000)} />
      </label>
      <label>Employee cost per hour (C$)
        <input type="number" inputMode="decimal" min="15" max="250" value={calc.rate} onChange={(e) => setField('rate', e.target.value, 15, 250)} />
      </label>
      <label>Working weeks a year
        <input type="number" inputMode="numeric" min="20" max="52" value={calc.weeks} onChange={(e) => setField('weeks', e.target.value, 20, 52)} />
      </label>
    </div>
    <p className="ai-calc-result" aria-live="polite"><span>Potential staff capacity:</span><strong>{money(value)}</strong><span>a year</span></p>
    <p className="ai-calc-hours">That's <b>{num(weekly)} hours a week</b> across your team, or <b>{num(yearly)} hours a year</b>.</p>
    <p className="ai-note">An illustration based on your numbers, not a savings estimate or a guaranteed cash saving. The plan's guarantee is five net hours a week in total across your organization, not per person. The AI Handoff Plan looks at your actual work to find out what is real.</p>
  </>;
}
