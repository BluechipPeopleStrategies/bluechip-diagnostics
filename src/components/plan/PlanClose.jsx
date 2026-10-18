import { Link } from 'react-router-dom';
import PlanButton from './PlanButton';

// A direct contact action, followed by the separate free-check link.
export default function PlanClose({ chatTopic = 'ai-handoff-plan' }) {
  return (
    <>
      <section className="ai-panel plan-close" aria-label="Start the conversation">
        <div className="plan-close-copy">
          <h2>Not sure whether the AI Handoff Plan is right for your team?</h2>
          <p>Tell us what you'd like to improve. We will help you decide whether it makes sense before you book.</p>
          <p className="plan-close-cta"><PlanButton href={`#chat?topic=${chatTopic}`}>Ask us about your work</PlanButton></p>
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
