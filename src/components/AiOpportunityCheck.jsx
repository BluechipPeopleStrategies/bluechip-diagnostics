import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOpportunity, questions } from '../lib/aiOpportunity';
import './AiFunnel.css';

export default function AiOpportunityCheck() {
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const heading = useRef(null);
  const complete = questions.every(q => answers[q.id]);
  const result = getOpportunity(answers);
  function submit(event) {
    event.preventDefault();
    if (!complete) return;
    setFinished(true);
    setTimeout(() => heading.current?.focus(), 0);
  }
  return <main className="bc-page ai-funnel">
    <Link to="/">BlueChip diagnostics</Link>
    <p className="ai-eyebrow">Free AI Opportunity Check</p>
    <h1 ref={heading} tabIndex={-1}>{finished ? 'Your next practical step' : 'Find a useful place to start with AI.'}</h1>
    {!finished ? <>
      <p>Six questions about the work your organisation already does. Get a useful starting point before deciding whether you need an audit.</p>
      <p className="ai-note">No email required. Answers stay on this page and clear when you reload. Please do not enter confidential information.</p>
      <form onSubmit={submit}>
        {questions.map((q, index) => <fieldset key={q.id}>
          <legend><span>{index + 1} / 6</span> {q.label}</legend>
          <div className="ai-options">{q.options.map(([value, label]) => <label key={value}>
            <input type="radio" name={q.id} value={value} required checked={answers[q.id] === value} onChange={() => setAnswers({ ...answers, [q.id]: value })} />
            <span>{label}</span>
          </label>)}</div>
        </fieldset>)}
        <p aria-live="polite">{Object.keys(answers).length} of 6 answered</p>
        <button className="ai-button" type="submit">See my next step</button>
      </form>
    </> : <>
      <section className="ai-panel"><p className="ai-eyebrow">{result.label}</p><h2>{result.opportunity}</h2><p>{result.next}</p><h3>One useful preparation step</h3><p>{result.preparation}</p><p>{result.toolAdvice}</p></section>
      <p className="ai-note">This is a starting point based on your answers, not a savings estimate or confirmation that the five-hour audit threshold is met.</p>
      <section><h2>Turn the opportunity into a plan.</h2><p>The Practical AI Audit examines your organisation’s workflows, recommends suitable tools and documents potential time savings. You choose and implement the recommendations.</p>
        <Link className="ai-button" to={`/ai-audit?workflow=${encodeURIComponent(answers.workflow)}`}>See what your AI audit includes</Link>
      </section>
      <button className="ai-secondary" onClick={() => { setFinished(false); setTimeout(() => heading.current?.focus(), 0); }}>Review my answers</button>
    </>}
  </main>;
}
