import { useEffect, useState } from 'react';

// Optional org-context capture (QW1): qualifies the lead and personalizes follow-up.
// Kept optional so it never adds friction to the email step.
const ORG_SIZES = ['Just me', '2-25', '26-250', '250+'];
const SECTORS = [
  'Municipal & local gov',
  'Public safety / fire & emergency',
  'Post-secondary & education',
  'Non-profit & social',
  'Professional services',
  'Skilled trades & construction',
  'Healthcare & clinics',
  'Other',
];

export default function EmailOptIn({
  diagnosticId,
  resultLabel,
  detail = '',
  onSubmitted,
  alreadySubmitted = false,
  hasDimensions = false,
  hasCheatSheet = false,
  hasNextMoves = true,
  onOrgSize,
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState(alreadySubmitted ? 'success' : 'idle');
  const [emailSent, setEmailSent] = useState(true);
  const [trap, setTrap] = useState('');

  const endpoint = import.meta.env.VITE_SUBMIT_ENDPOINT || '/api/submit';

  useEffect(() => {
    if (status === 'success' && onSubmitted) onSubmitted();
  }, [status, onSubmitted]);

  async function submit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticId,
          resultLabel,
          detail,
          email,
          name,
          orgSize,
          sector,
          bc_hp_trap: trap,
          submittedAt: new Date().toISOString(),
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      // The API can return 200 while the visitor's result email silently skips, so record
      // the real outcome in PostHog to expose the true success rate.
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('lead_submitted', {
          diagnosticId,
          http_ok: res.ok,
          email_sent: data.emailSent ?? null,
          nudge_scheduled: data.nudgeScheduled ?? null,
          lead_notification_sent: data.leadNotificationSent ?? null,
        });
      }
      setEmailSent(data.emailSent !== false);
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('lead_submit_failed', { diagnosticId });
      }
      setStatus('error');
    }
  }

  // Name only the deliverables this tool actually gates, so the promise is accurate
  // (next moves are universal; the breakdown is scored-tools-only; the cheat sheet is
  // Supervisor-only). Falls back to the agnostic next-moves promise.
  // Promise only what this result actually unlocks. Next moves exist for archetype results and for
  // scored results whose lowest dimension carries them; Org Pulse and the Governance Health Check
  // unlock the dimension breakdown alone (2026-10-09 bug check, item 1).
  const copyLine = ' We read every opt-in. No auto-sequence.';
  let unlockBody;
  if (hasDimensions && hasNextMoves) {
    unlockBody =
      "Add your email and we'll unlock your dimension-by-dimension breakdown and your personalized next moves, then send you a clean copy you can keep." + copyLine;
  } else if (hasDimensions) {
    unlockBody =
      "Add your email and we'll unlock your dimension-by-dimension breakdown, then send you a clean copy you can keep." + copyLine;
  } else if (hasCheatSheet) {
    unlockBody =
      "Add your email and we'll unlock your personalized next moves and your cheat sheet, built around your result, then send you a clean copy you can keep." + copyLine;
  } else {
    unlockBody =
      "Add your email and we'll unlock your personalized next moves, built around your result, then send you a clean copy you can keep." + copyLine;
  }
  const unlockWhat = hasNextMoves ? 'next moves' : 'breakdown';

  if (status === 'success') {
    return (
      <section className="bc-optin">
        <h3>Got it. <em>Unlocked below.</em></h3>
        {emailSent ? (
          <p>Your {unlockWhat} {hasNextMoves ? 'are' : 'is'} unlocked below, and a clean copy is on its way to your inbox. We read every opt-in. No auto-sequence.</p>
        ) : (
          <p>Your {unlockWhat} {hasNextMoves ? 'are' : 'is'} unlocked below. We've saved your result, but the email copy didn't go through, so if it doesn't arrive shortly, reach out to thomas@bluechip-people-strategies.com and we'll send it over.</p>
        )}
      </section>
    );
  }

  return (
    <section className="bc-optin" id="bc-optin">
      {hasNextMoves ? <h3>Now, <em>what to do</em> with it.</h3> : <h3>Now, <em>the detail</em> behind it.</h3>}
      <p>{unlockBody}</p>
      <div className="bc-optin-selects">
        <select
          className="bc-input"
          aria-label="Organization size (optional)"
          value={orgSize}
          onChange={(e) => {
            setOrgSize(e.target.value);
            if (onOrgSize) onOrgSize(e.target.value);
          }}
        >
          <option value="">Org size (optional)</option>
          {ORG_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="bc-input"
          aria-label="Sector (optional)"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
        >
          <option value="">Sector (optional)</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <form onSubmit={submit} className="bc-optin-row">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bc-input"
          aria-label="Your name"
        />
        <input
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bc-input"
          aria-label="Your email"
        />
        {/* Spam trap: off-screen, out of the tab order, neutral name so autofill leaves it alone. */}
        <input
          type="text"
          name="bc_hp_trap"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />
        <button type="submit" className="bc-cta" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : `Unlock my ${unlockWhat}`}
        </button>
      </form>
      {status === 'error' && (
        <p className="bc-optin-status is-error">
          Something went wrong. Try again, or email thomas@bluechip-people-strategies.com directly.
        </p>
      )}
    </section>
  );
}
