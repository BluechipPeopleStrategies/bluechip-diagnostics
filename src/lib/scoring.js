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
 * @param {Object} diagnostic
 * @param {Object} answers - map of questionId -> selected option value
 * @returns {{archetypeId: string|null, archetype: Object|null, scores: Object}}
 */
export function matchArchetype(diagnostic, answers) {
  const scores = {};
  for (const a of diagnostic.archetypes || []) scores[a.id] = 0;

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

  const order = diagnostic.tiebreakOrder || [];
  let winner = tied[0];
  for (const id of order) {
    if (tied.includes(id)) {
      winner = id;
      break;
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
