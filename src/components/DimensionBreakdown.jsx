export default function DimensionBreakdown({ dimensions, perDimension, dimensionBands }) {
  if (!dimensions || dimensions.length === 0) return null;
  const scores = Object.values(perDimension);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const weakestId = Object.entries(perDimension).find(([, v]) => v === minScore)?.[0];

  return (
    <ul className="bc-dim-list">
      {dimensions.map((dim) => {
        const score = perDimension[dim.id] ?? 0;
        const band = dimensionBands?.[dim.id];
        const isWeakest = dim.id === weakestId;
        return (
          <li key={dim.id} className="bc-dim-row">
            <div className="bc-dim-header">
              <span>
                {dim.label}
                {band ? ` — ${band.tier}` : ''}
              </span>
              <span className="bc-dim-score">{score} / 100</span>
            </div>
            <div className="bc-dim-track">
              <div className={`bc-dim-fill ${isWeakest ? 'is-weakest' : ''}`} style={{ width: `${score}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
