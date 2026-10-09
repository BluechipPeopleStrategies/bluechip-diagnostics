import { totalHoursRangeLabel, totalHoursSentence } from '../lib/aiOpportunity';
import { useRollingNumber } from '../lib/useRollingNumber';

// Format the two displayed values together so range wording and units remain consistent
// while the team slider animates or a reduced-motion update applies immediately. Whole hours
// only, and the top end never rounds up (see wholeHoursRange). `step` 10 is for yearly totals.
export default function TotalHours({ low, likely, headline = false, step = 1 }) {
  const displayedLow = useRollingNumber(low);
  const displayedLikely = useRollingNumber(likely);
  const text = headline
    ? totalHoursSentence(displayedLow, displayedLikely, { step })
    : totalHoursRangeLabel(displayedLow, displayedLikely, step);
  return <span className="ai-rolling-number">{text}</span>;
}
