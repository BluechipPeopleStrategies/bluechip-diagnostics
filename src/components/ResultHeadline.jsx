export default function ResultHeadline({ scoreResult, archetypeResult }) {
  return (
    <div className="bc-result-headline">
      {archetypeResult?.archetype && (
        <>
          <p className="bc-result-tier-label">You are</p>
          <p className="bc-result-archetype-name">{archetypeResult.archetype.name}</p>
        </>
      )}
      {scoreResult?.totalBand && (
        <>
          {!archetypeResult?.archetype && <p className="bc-result-tier-label">Your reading</p>}
          <p className="bc-result-band-name">{scoreResult.totalBand.label}</p>
        </>
      )}
    </div>
  );
}
