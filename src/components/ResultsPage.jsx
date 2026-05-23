import { scoreLikert, matchArchetype } from '../lib/scoring';
import ResultHeadline from './ResultHeadline';
import ResultNarrative from './ResultNarrative';
import DimensionBreakdown from './DimensionBreakdown';
import ArchetypeProfile from './ArchetypeProfile';
import NextMoves from './NextMoves';
import EmailOptIn from './EmailOptIn';
import ClarityCallCTA from './ClarityCallCTA';
import ShareButton from './ShareButton';

export default function ResultsPage({ diagnostic, answers, onRestart, emailSubmitted = false, onEmailSubmitted }) {
  const wantsScore = diagnostic.outputPattern === 'score-and-dimensions' || diagnostic.outputPattern === 'both';
  const wantsArchetype = diagnostic.outputPattern === 'archetype-match' || diagnostic.outputPattern === 'both';

  const scoreResult = wantsScore ? scoreLikert(diagnostic, answers) : null;
  const archetypeResult = wantsArchetype ? matchArchetype(diagnostic, answers) : null;

  // Prefer score-band format when a band exists so downstream (email tier
  // branching, Notion Band Label) gets the richer signal. Archetype-only
  // diagnostics fall back to the archetype id.
  let resultType = 'score';
  let resultLabel = '';
  if (scoreResult?.totalBand) {
    resultLabel = `${scoreResult.totalBand.label} (${scoreResult.total}/100)`;
  } else if (archetypeResult?.archetypeId) {
    resultType = 'archetype';
    resultLabel = archetypeResult.archetypeId;
  } else if (scoreResult) {
    resultLabel = `Score (${scoreResult.total}/100)`;
  }

  const narrativeParas = [];
  if (scoreResult?.totalBand?.narrative) narrativeParas.push(scoreResult.totalBand.narrative);
  if (archetypeResult?.archetype?.summary && !narrativeParas.includes(archetypeResult.archetype.summary)) {
    // Already shown in ArchetypeProfile; don't duplicate.
  }

  let nextMoves = [];
  let weakestDimensionId = null;
  if (scoreResult) {
    const sorted = Object.entries(scoreResult.perDimension).sort(([, a], [, b]) => a - b);
    weakestDimensionId = sorted[0]?.[0] || null;
  }
  if (archetypeResult?.archetype?.nextMoves) {
    nextMoves = archetypeResult.archetype.nextMoves;
  } else if (scoreResult && weakestDimensionId) {
    const weakestBand = scoreResult.dimensionBands[weakestDimensionId];
    if (weakestBand?.nextMoves) nextMoves = weakestBand.nextMoves;
  }

  // Detail surfaced in the result email so it reads like Thomas saw the result.
  // For score-based diagnostics: weakest dimension's human label. For
  // archetype diagnostics: archetype display label.
  let detail = '';
  if (weakestDimensionId && diagnostic.dimensions) {
    const dim = diagnostic.dimensions.find((d) => d.id === weakestDimensionId);
    detail = dim?.label || '';
  } else if (archetypeResult?.archetype) {
    detail = archetypeResult.archetype.label || archetypeResult.archetype.name || '';
  }

  return (
    <main className="bc-page">
      <ResultHeadline scoreResult={scoreResult} archetypeResult={archetypeResult} />

      <hr />

      <EmailOptIn
        diagnosticId={diagnostic.id}
        resultLabel={resultLabel}
        detail={detail}
        onSubmitted={onEmailSubmitted}
        alreadySubmitted={emailSubmitted}
      />

      {emailSubmitted && (
        <>
          <ResultNarrative paragraphs={narrativeParas} />

          {scoreResult && diagnostic.dimensions && (
            <>
              <h2>Dimension <em>breakdown</em></h2>
              <DimensionBreakdown
                dimensions={diagnostic.dimensions}
                perDimension={scoreResult.perDimension}
                dimensionBands={scoreResult.dimensionBands}
              />
            </>
          )}

          {archetypeResult?.archetype && <ArchetypeProfile archetype={archetypeResult.archetype} />}

          <NextMoves moves={nextMoves} />
        </>
      )}

      <hr />

      <ClarityCallCTA
        diagnosticId={diagnostic.id}
        tier={scoreResult?.totalBand?.tier || null}
        total={scoreResult?.total ?? null}
      />

      <ShareButton diagnosticId={diagnostic.id} resultType={resultType} resultLabel={resultLabel} />

      <hr />

      <div className="bc-cta-row">
        <button type="button" className="bc-cta-secondary" onClick={onRestart}>
          Retake the {diagnostic.title}
        </button>
      </div>
    </main>
  );
}
