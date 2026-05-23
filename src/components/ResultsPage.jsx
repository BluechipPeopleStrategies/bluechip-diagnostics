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

  let resultType = 'score';
  let resultLabel = '';
  if (archetypeResult?.archetypeId) {
    resultType = 'archetype';
    resultLabel = archetypeResult.archetypeId;
  } else if (scoreResult) {
    resultLabel = `${scoreResult.totalBand?.label || 'Score'} (${scoreResult.total}/100)`;
  }

  const narrativeParas = [];
  if (scoreResult?.totalBand?.narrative) narrativeParas.push(scoreResult.totalBand.narrative);
  if (archetypeResult?.archetype?.summary && !narrativeParas.includes(archetypeResult.archetype.summary)) {
    // Already shown in ArchetypeProfile; don't duplicate.
  }

  let nextMoves = [];
  if (archetypeResult?.archetype?.nextMoves) {
    nextMoves = archetypeResult.archetype.nextMoves;
  } else if (scoreResult) {
    const sorted = Object.entries(scoreResult.perDimension).sort(([, a], [, b]) => a - b);
    const weakestId = sorted[0]?.[0];
    const weakestBand = weakestId ? scoreResult.dimensionBands[weakestId] : null;
    if (weakestBand?.nextMoves) nextMoves = weakestBand.nextMoves;
  }

  return (
    <main className="bc-page">
      <ResultHeadline scoreResult={scoreResult} archetypeResult={archetypeResult} />
      <ResultNarrative paragraphs={narrativeParas} />

      <hr />

      <EmailOptIn
        diagnosticId={diagnostic.id}
        resultLabel={resultLabel}
        onSubmitted={onEmailSubmitted}
        alreadySubmitted={emailSubmitted}
      />

      {emailSubmitted && (
        <>
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
