import { useState } from 'react';
import GoldSlider from './GoldSlider';
import ChipsRow from './ChipsRow';
import RollingNumber from './RollingNumber';
import { teamHours, estimateCapacity, formatHours, money, roundDollars, GUARANTEE_NET_HOURS, ILLUSTRATION_RATE, ILLUSTRATION_WEEKS } from '../lib/aiOpportunity';

// The guarantee illustration, derived from the one guarantee constant so the figures can't drift:
// 3 net hours x 48 weeks = 144 hours a year, x C$40 = C$5,760.
const G_HOURS = GUARANTEE_NET_HOURS;
const G_YEAR_HOURS = G_HOURS * ILLUSTRATION_WEEKS;
const G_YEAR_VALUE = money(G_YEAR_HOURS * ILLUSTRATION_RATE);

const HEADCOUNT_CHIPS = [10, 25, 50, 100, 250].map(n => ({ label: String(n), value: n }));

// Hours and value first, price second (Thomas, 2026-09-23: "highlight the amount saved and the hours").
// The 3-hour equation is the guarantee illustration and never changes with headcount (the
// guarantee is 3 hours across the WHOLE organization, not per person -- multiplying it by
// headcount would misstate it). "Across your team" below is a separate, clearly distinct
// illustration: the one interactive team calculator on this page (2026-09-24: replaces both the
// old standalone "What could that time be worth?" calculator and the first draft of this row,
// merged into one card so there is only one calculator on the page).
export default function SavingsEquation({ defaultPerPersonHours = 1, defaultEmployees = 25 }) {
  const [hours, setHours] = useState(defaultPerPersonHours);
  const [employees, setEmployees] = useState(defaultEmployees);
  const [rate, setRate] = useState(40);
  const [weeks, setWeeks] = useState(48);

  const weekly = teamHours({ hours, people: employees });
  const yearly = weekly * weeks;
  const value = estimateCapacity({ hours, rate, weeks, people: employees });

  return (
    <section className="ai-save" aria-labelledby="ai-save-title">
      <p className="ai-eyebrow" id="ai-save-title">What three hours a week adds up to</p>
      <div className="ai-eq" role="img" aria-label={`${G_HOURS} net hours a week times ${ILLUSTRATION_WEEKS} working weeks equals ${G_YEAR_HOURS} hours a year; at ${money(ILLUSTRATION_RATE)} an hour that is ${G_YEAR_VALUE} a year in potential staff capacity.`}>
        <div className="ai-term ai-hrs"><strong>{G_HOURS}</strong><span>net hours a week</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>{ILLUSTRATION_WEEKS}</strong><span>working weeks</span></div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-hrs"><strong>{G_YEAR_HOURS}</strong><span>hours a year</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>{money(ILLUSTRATION_RATE)}</strong><span>an hour in staff cost</span></div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-total"><strong>{G_YEAR_VALUE}</strong><span>a year in potential staff capacity</span></div>
      </div>
      <div className="ai-save-fee">
        <span className="ai-fee">C$999<small>including applicable tax</small></span>
        <p><strong>If the plan can't recommend tools with evidence-backed potential to save at least three net hours a week, you get your full fee back.</strong> That's three hours across your whole organization, not per employee, and it's counted after the time your team spends checking the tools' work.</p>
      </div>

      <hr className="ai-save-divider" />

      <p className="ai-eyebrow">Across your team</p>
      <h3>What could that time be worth for your organization?</h3>
      <p className="ai-note">An illustration of your team's time, not a guarantee or a cash saving. The plan's guarantee is 3 net hours a week found across your whole organization.</p>

      <div className="ai-team-calc-grid">
        <div>
          <label className="ai-hours-field-label" htmlFor="team-hours">Hours a week, one person</label>
          <GoldSlider id="team-hours" min={0.5} max={10} step={0.5} value={hours} onChange={setHours}
            ariaLabel="Hours a week, one person" format={formatHours}
            tooltip="The UK government's 2025 Copilot trial found about 26 minutes a day on average. We start lower, at 1 hour a week." />
        </div>
        <div>
          <span className="ai-hours-field-label">Employees</span>
          <GoldSlider min={1} max={500} step={1} value={employees} onChange={setEmployees}
            ariaLabel="Employees" format={(n) => `${n} people`} />
          <ChipsRow chips={HEADCOUNT_CHIPS} current={employees} onPick={setEmployees} ariaLabel="Quick-pick employees" />
        </div>
      </div>

      <div className="ai-compact-fields-row">
        <label className="ai-compact-field">
          <span>Employee cost</span>
          <span className="ai-compact-field-input">
            <span className="ai-compact-unit">C$</span>
            <input type="number" inputMode="decimal" min={15} max={250} value={rate}
              onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setRate(Math.min(250, Math.max(15, n))); }} />
            <span className="ai-compact-unit">/hr</span>
          </span>
        </label>
        <label className="ai-compact-field">
          <span>Working weeks</span>
          <span className="ai-compact-field-input">
            <input type="number" inputMode="numeric" min={20} max={52} value={weeks}
              onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setWeeks(Math.min(52, Math.max(20, n))); }} />
            <span className="ai-compact-unit">weeks</span>
          </span>
        </label>
      </div>

      <p className="ai-capacity-box">
        <strong><RollingNumber value={value} format={(n) => money(roundDollars(n))} /></strong>
        <span>a year in potential staff capacity</span>
      </p>
      <p className="ai-calc-hours">
        That's <b><RollingNumber value={weekly} format={formatHours} /> a week</b> across your team, or <b><RollingNumber value={yearly} format={formatHours} /> a year</b>.
      </p>
      <p className="ai-note">This is an illustration based on your numbers, not a savings estimate or a guaranteed cash saving. Your team implements the recommendations and covers any implementation costs.</p>
    </section>
  );
}
