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

// Proof strip (QW4): the one credibility line the funnel was missing. Every
// credential is real (source: bluechip-website/_positioning.md); no client
// names, no numbers. Infy + fast panel cleared 2026-07-04.
const PROOF =
  "Free doesn't mean shallow. This diagnostic runs on the same dimensions BlueChip uses in " +
  'its paid leadership and organizational assessments, shaped by years inside municipal ' +
  'government, an HR background spanning training, recruitment, and investigations, and a ' +
  "Master's in coaching.";

// Bridge line keyed to the org size the visitor gave at the email step. Rides
// the one existing call ask ("bring it to the call"), never a second CTA.
// 250+ and no-answer get no line; the generic CTA already fits that read.
const ORG_SIZE_BRIDGE = {
  'Just me':
    'If HR is one of five hats you are wearing right now, bring that to the call. We can ' +
    'sketch what senior HR support a few days a month could look like for a business your size.',
  '2-25':
    'If HR is one of five hats you are wearing right now, bring that to the call. We can ' +
    'sketch what senior HR support a few days a month could look like for a business your size.',
  '26-250':
    'Growth often outpaces the supervisors carrying it. If that feels familiar, bring it to ' +
    'the call and we can talk through how leadership development works at your size.',
};

// Team/board on-ramp (QW8): only the org-level tools, same booking flow. For the
// governance tool the "team" is the board itself, where side-by-side reads matter most.
const TEAM_ONRAMP_IDS = ['org-pulse', 'workplace-read', 'governance-eval-readiness'];
const TEAM_ONRAMP =
  "Right now this reflects one person's read of the organization. If you are curious how " +
  "your leadership team's reads would line up side by side, mention it when you book and " +
  'we will set up the team version.';

export default function ClarityCallCTA({
  diagnosticId,
  tier = null,
  total = null,
  resultKey = null,
  lowestDimension = null,
  orgSize = null,
}) {
  const baseUrl = import.meta.env.VITE_CAL_BOOKING_URL || '';
  const href = buildClarityCallUrl({ baseUrl, diagnosticId, tier, total });

  const specific = getCtaCopy(diagnosticId, resultKey, { lowestDimension });
  const copy = specific || GENERIC;
  const bridge = orgSize ? ORG_SIZE_BRIDGE[orgSize] : null;
  const teamOnramp = TEAM_ONRAMP_IDS.includes(diagnosticId);

  return (
    <>
      <p className="bc-proof">{PROOF}</p>
      <h2>{copy.headline}</h2>
      <p>{copy.body}</p>
      {bridge && <p className="bc-cta-bridge">{bridge}</p>}
      {specific && (
        <p className="bc-cta-note">Free, because you finished the diagnostic. No pitch, no charge.</p>
      )}
      <div className="bc-cta-row">
        <a className="bc-cta" href={href}>
          {copy.button} →
        </a>
      </div>
      {teamOnramp && <p className="bc-cta-note">{TEAM_ONRAMP}</p>}
    </>
  );
}
