import { useRollingNumber } from '../lib/useRollingNumber';

// Renders a formatted, animated number: every time `value` changes, the displayed figure tweens
// from its previous value instead of jumping. Tabular numerals keep the width from jittering as
// digits change. See useRollingNumber for the reduced-motion and retarget-mid-animation handling.
export default function RollingNumber({ value, format, duration, className = '', as: Tag = 'span' }) {
  const display = useRollingNumber(value, { duration });
  return <Tag className={`ai-rolling-number ${className}`}>{format(display)}</Tag>;
}
