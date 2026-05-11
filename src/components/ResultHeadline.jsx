export default function ResultHeadline({ scoreResult, archetypeResult }) {
  return (
    <div className="bc-result-headline">
      {scoreResult && (
        <>
          <div>
            <span className="bc-result-score">{scoreResult.total}</span>
            <span className="bc-result-score-suffix"> / 100</span>
          </div>
          {scoreResult.totalBand && <p className="bc-result-tier-label">{scoreResult.totalBand.label}</p>}
        </>
      )}
      {archetypeResult?.archetype && (
        <>
          {!scoreResult && <p className="bc-result-tier-label">You are</p>}
          <p className="bc-result-archetype-name">{archetypeResult.archetype.name}</p>
        </>
      )}
    </div>
  );
}
