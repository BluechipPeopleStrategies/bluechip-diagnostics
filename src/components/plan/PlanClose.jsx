import { Link } from 'react-router-dom';

// Closing conversation reminder. The free-check link keeps its own quiet row below the card.
export default function PlanClose() {
  return (
    <>
      <section className="ai-panel plan-close" aria-label="Start the conversation">
        <div className="plan-close-copy">
          <h2>Talk through the AI Handoff Plan</h2>
          <p>Start a conversation with BlueChip to confirm the fit, scope and next steps.</p>
        </div>
        <div className="plan-close-art" aria-hidden="true">
          <span className="plan-bubble plan-bubble--in"><i style={{ width: '78%' }} /><i style={{ width: '52%' }} /></span>
          <span className="plan-bubble plan-bubble--out"><i style={{ width: '64%' }} /></span>
          <span className="plan-bubble plan-bubble--in plan-bubble--typing"><b /><b /><b /></span>
        </div>
      </section>
      <p className="plan-free-check">
        <span className="plan-free-check-lead">Not ready to talk yet?</span>
        <Link className="plan-free-check-link" to="/ai-opportunity-check">
          <span>Start with the free AI Pulse</span>
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </p>
    </>
  );
}
