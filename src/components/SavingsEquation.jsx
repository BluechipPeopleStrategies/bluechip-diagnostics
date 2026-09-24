// Hours and value first, price second (Thomas, 2026-09-23: "highlight the amount saved and the hours").
// Same illustration as the guarantee copy: C$40 an hour, 5 net hours a week, 48 working weeks (a year less about four weeks of vacation and stat holidays).
export default function SavingsEquation() {
  return (
    <section className="ai-save" aria-labelledby="ai-save-title">
      <p className="ai-eyebrow" id="ai-save-title">What five hours a week adds up to</p>
      <div className="ai-eq" role="img" aria-label="5 net hours a week times 48 working weeks equals 240 hours a year; at C$40 an hour that is C$9,600 a year in potential staff capacity.">
        <div className="ai-term ai-hrs"><strong>5</strong><span>net hours a week</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>48</strong><span>working weeks</span></div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-hrs"><strong>240</strong><span>hours a year</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>C$40</strong><span>an hour in staff cost</span></div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-total"><strong>C$9,600</strong><span>a year in potential staff capacity</span></div>
      </div>
      <div className="ai-save-fee">
        <span className="ai-fee">C$999<small>including applicable tax</small></span>
        <p><strong>If the audit can't recommend tools with evidence-backed potential to save at least five net hours a week, you get your full fee back.</strong> That's five hours across your whole organisation, not per employee, and it's counted after the time your team spends checking the tools' work.</p>
      </div>
      <p className="ai-note">This is an illustration of what that time is worth, not a guaranteed cash saving, and your own figure will depend on your actual staff costs. You'd implement the recommendations and cover any implementation costs. Try your own numbers in the calculator below.</p>
    </section>
  );
}
