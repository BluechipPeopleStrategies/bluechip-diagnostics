import { useState } from 'react';

export default function EmailOptIn({ diagnosticId, resultLabel }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');

  const endpoint = import.meta.env.VITE_FORMSPREE_DIAGNOSTICS_ENDPOINT;

  async function submit(e) {
    e.preventDefault();
    if (!endpoint || endpoint.includes('REPLACE_ME')) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticId,
          resultLabel,
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
        <p>We'll email you a copy of your results. Thomas reads every opt-in personally — no auto-sequence.</p>
      </section>
    );
  }

  return (
    <section className="bc-optin">
      <h3>Want this emailed to you?</h3>
      <p>Drop your email. Thomas reads every opt-in personally — no auto-sequence.</p>
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
