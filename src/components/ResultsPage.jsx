import { scoreLikert, matchArchetype } from '../lib/scoring';
import { bandLabelToKey } from '../data/ctaCopy';
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
  let weakestDimensionLabel = '';
  if (weakestDimensionId && diagnostic.dimensions) {
    const dim = diagnostic.dimensions.find((d) => d.id === weakestDimensionId);
    weakestDimensionLabel = dim?.label || '';
    detail = weakestDimensionLabel;
  } else if (archetypeResult?.archetype) {
    detail = archetypeResult.archetype.label || archetypeResult.archetype.name || '';
  }

  // Result-specific Clarity Call copy (QW2): scored tools key by band label,
  // archetype tools key by archetype id. lowestDimension fills the {lowest_dimension}
  // token in the Org Pulse CTAs.
  const resultKey = scoreResult?.totalBand
    ? bandLabelToKey(scoreResult.totalBand.label)
    : archetypeResult?.archetypeId || null;

  return (
    <main className="bc-page">
      <ResultHeadline scoreResult={scoreResult} archetypeResult={archetypeResult} />

      <hr />

      {/* Free teaser: give the insight away (the read), gate the implementation (QW3). */}
      {archetypeResult?.archetype ? (
        <ArchetypeProfile archetype={archetypeResult.archetype} variant="insight" />
      ) : (
        scoreResult?.totalBand?.narrative && (
          <ResultNarrative paragraphs={[scoreResult.totalBand.narrative]} />
        )
      )}

      <EmailOptIn
        diagnosticId={diagnostic.id}
        resultLabel={resultLabel}
        detail={detail}
        onSubmitted={onEmailSubmitted}
        alreadySubmitted={emailSubmitted}
      />

      {emailSubmitted && (
        <>
          {/* 'both' diagnostics showed the archetype insight as the free teaser, so the
              score-band narrative belongs here in the gated breakdown. */}
          {archetypeResult?.archetype && scoreResult?.totalBand?.narrative && (
            <ResultNarrative paragraphs={[scoreResult.totalBand.narrative]} />
          )}

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

          {archetypeResult?.archetype && (
            <ArchetypeProfile archetype={archetypeResult.archetype} variant="actions" />
          )}

          <NextMoves moves={nextMoves} />
        </>
      )}

      <hr />

      <ClarityCallCTA
        diagnosticId={diagnostic.id}
        tier={scoreResult?.totalBand?.tier || null}
        total={scoreResult?.total ?? null}
        resultKey={resultKey}
        lowestDimension={weakestDimensionLabel || null}
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
