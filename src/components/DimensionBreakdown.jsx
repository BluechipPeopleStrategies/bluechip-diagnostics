export default function DimensionBreakdown({ dimensions, perDimension, dimensionBands }) {
  if (!dimensions || dimensions.length === 0) return null;

  // Identify the lowest dimension so it can be visually flagged
  const scores = Object.values(perDimension);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const weakestId = Object.entries(perDimension).find(([, v]) => v === minScore)?.[0];

  function tierLabel(band) {
    if (!band) return '';
    const tier = (band.tier || '').toString();
    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '';
  }

  return (
    <ul className="bc-dim-list">
      {dimensions.map((dim, i) => {
        const score = perDimension[dim.id] ?? 0;
        const band = dimensionBands?.[dim.id];
        const isWeakest = dim.id === weakestId;
        return (
          <li key={dim.id} className={`bc-dim-row ${isWeakest ? 'is-weakest' : ''}`} style={{ '--i': i }}>
            <div className="bc-dim-header">
              <span className="bc-dim-name">{dim.label}{isWeakest && <em className="bc-dim-flag">Start here</em>}</span>
              <span className={`bc-dim-tier ${isWeakest ? 'is-weakest' : ''}`}>{tierLabel(band)} <b>{score}</b></span>
            </div>
            <div className="bc-dim-track" aria-hidden="true">
              <div className={`bc-dim-fill ${isWeakest ? 'is-weakest' : ''}`} style={{ '--w': `${score}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
