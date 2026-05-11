export default function ArchetypeProfile({ archetype }) {
  if (!archetype) return null;
  return (
    <section className="bc-archetype-card">
      {archetype.summary && <p className="bc-archetype-summary">{archetype.summary}</p>}
      {archetype.blindSpot && <p className="bc-archetype-blind-spot">{archetype.blindSpot}</p>}
      {Array.isArray(archetype.cheatCode) && archetype.cheatCode.length > 0 && (
        <ol className="bc-cheat-list">
          {archetype.cheatCode.map((move, i) => (
            <li key={i}>{move}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
