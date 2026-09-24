import { AREA_LABELS, computeRange, peopleCapForOrgSize, HOUR_CAP_PER_AREA, HOUR_CAP_TOTAL, money, lowerFirst } from '../lib/aiOpportunity';
import HoursRangeTrack from './HoursRangeTrack';

// One card per area picked (up to four), sliders and number inputs side by side, with a live
// range bar. Nothing here leaves the page (no field is submitted until the visitor asks).
export default function AiRangeCalculator({ rows, setRows, orgSize, rate, weeks, onRate, onWeeks, onShowResult, onSkip }) {
  const peopleCap = peopleCapForOrgSize(orgSize);
  const { low, likely, capped } = computeRange(rows, orgSize);

  function updateRow(area, key, raw, min, max) {
    const n = Number(raw);
    setRows(prev => prev.map(r => r.area === area
      ? { ...r, [key]: Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : r[key] }
      : r));
  }

  return (
    <section className="ai-calc-inline ai-panel--focal" aria-labelledby="ai-range-calc-title">
      <p className="ai-eyebrow">Before your result</p>
      <h2 id="ai-range-calc-title">How much time goes into this work now?</h2>
      <p>One row for each area you picked. Count each hour only once, even if the work overlaps. Nothing leaves this page.</p>

      <div className="ai-range-rows">
        {rows.map(row => (
          <div className="ai-range-row" key={row.area}>
            <h3>{AREA_LABELS[row.area]}</h3>
            <div className="ai-calc-grid">
              <label>Hours a week, one person
                <span className="ai-note">Think of someone who does a lot of it. A rough guess is fine.</span>
                <span className="ai-range-inputs">
                  <input type="range" min="0" max={HOUR_CAP_PER_AREA} step="0.5" value={row.hours}
                    onChange={(e) => updateRow(row.area, 'hours', e.target.value, 0, HOUR_CAP_PER_AREA)}
                    aria-label={`Hours a week, one person, for ${lowerFirst(AREA_LABELS[row.area])}`} />
                  <input type="number" inputMode="decimal" min="0" max={HOUR_CAP_PER_AREA} step="0.5" value={row.hours}
                    onChange={(e) => updateRow(row.area, 'hours', e.target.value, 0, HOUR_CAP_PER_AREA)} />
                </span>
              </label>
              <label>People who spend about that much or more
                <input type="number" inputMode="numeric" min="1" max={peopleCap} value={row.people}
                  onChange={(e) => updateRow(row.area, 'people', e.target.value, 1, peopleCap)} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {capped && <p className="ai-note ai-cap-message">We cap each person at {HOUR_CAP_PER_AREA} hours a week per area and {HOUR_CAP_TOTAL} in total, and people at your team size from question 8, to keep the estimate realistic.</p>}

      <HoursRangeTrack low={low} likely={likely} size="sm" />

      <div className="ai-calc-grid ai-calc-grid--rate">
        <label>Employee cost per hour (C$)
          <input type="number" inputMode="decimal" min="15" max="250" value={rate} onChange={(e) => onRate(e.target.value)} />
        </label>
        <label>Working weeks a year
          <input type="number" inputMode="numeric" min="20" max="52" value={weeks} onChange={(e) => onWeeks(e.target.value)} />
        </label>
      </div>
      <p className="ai-calc-result" aria-live="polite">
        <span>Potential staff capacity:</span>
        <strong>{money(low * rate * weeks)} to {money(likely * rate * weeks)}</strong>
        <span>a year</span>
      </p>

      <div className="ai-modal-actions">
        <button className="ai-button" type="button" onClick={onShowResult}>Show my result</button>
        <button className="ai-secondary" type="button" onClick={onSkip}>Skip</button>
      </div>
    </section>
  );
}
