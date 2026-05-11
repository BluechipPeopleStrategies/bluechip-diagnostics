export default function QuizHeader({ currentIndex, total, title }) {
  const pct = total === 0 ? 0 : Math.round(((currentIndex + 1) / total) * 100);
  return (
    <div className="bc-quiz-header">
      <p className="bc-quiz-header-eyebrow">
        Question {currentIndex + 1} of {total} — {title}
      </p>
      <div className="bc-progress-track" aria-hidden="true">
        <div className="bc-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
