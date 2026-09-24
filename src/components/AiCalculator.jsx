import { estimateCapacity } from '../lib/aiOpportunity';

export const money = (n) => 'C$' + Math.round(n).toLocaleString('en-CA');

// Inputs + result for the staff-capacity illustration. State lives with the caller.
export default function AiCalculator({ calc, setCalc }) {
  const value = estimateCapacity(calc);
  function setField(key, raw, min, max) {
    const n = Number(raw);
    setCalc(c => ({ ...c, [key]: Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : c[key] }));
  }
  return <>
    <div className="ai-calc-grid">
      <label>Hours a week that could be freed up
        <input type="number" inputMode="decimal" min="1" max="60" value={calc.hours} onChange={(e) => setField('hours', e.target.value, 1, 60)} />
      </label>
      <label>Employee cost per hour (C$)
        <input type="number" inputMode="decimal" min="15" max="250" value={calc.rate} onChange={(e) => setField('rate', e.target.value, 15, 250)} />
      </label>
      <label>Working weeks a year
        <input type="number" inputMode="numeric" min="20" max="52" value={calc.weeks} onChange={(e) => setField('weeks', e.target.value, 20, 52)} />
      </label>
    </div>
    <p className="ai-calc-result" aria-live="polite"><span>Potential staff capacity</span><strong>{money(value)}</strong><span>a year</span></p>
    <p className="ai-note">An illustration based on your numbers, not a savings estimate or a guaranteed cash saving. The Practical AI Audit looks at your actual work to find out what is real.</p>
  </>;
}
