// The plan page's primary CTA (punch list item 40, 2026-09-25): a machined-gold face with a
// navy "chip" that carries the arrow, a light sweep on hover/focus, and real press feedback.
// Keeps the .ai-button class so existing tests and the chat hook (#chat?topic=) still apply;
// the arrow chip is aria-hidden, so the accessible name is just the label.
export default function PlanButton({ href, children, className = '' }) {
  return (
    <a className={`ai-button plan-btn ${className}`.trim()} href={href}>
      <span className="plan-btn-label">{children}</span>
      <span className="plan-btn-chip" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="16" height="16" focusable="false">
          <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}
