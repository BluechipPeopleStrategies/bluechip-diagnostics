import { totalHoursRangeLabel } from '../lib/aiOpportunity';
import { useRollingNumber } from '../lib/useRollingNumber';

// Format the two displayed values together so range wording and units remain consistent
// while the team slider animates or a reduced-motion update applies immediately.
export default function TotalHours({ low, likely, headline = false }) {
  const displayedLow = useRollingNumber(low);
  const displayedLikely = useRollingNumber(likely);
  const label = totalHoursRangeLabel(displayedLow, displayedLikely);
  const unit = label === 'under 1' || label === '1' ? 'hour' : 'hours';
  const text = !headline ? label
    : label === 'under 1' ? 'Under 1 hour a week'
    : `About ${label} ${unit} a week`;
  return <span className="ai-rolling-number">{text}</span>;
}
