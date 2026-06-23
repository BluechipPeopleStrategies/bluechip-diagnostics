// variant controls what shows, so the results page can give the "aha" away free and
// gate the implementation behind the email (QW3):
//   'insight' -> summary + blind spot (the read)
//   'actions' -> the cheat sheet (the what-to-do)
//   'full'    -> both (default, back-compatible)
export default function ArchetypeProfile({ archetype, variant = 'full' }) {
  if (!archetype) return null;

  const showInsight = variant === 'full' || variant === 'insight';
  const showActions = variant === 'full' || variant === 'actions';

  const hasInsight = showInsight && (archetype.summary || archetype.blindSpot);
  const hasActions =
    showActions && Array.isArray(archetype.cheatCode) && archetype.cheatCode.length > 0;

  if (!hasInsight && !hasActions) return null;

  return (
    <section className="bc-archetype-card">
      {hasInsight && archetype.summary && <p className="bc-archetype-summary">{archetype.summary}</p>}
      {hasInsight && archetype.blindSpot && (
        <p className="bc-archetype-blind-spot">{archetype.blindSpot}</p>
      )}
      {hasActions && (
        <ol className="bc-cheat-list">
          {archetype.cheatCode.map((move, i) => (
            <li key={i}>{move}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
