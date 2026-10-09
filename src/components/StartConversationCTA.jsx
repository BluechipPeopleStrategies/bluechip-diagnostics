import { useEffect } from 'react';
import { loadChatWidget } from '../lib/chatWidget';
import { getCtaCopy } from '../data/ctaCopy';

// The next step after a quiz result (2026-10-09): "Start the conversation", which opens the site
// chat widget on its "Other BlueChip services" topic. This replaces the paused Clarity Call block;
// there is no call to book and no price. The link is a #chat hook: public/widget.js opens the chat
// for any #chat?topic=... link, and if the widget is still loading when it is clicked, the widget
// reads the same hash on load. The chat shows which page the inquiry came from.
export const QUIZ_CHAT_TOPIC = 'other';

// Generic fallback, used when there is no result-specific copy for this result.
const GENERIC = {
  headline: 'Want to talk it through?',
  body: 'Your result is a starting point. If you would like to look at what it means for your situation, start a conversation with BlueChip.',
};

// Team/board on-ramp (QW8): only the org-level tools. For the governance tool the "team" is the
// board itself, and a councillor or director who is not the chair is explicitly invited to take
// their read to the chair.
const TEAM_ONRAMP_IDS = ['org-pulse', 'workplace-read', 'governance-eval-readiness'];
const TEAM_ONRAMP =
  "Right now this reflects one person's read of the organization. If you are curious how " +
  "your leadership team's reads would line up side by side, mention it when you start the conversation.";
const GOVERNANCE_ONRAMP =
  'You do not need to be the chair to take the next step. Bring your result to your chair ' +
  'or raise it at your next board meeting.';

export default function StartConversationCTA({ diagnosticId, resultKey = null, lowestDimension = null }) {
  useEffect(() => { loadChatWidget(); }, []);

  const specific = getCtaCopy(diagnosticId, resultKey, { lowestDimension });
  const copy = specific || GENERIC;
  const teamOnramp = TEAM_ONRAMP_IDS.includes(diagnosticId);

  return (
    <section aria-labelledby="bc-next-step-title">
      <h2 id="bc-next-step-title">{copy.headline}</h2>
      <p>{copy.body}</p>
      {specific && <p>If you would like to talk it through, start a conversation with BlueChip.</p>}
      <p className="bc-cta-note">It sends an inquiry. It doesn't book anything or charge you.</p>
      <div className="bc-cta-row">
        <a className="bc-cta" href={`#chat?topic=${QUIZ_CHAT_TOPIC}`}>Start the conversation →</a>
      </div>
      {teamOnramp && (
        <p className="bc-cta-note">
          {diagnosticId === 'governance-eval-readiness' ? GOVERNANCE_ONRAMP : TEAM_ONRAMP}
        </p>
      )}
    </section>
  );
}
