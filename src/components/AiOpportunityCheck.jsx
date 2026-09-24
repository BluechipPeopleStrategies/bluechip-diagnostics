import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOpportunity, questions, estimateCapacity, defaultHours } from '../lib/aiOpportunity';
import AiCalculator, { money } from './AiCalculator';
import './AiFunnel.css';

export default function AiOpportunityCheck() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState('questions'); // questions -> calculator -> result
  const [calc, setCalc] = useState({ hours: 5, rate: 40, weeks: 40 });
  const heading = useRef(null);
  const dialogHeading = useRef(null);
  const complete = questions.every(q => answers[q.id]);
  const result = getOpportunity(answers);
  const value = estimateCapacity(calc);

  useEffect(() => {
    if (step === 'calculator') setTimeout(() => dialogHeading.current?.focus(), 0);
    if (step !== 'calculator') setTimeout(() => heading.current?.focus(), 0);
  }, [step]);

  function submit(event) {
    event.preventDefault();
    if (!complete) return;
    setCalc(c => ({ ...c, hours: defaultHours(answers.workload) }));
    setStep('calculator');
  }

  return <main className="bc-page ai-funnel">
    <Link to="/">BlueChip diagnostics</Link>
    <p className="ai-eyebrow">Free AI Opportunity Check</p>
    <h1 ref={heading} tabIndex={-1}>{step === 'result' ? 'Your next practical step' : 'Find a useful place to start with AI.'}</h1>

    {step !== 'result' && <>
      <p>Six questions about the work your organisation already does. Get a useful starting point before deciding whether you need an audit.</p>
      <p className="ai-note">Just before your result, a quick calculator shows what the time you could free up might be worth.</p>
      <p className="ai-note">No email required. Answers stay on this page and clear when you reload. Please do not enter confidential information.</p>
      <form onSubmit={submit}>
        {questions.map((q, index) => <fieldset key={q.id}>
          <legend><span>{index + 1} / 6</span> {q.label}</legend>
          <div className="ai-options">{q.options.map(([val, label]) => <label key={val}>
            <input type="radio" name={q.id} value={val} required checked={answers[q.id] === val} onChange={() => setAnswers({ ...answers, [q.id]: val })} />
            <span>{label}</span>
          </label>)}</div>
        </fieldset>)}
        <p aria-live="polite">{Object.keys(answers).length} of 6 answered</p>
        <button className="ai-button" type="submit">See my next step</button>
      </form>
    </>}

    {step === 'calculator' && <div className="ai-modal-backdrop" onKeyDown={(e) => { if (e.key === 'Escape') setStep('result'); }}>
      <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-calc-title">
        <p className="ai-eyebrow">Before your result</p>
        <h2 id="ai-calc-title" ref={dialogHeading} tabIndex={-1}>What could that time be worth?</h2>
        <p>Adjust the numbers to fit your organisation. Nothing leaves this page.</p>
        <AiCalculator calc={calc} setCalc={setCalc} />
        <div className="ai-modal-actions">
          <button className="ai-button" type="button" onClick={() => setStep('result')}>Show my result</button>
          <button className="ai-secondary" type="button" onClick={() => setStep('result')}>Skip</button>
        </div>
      </div>
    </div>}

    {step === 'result' && <>
      <section className="ai-panel"><p className="ai-eyebrow">{result.label}</p><h2>{result.opportunity}</h2><p>{result.next}</p><h3>One useful preparation step</h3><p>{result.preparation}</p><p>{result.toolAdvice}</p></section>
      <p className="ai-note">This is a starting point based on your answers, not a savings estimate or confirmation that the five-hour audit threshold is met.</p>
      <section className="ai-panel ai-funnel-cta"><p className="ai-eyebrow">Your numbers</p><h2>{calc.hours} hours a week could be worth about {money(value)} a year.</h2>
        <p>The Practical AI Audit examines your organisation's actual workflows, recommends suitable tools and documents the potential time savings, net of checking and upkeep. It's C$999 including tax, and your fee is refunded in full if we can't identify evidence-backed potential for at least five net hours a week. You choose and implement the recommendations.</p>
        <Link className="ai-button" to={`/ai-audit?workflow=${encodeURIComponent(answers.workflow)}`}>See what your AI audit includes</Link>
      </section>
      <button className="ai-secondary" onClick={() => setStep('questions')}>Review my answers</button>
    </>}
  </main>;
}
