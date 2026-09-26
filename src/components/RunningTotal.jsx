import AreaIcon from './AreaIcon';
import RollingNumber from './RollingNumber';
import { areaHoursLabel, areaWeeklyLabel } from '../lib/aiOpportunity';

// Q2's running total (items 47 + 62, 2026-09-25). The total and its per-area breakdown used to
// be two boxes of different widths with the maths dumped as raw text lines. Now one card: the
// headline figure on top, framed around what the time is for, and each area as a row that reads
// left to right (inputs, the saved share, the result), so the arithmetic is legible at a glance.
export default function RunningTotal({ preview, labelFor }) {
  return (
    <section className="ai-fc-tally" aria-label="Running total">
      <div className="ai-fc-tally-head">
        <span className="ai-fc-tally-kicker" aria-hidden="true">Running total</span>
        <p className="ai-live-preview ai-fc-tally-total">
          About <strong className="ai-fc-tally-figure"><RollingNumber value={preview.low} format={areaHoursLabel} /> to <RollingNumber value={preview.likely} format={areaHoursLabel} /></strong> hours a week{' '}
          <span className="ai-fc-tally-for">back for the work that matters most.</span>
        </p>
      </div>
      <ul className="ai-fc-tally-rows">
        {preview.rows.map(r => {
          const lowPct = Math.round(r.rate.low * 100);
          const likelyPct = Math.round(r.rate.likely * 100);
          // Hours can be fractional once the 30-hour weekly cap scales rows down.
          const hrs = Number.isInteger(r.hours) ? r.hours : Math.round(r.hours * 10) / 10;
          return (
            <li className="ai-fc-tally-row" key={r.area}>
              <span className="ai-fc-tally-area"><AreaIcon area={r.area} className="ai-fc-tally-icon" />{labelFor(r.area)}</span>
              <span className="ai-fc-tally-math">
                <span className="ai-fc-chip">{hrs} {hrs === 1 ? 'hr' : 'hrs'}</span>
                <span className="ai-fc-op" aria-hidden="true">&times;</span>
                <span className="ai-fc-chip">{r.people} {r.people === 1 ? 'person' : 'people'}</span>
                <span className="ai-fc-op" aria-hidden="true">&times;</span>
                <span className="ai-fc-chip ai-fc-chip--rate">{lowPct}% to {likelyPct}% saved</span>
              </span>
              <span className="ai-fc-tally-result"><span className="ai-fc-op" aria-hidden="true">=</span> <strong>{areaWeeklyLabel(r.low, r.likely)}</strong></span>
            </li>
          );
        })}
      </ul>
      <p className="ai-note ai-fc-tally-foot">The percentages are the share of that time AI can realistically save after someone checks its work.</p>
    </section>
  );
}
