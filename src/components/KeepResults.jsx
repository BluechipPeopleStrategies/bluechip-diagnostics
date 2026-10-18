import { useState } from 'react';
import { FcIcon } from './FreeCheckIcons';
import { answerSummary } from '../lib/aiOpportunity';
import { rememberedEmail, rememberEmail } from '../lib/freeCheckSession';
import { sendFreeCheckResultsEmail } from '../lib/freeCheckEmail';
import { trackEvent } from '../lib/checkAnalytics';

// Items 60 + 61 (2026-09-25): a summary of every answer, print, a "continue the discussion" QR
// code and "Email my results". The QR is a static SVG (public/img/ai/qr-continue-discussion.svg,
// made with segno) pointing at the agreed resource-pack destination: the site chat, tagged
// utm_source=ai-check. See BlueChip references/video/resource-pack-standard.md.
export const CONTINUE_URL = 'https://www.bluechip-people-strategies.com/?utm_source=ai-check#chat';
const CONTINUE_URL_SHORT = 'bluechip-people-strategies.com/#chat';

export function AnswersSummary({ answers, areaInputs, ownerOtherText, toolsOtherText, onEdit }) {
  const rows = answerSummary(answers, { areaInputs, ownerOtherText, toolsOtherText });
  return (
    <section className="ai-panel ai-fc-answers" aria-labelledby="ai-fc-answers-title">
      <div className="ai-fc-section-head">
        <span className="ai-fc-section-icon" aria-hidden="true"><FcIcon name="list" /></span>
        <h2 id="ai-fc-answers-title">Your answers</h2>
      </div>
      <dl className="ai-fc-answers-list">
        {rows.map((row, i) => (
          <div className="ai-fc-answer" key={row.id}>
            <dt>{row.label}</dt>
            <dd>
              {row.items.length > 1
                ? <ul>{row.items.map((item, k) => <li key={k}>{item}</li>)}</ul>
                : <span>{row.items[0] || 'Not answered'}</span>}
              <button type="button" className="ai-fc-answer-edit" onClick={() => onEdit(i)}
                aria-label={`Change your answer: ${row.label}`}>Change</button>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function KeepResults(props) {
  return (
    <section className="ai-panel ai-fc-keep" aria-labelledby="ai-fc-keep-title">
      <div className="ai-fc-keep-main">
        <h2 id="ai-fc-keep-title">Keep your breakdown and next steps</h2>
        <p className="ai-fc-keep-copy">Get your free time estimate, the areas you picked and practical next steps in one email, ready to review with your team. No purchase required.</p>
        <EmailResultsForm {...props} />
        <div className="ai-fc-keep-actions">
          <button type="button" className="ai-fc-action" onClick={() => window.print()}>
            <FcIcon name="print" /><span>Print my results</span>
          </button>
        </div>
      </div>
      <QrCard />
    </section>
  );
}

export function QrCard() {
  return (
    <figure className="ai-fc-qr">
      <span className="ai-fc-qr-tile"><img src="/img/ai/qr-continue-discussion.svg" alt="QR code that opens a chat with BlueChip" width="41" height="41" /></span>
      <figcaption>
        <strong>Want to continue the discussion?</strong>
        <span>Scan to start a chat with BlueChip, or visit <a href={CONTINUE_URL}>{CONTINUE_URL_SHORT}</a>.</span>
      </figcaption>
    </figure>
  );
}

// One click when this tab already sent to an address; otherwise an email field. Either way the
// visitor chooses whether their answers go in the email or just the estimate (estimate only by
// default, in keeping with "don't enter confidential information").
function EmailResultsForm({ answers, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText }) {
  const [known, setKnown] = useState(() => rememberedEmail());
  const [email, setEmail] = useState('');
  const [include, setInclude] = useState('estimate');
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | sentNoEmail | error
  const [sentTo, setSentTo] = useState('');

  async function send(to) {
    setStatus('sending');
    trackEvent('check_results_email_requested', { include_answers: include === 'answers' });
    try {
      const result = await sendFreeCheckResultsEmail({
        email: to, include, answers, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText, honeypot: trap,
      });
      if (!result.ok || !result.ownerRecorded) {
        setStatus(result.emailSent ? 'sentOwnerPending' : 'error');
        trackEvent('check_results_email_failed', { visitor_email_accepted: result.emailSent, owner_recorded: result.ownerRecorded });
        return;
      }
      trackEvent('check_results_email_accepted', { visitor_email_accepted: result.emailSent, owner_recorded: result.ownerRecorded });
      rememberEmail(to);
      setKnown(to);
      setSentTo(to);
      setStatus(result.emailSent ? 'sent' : 'sentNoEmail');
    } catch {
      setStatus('error');
      trackEvent('check_results_email_failed', { failure: 'network' });
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const to = known || email.trim();
    if (!to) return;
    send(to);
  }

  return (
    <form id="ai-fc-email-panel" className="ai-fc-email" onSubmit={onSubmit} noValidate={false}>
      <p className="ai-note ai-fc-email-fine">Your email, completed answers and result are shared with Thomas at BlueChip to understand your result, develop useful workplace content, and help organizations improve how they use AI in practice. You'll receive one results email. Newsletter signup is a separate choice. Please don't enter confidential information.</p>
      <fieldset className="ai-fc-email-include">
        <legend>What to include in your email</legend>
        <label className={include === 'estimate' ? 'is-selected' : ''}>
          <input type="radio" name="ai-fc-include" value="estimate" checked={include === 'estimate'} onChange={() => setInclude('estimate')} />
          <span>Just the estimate</span>
        </label>
        <label className={include === 'answers' ? 'is-selected' : ''}>
          <input type="radio" name="ai-fc-include" value="answers" checked={include === 'answers'} onChange={() => setInclude('answers')} />
          <span>The estimate and my answers</span>
        </label>
      </fieldset>

      {/* Honeypot: off-screen, out of the tab order, hidden from assistive tech. Neutral name and
          label so autofill never fills it (see freeCheckEmail.js). */}
      <div className="ai-fc-trap" aria-hidden="true">
        <label htmlFor="ai-fc-trap-field">Leave this field empty</label>
        <input id="ai-fc-trap-field" type="text" name="bc_hp_trap" tabIndex={-1} autoComplete="off"
          value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>

      {known ? (
        <div className="ai-fc-email-row">
          <button type="submit" className="ai-fc-send" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : `Send to ${known}`}
          </button>
          <button type="button" className="ai-fc-link-button" onClick={() => { setKnown(''); setStatus('idle'); }}>Use a different email</button>
        </div>
      ) : (
        <div className="ai-fc-email-row">
          <label className="ai-fc-email-label" htmlFor="ai-fc-email-field">Your email</label>
          <input id="ai-fc-email-field" className="ai-fc-email-input" type="email" name="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="ai-fc-send" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Email my results'}
          </button>
        </div>
      )}
      <div role="status" className="ai-fc-email-status">
        {status === 'sent' && <p className="ai-fc-email-ok"><span aria-hidden="true">&#10003;</span> Sent to {sentTo}. It should arrive in a minute or two. If it doesn't, check your spam or junk folder.</p>}
        {status === 'sentNoEmail' && <p className="ai-fc-email-warn">Sorry, the email didn't go through. Your results are still on this page, so you can print them now, or write to thomas@bluechip-people-strategies.com and Thomas will send them.</p>}
        {status === 'error' && <p className="ai-fc-email-warn">Something went wrong. Try again, or write to thomas@bluechip-people-strategies.com.</p>}
        {status === 'sentOwnerPending' && <p className="ai-fc-email-warn">Your results email was sent, but we couldn't confirm the copy for Thomas. Your results are still on this page. Try again, or write to thomas@bluechip-people-strategies.com.</p>}
      </div>
    </form>
  );
}
