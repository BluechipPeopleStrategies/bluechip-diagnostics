import { useState } from 'react';
import { encodeResult } from '../lib/share';

export default function ShareButton({ diagnosticId, resultType, resultLabel }) {
  const [feedback, setFeedback] = useState('');

  async function copy() {
    const encoded = encodeResult({ type: resultType, label: resultLabel });
    const url = `${window.location.origin}/${diagnosticId}/result/${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('Copied to clipboard');
      setTimeout(() => setFeedback(''), 2400);
    } catch {
      setFeedback(url);
    }
  }

  return (
    <div>
      <button type="button" className="bc-share-button" onClick={copy}>
        Copy a link to my result →
      </button>
      {feedback && <span className="bc-share-feedback">{feedback}</span>}
    </div>
  );
}
