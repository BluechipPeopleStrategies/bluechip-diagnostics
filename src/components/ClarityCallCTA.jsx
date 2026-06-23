import { buildClarityCallUrl } from '../lib/clarityCallUrl';
import { getCtaCopy } from '../data/ctaCopy';

// Generic fallback, used when there is no result-specific copy for this result.
// Kept verbatim so the CTA degrades gracefully for any unmapped result.
const GENERIC = {
  headline: "You've earned a free Clarity Call",
  body:
    "A 30-minute conversation about what your diagnostic surfaced. What's actually " +
    "happening in your organization, what you've tried, and whether BlueChip is the " +
    "right fit. No charge; finishing the diagnostic is the only ask.",
  button: 'Book my free Clarity Call',
};

export default function ClarityCallCTA({
  diagnosticId,
  tier = null,
  total = null,
  resultKey = null,
  lowestDimension = null,
}) {
  const baseUrl = import.meta.env.VITE_CAL_BOOKING_URL || '';
  const href = buildClarityCallUrl({ baseUrl, diagnosticId, tier, total });

  const specific = getCtaCopy(diagnosticId, resultKey, { lowestDimension });
  const copy = specific || GENERIC;

  return (
    <>
      <h2>{copy.headline}</h2>
      <p>{copy.body}</p>
      {specific && (
        <p className="bc-cta-note">Free, because you finished the diagnostic. No pitch, no charge.</p>
      )}
      <div className="bc-cta-row">
        <a className="bc-cta" href={href}>
          {copy.button} →
        </a>
      </div>
    </>
  );
}
