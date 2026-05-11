export default function NavControls({ onBack, onRestart, canGoBack }) {
  return (
    <div className="bc-nav-controls">
      <button type="button" className="bc-nav-link" onClick={onBack} disabled={!canGoBack}>
        ← Back
      </button>
      <button type="button" className="bc-nav-link" onClick={onRestart}>
        Start over
      </button>
    </div>
  );
}
