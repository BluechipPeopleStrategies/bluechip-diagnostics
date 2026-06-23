// Result-specific Clarity Call CTA copy (QW2).
//
// Each diagnostic result gets a CTA that continues the value of THAT result instead of
// the generic "whether BlueChip is a fit" pitch. Copy is the Infy-vetted set from
// BlueChip/docs/diagnostics-cta-copy-infy.md: honest influence only, no invented numbers,
// costs framed qualitatively, no em dashes. Draft pending the advisory-panel pass before
// it deploys.
//
// Keys:
//   supervisor-blind-spot, workplace-read -> archetype id
//   dqi, org-pulse                        -> slugified score-band label
//                                            ("Pressure building" -> "pressure-building")
// org-pulse bodies use the {lowest_dimension} token, filled at render from the weakest
// dimension's label (falls back to "your lowest dimension").

export const CTA_COPY = {
  'supervisor-blind-spot': {
    'fire-fighter': {
      headline: 'You are good in a crisis. That is also the trap.',
      body: 'Fire Fighters earn trust by solving the emergency, which means the emergency keeps coming back because nobody builds the prevention muscle. The cost is a team that cannot run without you and a calendar that never clears. In 30 minutes we will map which fires are actually preventable and where to start.',
      button: 'Show me what to stop fighting',
    },
    coach: {
      headline: 'You develop people well. Who is developing the results?',
      body: 'Coaches grow their people, and the blind spot is letting development outrun accountability, so effort gets rewarded even when outcomes slip. The quiet cost is a team that feels supported but misses the number. We will spend 30 minutes finding where care and accountability have drifted apart.',
      button: 'Find the gap between effort and outcome',
    },
    friend: {
      headline: 'Being liked is not the same as being trusted to lead.',
      body: 'Friends build warmth fast, and the blind spot is that warmth can quietly cost you the hard conversation, which is the one your team actually needs from you. Over time the team likes you and stops relying on you. In 30 minutes we will find the conversations you have been routing around.',
      button: 'Help me have the hard conversation',
    },
    operator: {
      headline: 'The machine runs. The people are running on empty.',
      body: 'Operators keep things efficient and on time, and the blind spot is optimizing the process past the point where people feel seen, which is where your best ones quietly start looking. The cost shows up late, as a resignation you did not see coming. We will spend 30 minutes on where efficiency is costing you retention.',
      button: 'Show me the human cost of the system',
    },
    visionary: {
      headline: 'You can see where it is going. Can your team?',
      body: 'Visionaries set direction and energy, and the blind spot is moving so fast that the team never gets the footing to execute, so the vision stays yours and never becomes theirs. The cost is a gap between what you announced and what actually shipped. In 30 minutes we will find where the vision is losing people on the way down.',
      button: 'Help me bring the team with me',
    },
    enforcer: {
      headline: 'Compliance is not the same as commitment.',
      body: 'Enforcers hold the line and set clear standards, and the blind spot is that fear gets you compliance while quietly costing you the discretionary effort, the ideas and the honesty people only give when they are not bracing. The cost is a team that does exactly what is asked and nothing more. We will spend 30 minutes on how to keep the standards and get the commitment back.',
      button: 'Keep the standard, lose the bracing',
    },
    diplomat: {
      headline: 'Keeping the peace can quietly cost you the truth.',
      body: 'Diplomats keep things smooth and relationships intact, and the blind spot is that smoothing over conflict buries the issue instead of resolving it, so the same tension keeps resurfacing in new forms. The cost is decisions that please the room and miss the problem. In 30 minutes we will find the conflict worth having.',
      button: 'Find the conflict worth having',
    },
    builder: {
      headline: 'You build systems. Make sure they outlast you.',
      body: 'Builders create structure and process that scales, and the blind spot is building so much that the system depends on you to keep it running, which is the opposite of what a good system is for. The cost is that nothing you built can run without its builder. We will spend 30 minutes pressure testing what would survive your week off.',
      button: 'Stress test what you have built',
    },
  },

  'workplace-read': {
    'quiet-erosion': {
      headline: 'Nothing is on fire. That is what makes this one hard to catch.',
      body: 'Quiet Erosion does not announce itself. It shows up as good people slowly checking out, effort thinning, and the sense that something is off without a clear cause. The cost is that by the time it is obvious, the best person has usually already decided to leave. In 30 minutes we will name what is eroding and where to put the first repair.',
      button: 'Show me what is quietly slipping',
    },
    'pressure-cooker': {
      headline: 'The team is delivering. They are also close to the edge.',
      body: 'Pressure Cookers run hot and still hit the number, which is exactly why the strain gets ignored until something gives. The cost is usually paid all at once, in a burnout departure or a quality miss at the worst possible moment. We will spend 30 minutes on where to release pressure without losing the output.',
      button: 'Help me let pressure off safely',
    },
    'politics-in-play': {
      headline: 'When the real conversation moves offline, decisions get slower.',
      body: 'This pattern shows up when people read the room before they say what they think, so energy goes into positioning instead of the work. It is rarely anyone\'s fault, it is usually a signal about how safe it feels to be direct. The cost is slower, more cautious decisions and information you stop hearing. In 30 minutes we will find where the candor is getting routed around.',
      button: 'Find where candor is getting lost',
    },
    drift: {
      headline: 'Everyone is busy. Fewer people can say toward what.',
      body: 'Drift is when the work continues but the shared direction has quietly faded, so effort scatters and good people optimize for their own corner. The cost is a lot of motion that does not add up to progress, and it is easy to mistake for productivity. We will spend 30 minutes re-anchoring what the team is actually rowing toward.',
      button: 'Re-anchor where we are headed',
    },
    'healthy-tension': {
      headline: 'You have something most teams do not. The work is keeping it.',
      body: 'Healthy Tension means people push on ideas without it getting personal, which is rare and easy to lose to one bad hire, one reorg, or one quarter of pressure. The call is not about fixing a problem, it is about knowing which two or three things are actually holding this up so you can protect them on purpose. We will spend 30 minutes naming what to guard.',
      button: 'Help me protect what is working',
    },
  },

  dqi: {
    'decision-drag': {
      headline: 'Your decisions are taking longer than they should, and it compounds.',
      body: 'Decision drag is when choices stall, loop back, or quietly get re-litigated, so the same call gets made three times. The cost is not just the slow decision, it is everything downstream that waited on it, and it stacks week over week. In 30 minutes we will find the one or two bottlenecks where most of the drag is coming from.',
      button: 'Find where decisions are stalling',
    },
    'mixed-signal': {
      headline: 'Some decisions are clean. Others keep getting stuck in the same place.',
      body: 'A mixed signal means the process works until it hits a specific kind of decision, and then it reliably bogs down, usually around ownership or unclear thresholds. The cost is unpredictability, you cannot tell which calls will move and which will stall. We will spend 30 minutes pinpointing the pattern behind the stuck ones.',
      button: 'Pinpoint what keeps getting stuck',
    },
    calibrated: {
      headline: 'Your decision-making is a real asset. Most erosion is invisible until it is not.',
      body: 'Calibrated is hard to build and quiet to lose, it usually slips through growth, a few new hires, or one rushed quarter, and you rarely notice until a decision goes sideways. The call is not a fix, it is a 30 minute read on which habits are actually carrying this so you can keep them as the team changes. We will name what to protect.',
      button: 'Help me keep this as we grow',
    },
  },

  'org-pulse': {
    'pressure-building': {
      headline: 'The pressure is showing up in your numbers, starting with {lowest_dimension}.',
      body: 'A score in this range usually means the strain is no longer quiet, and your lowest dimension, {lowest_dimension}, is where it is costing you most right now. The risk is that low scores here tend to pull the others down with them if nothing changes. In 30 minutes we will turn {lowest_dimension} into one concrete move you can make in the next 30 days.',
      button: 'Get my first 30-day move',
    },
    'mixed-signal': {
      headline: 'Most of your org is holding. {lowest_dimension} is the soft spot.',
      body: 'A mixed score usually means the fundamentals are okay but one dimension, {lowest_dimension}, is lagging enough to drag on the rest. Left alone, the soft spot is where problems tend to start. We will spend 30 minutes turning {lowest_dimension} into a single 30-day move, so you fix the weak link before it spreads.',
      button: 'Shore up my weak link',
    },
    healthy: {
      headline: 'Strong overall. {lowest_dimension} is your best place to get even better.',
      body: 'A healthy score is worth protecting, and even here one dimension, {lowest_dimension}, is your relative low point and your clearest upside. The call is not about fixing trouble, it is about a 30 minute plan to lift {lowest_dimension} and lock in what is already working as the team grows. We will leave you with one move for the next 30 days.',
      button: 'Plan my next 30 days',
    },
  },
};

/**
 * Look up result-specific CTA copy. Returns null when there is no entry for the
 * (diagnosticId, resultKey) pair so the caller can fall back to the generic CTA.
 * Fills the {lowest_dimension} token from opts.lowestDimension.
 */
export function getCtaCopy(diagnosticId, resultKey, { lowestDimension } = {}) {
  const byDiagnostic = CTA_COPY[diagnosticId];
  if (!byDiagnostic || !resultKey) return null;
  const entry = byDiagnostic[resultKey];
  if (!entry) return null;
  const fill = (s) =>
    typeof s === 'string'
      ? s.replace(/\{lowest_dimension\}/g, lowestDimension || 'your lowest dimension')
      : s;
  return { headline: fill(entry.headline), body: fill(entry.body), button: entry.button };
}

/** Slugify a score-band label into a CTA_COPY key. "Pressure building" -> "pressure-building". */
export function bandLabelToKey(label) {
  return typeof label === 'string' ? label.trim().toLowerCase().replace(/\s+/g, '-') : '';
}
