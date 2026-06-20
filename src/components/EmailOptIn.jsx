import { useEffect, useState } from 'react';

export default function EmailOptIn({ diagnosticId, resultLabel, detail = '', onSubmitted, alreadySubmitted = false }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(alreadySubmitted ? 'success' : 'idle');
  const [emailSent, setEmailSent] = useState(true);

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
          submittedAt: new Date().toISOString(),
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      // The API returns 200 even when email/Notion silently skip, so record the
      // real outcome in PostHog to expose the true success rate.
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('lead_submitted', {
          diagnosticId,
          http_ok: res.ok,
          email_sent: data.emailSent ?? null,
          nudge_scheduled: data.nudgeScheduled ?? null,
          notion_row_created: data.notionRowCreated ?? null,
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

  if (status === 'success') {
    return (
      <section className="bc-optin">
        <h3>Got it.</h3>
        {emailSent ? (
          <p>Your full breakdown is unlocked below, and we'll email you a clean copy you can save. We read every opt-in, no auto-sequence.</p>
        ) : (
          <p>Your full breakdown is unlocked below. We've saved your result, but the email copy didn't go through, so if it doesn't arrive shortly, reach out to thomas@bluechip-people-strategies.com and we'll send it over.</p>
        )}
      </section>
    );
  }

  return (
    <section className="bc-optin">
      <h3>Want the <em>full breakdown</em>?</h3>
      <p>Drop your email and we'll unlock the dimension-by-dimension breakdown and your personalized next moves, plus send you a clean copy you can save. We read every opt-in, no auto-sequence.</p>
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
        <button type="submit" className="bc-cta" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send it'}
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
