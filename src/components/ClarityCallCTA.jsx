import { buildClarityCallUrl } from '../lib/clarityCallUrl';

export default function ClarityCallCTA({ diagnosticId, tier = null, total = null }) {
  const baseUrl = import.meta.env.VITE_CAL_BOOKING_URL || '';
  const href = buildClarityCallUrl({ baseUrl, diagnosticId, tier, total });

  return (
    <>
      <h2>You've <em>earned</em> a free Clarity Call</h2>
      <p>
        A 30-minute conversation about what your diagnostic surfaced — what's actually
        happening in your organization, what you've tried, and whether BlueChip is the
        right fit. No charge; finishing the diagnostic is the only ask.
      </p>
      <div className="bc-cta-row">
        <a className="bc-cta" href={href}>
          Book my free Clarity Call →
        </a>
      </div>
    </>
  );
}
