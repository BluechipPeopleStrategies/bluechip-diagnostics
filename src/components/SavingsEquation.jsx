// Hours and value first, price second (Thomas, 2026-09-23: "highlight the amount saved and the hours").
// Same illustration as the guarantee copy: C$40 an hour, 5 net hours a week, 40 working weeks.
export default function SavingsEquation() {
  return (
    <section className="ai-save" aria-labelledby="ai-save-title">
      <p className="ai-eyebrow" id="ai-save-title">What five hours a week is worth</p>
      <div className="ai-eq" role="img" aria-label="5 net hours a week times 40 working weeks equals 200 hours a year; at C$40 an hour that is about C$8,000 a year in potential staff capacity.">
        <div className="ai-term ai-hrs"><strong>5</strong><span>net hours a week</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>40</strong><span>working weeks</span></div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-hrs"><strong>200</strong><span>hours a year</span></div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term"><strong>C$40</strong><span>employee cost an hour</span></div>
        <div className="ai-op" aria-hidden="true">&asymp;</div>
        <div className="ai-term ai-total"><strong>C$8,000</strong><span>a year in potential staff capacity</span></div>
      </div>
      <div className="ai-save-fee">
        <span className="ai-fee">C$999</span>
        <p><strong>If the audit can't find at least five net hours a week, your fee comes back.</strong> Five hours across the whole organisation, not per employee, net of the time spent checking the tools' work.</p>
      </div>
      <p className="ai-note">An illustration of the value of time, not a guaranteed cash saving. Your own figure depends on your actual staff costs. Try your numbers in the calculator below.</p>
    </section>
  );
}
