import { Link } from 'react-router-dom';
import PlanButton from './PlanButton';

// Closing CTA (punch list item 40, 2026-09-25). The flat card + flat gold button read as generic,
// so the card is now a lit glass slab with a gold edge light and a small, slowly floating chat
// composition on the right (it signals what the button opens: a conversation). The free-check
// link below gets its own spacing and a quiet glass row instead of sitting flush under the card.
export default function PlanClose() {
  return (
    <>
      <section className="ai-panel plan-close" aria-label="Start the conversation">
        <div className="plan-close-copy">
          <h2>Talk through The AI Handoff Plan</h2>
          <p>Start a conversation with BlueChip to confirm the fit, scope and next steps. An inquiry does not create a booking or take payment.</p>
          <p className="plan-close-cta"><PlanButton href="#chat?topic=ai-handoff-plan">Start the conversation</PlanButton></p>
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
          <span>Start with the free AI Opportunity Check</span>
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </p>
    </>
  );
}
