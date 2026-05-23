import { useEffect, useState } from 'react';

export default function EmailOptIn({ diagnosticId, resultLabel, detail = '', onSubmitted, alreadySubmitted = false }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(alreadySubmitted ? 'success' : 'idle');

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
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section className="bc-optin">
        <h3>Got it.</h3>
        <p>Your full breakdown is unlocked below, and we'll email you a clean copy you can save. We read every opt-in, no auto-sequence.</p>
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
