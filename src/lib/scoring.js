/**
 * Score a Likert-style diagnostic.
 * @param {Object} diagnostic - the diagnostic JSON
 * @param {Object} answers - map of questionId -> Likert value (1-5)
 * @returns {{total: number, perDimension: Object, totalBand: Object|null, dimensionBands: Object}}
 */
export function scoreLikert(diagnostic, answers) {
  const perDimensionRaw = {};
  const perDimensionCount = {};

  for (const q of diagnostic.questions || []) {
    if (q.type !== 'likert-5') continue;
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const value = q.reverseScored ? (6 - raw) : raw;
    perDimensionRaw[q.dimension] = (perDimensionRaw[q.dimension] || 0) + value;
    perDimensionCount[q.dimension] = (perDimensionCount[q.dimension] || 0) + 1;
  }

  const perDimension = {};
  for (const dim of diagnostic.dimensions || []) {
    const count = perDimensionCount[dim.id] || 0;
    if (count === 0) {
      perDimension[dim.id] = 0;
      continue;
    }
    const avg = perDimensionRaw[dim.id] / count; // 1..5
    perDimension[dim.id] = Math.round(((avg - 1) / 4) * 100);
  }

  const dimensionValues = Object.values(perDimension);
  const total = dimensionValues.length
    ? Math.round(dimensionValues.reduce((s, v) => s + v, 0) / dimensionValues.length)
    : 0;

  const totalBand = applyScoreBand(diagnostic.scoring?.totalBands || [], total);
  const dimensionBands = {};
  for (const dim of diagnostic.dimensions || []) {
    dimensionBands[dim.id] = applyScoreBand(dim.scoreBands || [], perDimension[dim.id]);
  }

  return { total, perDimension, totalBand, dimensionBands };
}

/**
 * Match answers to an archetype using weighted scoring.
 *
 * Optional rules, declared on the diagnostic as `archetypeRules` (used by the Decision Quality
 * Index, whose "Calibrated decider" archetype has no answer option of its own):
 *   scoreBandOverride { band, archetype }: when the Likert score lands in that total band, that
 *     archetype wins outright, so a 100/100 result is never labelled with a decision trap.
 *   tieBreakQuestion: when two or more archetypes tie on top, the one the person's answer to this
 *     question points at wins, before the fixed tiebreakOrder is consulted.
 * @param {Object} diagnostic
 * @param {Object} answers - map of questionId -> selected option value
 * @param {Object|null} [scoreResult] - the scoreLikert() result, for diagnostics with a score
 * @returns {{archetypeId: string|null, archetype: Object|null, scores: Object}}
 */
export function matchArchetype(diagnostic, answers, scoreResult = null) {
  const scores = {};
  for (const a of diagnostic.archetypes || []) scores[a.id] = 0;

  const rules = diagnostic.archetypeRules || {};
  const override = rules.scoreBandOverride;
  if (override && scoreResult?.totalBand?.label === override.band) {
    const archetype = (diagnostic.archetypes || []).find((a) => a.id === override.archetype) || null;
    if (archetype) return { archetypeId: archetype.id, archetype, scores };
  }

  for (const q of diagnostic.questions || []) {
    if (q.type !== 'multiple-choice') continue;
    const selectedValue = answers[q.id];
    const opt = q.options?.find((o) => o.value === selectedValue);
    if (!opt) continue;
    for (const [archetypeId, weight] of Object.entries(opt.weights || {})) {
      scores[archetypeId] = (scores[archetypeId] || 0) + weight;
    }
  }

  const archetypeIds = Object.keys(scores);
  if (archetypeIds.length === 0) {
    return { archetypeId: null, archetype: null, scores };
  }

  const maxScore = Math.max(...Object.values(scores));
  const tied = archetypeIds.filter((id) => scores[id] === maxScore);

  let winner = tied[0];
  const tieQuestion = rules.tieBreakQuestion
    ? (diagnostic.questions || []).find((q) => q.id === rules.tieBreakQuestion)
    : null;
  const tieOption = tieQuestion?.options?.find((o) => o.value === answers[tieQuestion.id]);
  const byQuestion = tied.length > 1 && tieOption ? tied.find((id) => (tieOption.weights?.[id] || 0) > 0) : null;
  if (byQuestion) {
    winner = byQuestion;
  } else {
    for (const id of diagnostic.tiebreakOrder || []) {
      if (tied.includes(id)) {
        winner = id;
        break;
      }
    }
  }

  const archetype = diagnostic.archetypes.find((a) => a.id === winner) || null;
  return { archetypeId: winner, archetype, scores };
}

/**
 * Apply the score band for a given numeric score.
 * Lower bound inclusive, upper bound exclusive (except for the last band, which is inclusive on both).
 * @param {Array<{min: number, max: number}>} bands
 * @param {number} score
 * @returns {Object|null}
 */
export function applyScoreBand(bands, score) {
  if (typeof score !== 'number' || score < 0 || score > 100) return null;
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const isLast = i === bands.length - 1;
    const upperOk = isLast ? score <= b.max : score < b.max;
    if (score >= b.min && upperOk) return b;
  }
  return null;
}
