// What people see before the email: one real insight in the open, the rest visibly locked.
// Scored tools: the strongest dimension is shown; the others (including where to start) are blurred.
// Archetype-only tools: the cheat sheet is previewed as locked placeholder lines, not real text.
function unlock() {
  const el = document.getElementById('bc-optin');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.querySelector('input[type=email]')?.focus({ preventScroll: true });
  }
  if (window.parent !== window) window.parent.postMessage({ type: 'bc-diagnostic-scroll', offset: el ? el.offsetTop : 0 }, '*');
}

export default function ResultTeaser({ dimensions, perDimension, cheatCount = 0 }) {
  if (dimensions?.length && perDimension) {
    const sorted = [...dimensions].sort((a, b) => (perDimension[b.id] ?? 0) - (perDimension[a.id] ?? 0));
    const [top, ...rest] = sorted;
    return (
      <section className="bc-teaser" aria-label="Preview of your breakdown">
        <p className="bc-teaser-eyebrow">Your breakdown</p>
        <div className="bc-teaser-open">
          <div className="bc-dim-header">
            <span className="bc-dim-name">{top.label}<em className="bc-dim-flag is-strong">Strongest</em></span>
            <span className="bc-dim-tier"><b>{perDimension[top.id]}</b></span>
          </div>
          <div className="bc-dim-track" aria-hidden="true"><div className="bc-dim-fill" style={{ '--w': `${perDimension[top.id]}%` }} /></div>
        </div>
        <div className="bc-teaser-locked">
          <ul aria-hidden="true">
            {rest.map((d) => (
              <li key={d.id}>
                <span className="bc-dim-name">{d.label}</span>
                <div className="bc-dim-track"><div className="bc-dim-fill" style={{ '--w': `${perDimension[d.id]}%` }} /></div>
              </li>
            ))}
          </ul>
          <div className="bc-teaser-lock">
            <span className="bc-lock" aria-hidden="true" />
            <p><strong>{rest.length} more areas, including where to start.</strong></p>
            <button type="button" className="bc-cta" onClick={unlock}>Unlock the full breakdown</button>
          </div>
        </div>
      </section>
    );
  }
  if (cheatCount > 0) {
    return (
      <section className="bc-teaser" aria-label="Preview of your cheat sheet">
        <p className="bc-teaser-eyebrow">Your cheat sheet</p>
        <div className="bc-teaser-locked">
          <ul aria-hidden="true" className="bc-teaser-lines">
            {Array.from({ length: Math.min(cheatCount, 5) }, (_, i) => <li key={i}><span style={{ width: `${88 - i * 9}%` }} /></li>)}
          </ul>
          <div className="bc-teaser-lock">
            <span className="bc-lock" aria-hidden="true" />
            <p><strong>{cheatCount} moves built around your result.</strong></p>
            <button type="button" className="bc-cta" onClick={unlock}>Unlock my cheat sheet</button>
          </div>
        </div>
      </section>
    );
  }
  return null;
}
