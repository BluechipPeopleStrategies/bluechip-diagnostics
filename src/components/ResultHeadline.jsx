import Emblem from './Emblem';
import ScoreDial from './ScoreDial';

export default function ResultHeadline({ scoreResult, archetypeResult, diagnostic }) {
  const archetype = archetypeResult?.archetype;
  const band = scoreResult?.totalBand;
  const tier = band?.tier ? band.tier.charAt(0).toUpperCase() + band.tier.slice(1) : '';
  return (
    <section className="bc-result-hero">
      <div className="bc-result-hero-copy">
        <p className="bc-result-tier-label">Your reading{diagnostic ? `: ${diagnostic.title.replace(/^The /, '')}` : ''}</p>
        {archetype && (
          <>
            <p className="bc-result-kicker">You are</p>
            <h1 className="bc-result-title">{archetype.name}</h1>
          </>
        )}
        {band && !archetype && <h1 className="bc-result-title">{band.label}</h1>}
        {band && archetype && <p className="bc-result-chip">{band.label}</p>}
        {scoreResult && (
          <div className="bc-result-score-row">
            <ScoreDial value={scoreResult.total} />
            {tier && <p className="bc-result-tier"><span>Overall</span>{tier}</p>}
          </div>
        )}
      </div>
      {diagnostic && <Emblem slug={diagnostic.id} className="bc-result-hero-art" />}
    </section>
  );
}
