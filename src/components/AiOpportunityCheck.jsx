import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  questions, isComplete, toggleMulti, defaultHours, computeRange, roundHoursLabel, roundDollars,
  money, suggestedAreas, tailoredLines, bandLine, AREA_LABELS,
} from '../lib/aiOpportunity';
import SiteHeader from './SiteHeader';
import AiRangeCalculator from './AiRangeCalculator';
import HoursRangeTrack from './HoursRangeTrack';
import Emblem from './Emblem';
import './AiFunnel.css';

const GUARANTEE_HEADLINE = 'The AI Handoff Plan: find 5 hours a week, or your money back.';
const GUARANTEE_SUPPORT = "If the plan can't find tools with evidence-backed potential to save at least 5 net hours a week across your organization, your full fee comes back within 10 business days, no forms, no hoops.";

function GuaranteeBand() {
  return (
    <div className="ai-guarantee-band">
      <p className="ai-guarantee-headline">{GUARANTEE_HEADLINE}</p>
      <p className="ai-guarantee-support">{GUARANTEE_SUPPORT}</p>
    </div>
  );
}

// Moves focus to the next/previous sibling input inside an option grid on the arrow keys, so a
// "pick all" checkbox group behaves like the native roving-focus radios do automatically.
function handleGridArrowKeys(e) {
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
  const inputs = Array.from(e.currentTarget.querySelectorAll('input'));
  const i = inputs.indexOf(document.activeElement);
  if (i === -1) return;
  e.preventDefault();
  const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
  const next = inputs[(i + dir + inputs.length) % inputs.length];
  next?.focus();
}

export default function AiOpportunityCheck() {
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [step, setStep] = useState('questions'); // questions -> calculator -> result
  const [rows, setRows] = useState([]);
  const [rate, setRate] = useState(40);
  const [weeks, setWeeks] = useState(48);
  const [skipped, setSkipped] = useState(false);
  const headingRef = useRef(null);

  const question = questions[qIndex];
  const answeredCount = questions.filter(q => isComplete(q, answers)).length;
  const pct = Math.round(((qIndex + 1) / questions.length) * 100);

  useEffect(() => { setTimeout(() => headingRef.current?.focus(), 0); }, [step, qIndex]);

  // Builds one calculator row per picked area, prefilled from the Q5 workload answer (panel
  // condition 3). Takes the answers object explicitly so the last question's auto-advance can
  // hand off the value it just set without waiting on a state update to be visible.
  function enterCalculator(ans) {
    setRows(ans.areas.map(area => ({ area, hours: defaultHours(ans.workload), people: 1 })));
    setStep('calculator');
  }

  function selectSingle(value) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    setTimeout(() => {
      if (qIndex < questions.length - 1) setQIndex(i => i + 1);
      else enterCalculator(next);
    }, 200);
  }

  function toggleOption(value) {
    setAnswers(prev => ({ ...prev, [question.id]: toggleMulti(prev[question.id] || [], value, question.options, question.maxPicks) }));
  }

  function goNext() {
    if (!isComplete(question, answers)) return;
    if (qIndex < questions.length - 1) setQIndex(i => i + 1);
    else enterCalculator();
  }
  function goBack() {
    if (qIndex > 0) setQIndex(i => i - 1);
  }
  function reviewAnswers() {
    setStep('questions');
    setQIndex(0);
    setSkipped(false);
  }

  const value = answers[question?.id];
  const picks = Array.isArray(value) ? value : [];
  const atCap = question?.maxPicks && picks.length >= question.maxPicks;

  return <main className="bc-page ai-funnel">
    <SiteHeader />

    {step === 'questions' && <>
      {qIndex === 0 && <>
        <p className="ai-eyebrow">Free AI Opportunity Check</p>
        <h1 ref={headingRef} tabIndex={-1}>How much time could AI give back to your team?</h1>
        <p>Twelve quick questions about the work your organization already does, about three minutes in all. You'll get a starting estimate of the hours in play, before deciding whether you want a plan.</p>
        <p className="ai-note">No email required. Answers stay on this page and clear when you reload. Please don't enter confidential information.</p>
        <GuaranteeBand />
        <p className="ai-note ai-guarantee-fineprint">This check is free. The guarantee belongs to the paid plan.</p>
      </>}

      <div className="ai-stepper">
        <div className="ai-stepper-progress-track" aria-hidden="true"><div className="ai-stepper-progress-fill" style={{ width: `${pct}%` }} /></div>
        <p className="ai-live" aria-live="polite">Question {qIndex + 1} of {questions.length}. {answeredCount} of {questions.length} answered.</p>

        <fieldset className="ai-stepper-question">
          <legend>{qIndex > 0 && <span className="ai-stepper-count">{qIndex + 1} / {questions.length}</span>} <span ref={qIndex > 0 ? headingRef : null} tabIndex={qIndex > 0 ? -1 : undefined}>{question.label}</span></legend>

          <div className="ai-options ai-options--tiles" onKeyDown={question.type === 'multi' ? handleGridArrowKeys : undefined}>
            {question.options.map(([val, label]) => {
              const disabledByCap = question.type === 'multi' && atCap && !picks.includes(val);
              return <label key={val} className={disabledByCap ? 'is-disabled' : ''}>
                {question.type === 'multi'
                  ? <input type="checkbox" name={question.id} value={val} checked={picks.includes(val)} disabled={disabledByCap}
                    onChange={() => toggleOption(val)} />
                  : <input type="radio" name={question.id} value={val} checked={value === val}
                    onChange={() => selectSingle(val)} />}
                {question.id === 'areas' && <svg className="ai-tile-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>}
                <span>{label}</span>
              </label>;
            })}
          </div>
          {question.id === 'areas' && <p className="ai-note">Up to four. The calculator below adds one row per area you pick here.</p>}
        </fieldset>

        <div className="ai-stepper-nav">
          <button type="button" className="ai-secondary" onClick={goBack} disabled={qIndex === 0}>Back</button>
          {question.type === 'multi' && <button type="button" className="ai-button" onClick={goNext} disabled={!isComplete(question, answers)}>
            {qIndex === questions.length - 1 ? 'See my estimate' : 'Next'}
          </button>}
        </div>
      </div>
    </>}

    {step === 'calculator' && <AiRangeCalculator
      rows={rows} setRows={setRows} orgSize={answers.orgSize} rate={rate} weeks={weeks}
      onRate={setRate} onWeeks={setWeeks}
      onShowResult={() => { setSkipped(false); setStep('result'); }}
      onSkip={() => { setSkipped(true); setStep('result'); }}
    />}

    {step === 'result' && <ResultScreen answers={answers} rows={rows} rate={rate} weeks={weeks} skipped={skipped} onReview={reviewAnswers} headingRef={headingRef} />}
  </main>;
}

function ResultScreen({ answers, rows, rate, weeks, skipped, onReview, headingRef }) {
  const { low, likely } = computeRange(rows, answers.orgSize);
  const likelyUnderOne = !skipped && likely < 1;
  const areas = suggestedAreas(answers.orgType, answers.areas || []);
  const lines = tailoredLines(answers);
  const valueLow = roundDollars(low * rate * weeks);
  const valueLikely = roundDollars(likely * rate * weeks);

  return <>
    <p className="ai-eyebrow">Your starting estimate</p>
    <h1 ref={headingRef} tabIndex={-1}>
      {skipped
        ? "You skipped the hours, so there's no range yet. Your answers still show where we'd start looking."
        : likelyUnderOne
          ? 'Your answers point to under an hour a week in these areas. The bigger opportunities may sit somewhere else.'
          : `Your team could get back about ${roundHoursLabel(low)} to ${roundHoursLabel(likely)} hours a week across the areas you picked.`}
    </h1>

    {!skipped && <>
      <HoursRangeTrack low={low} likely={likely} />
      <p>It's built from your numbers for a team of {answers.orgSize ? answers.orgSize.replace('+', ' or more') : 'your'} people and the time savings published studies measured for this kind of work in other workplaces, minus the time it takes to check the tools' work.</p>
      <p>At {money(rate)} an hour over {weeks} working weeks, that's roughly {money(valueLow)} to {money(valueLikely)} a year in potential staff capacity. That's time for other work, not a cash saving.</p>
    </>}

    {areas.length > 0 && <p>Where we'd also look in an organization like yours: {areas.map(a => AREA_LABELS[a]).join(', ')}.</p>}

    {lines.length > 0 && <ul className="ai-tailored-lines">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}

    <GuaranteeBand />

    {!skipped && <p>{bandLine(low, likely)}</p>}

    <p>You get the plan, and your team puts it in place.</p>

    <p><Link className="ai-button" to="/ai-handoff-plan">See what the plan includes</Link></p>

    <p className="ai-note">This is an estimate from your answers and published studies. It isn't a promise of results or a cash saving.</p>

    <details className="ai-disclosure">
      <summary>How this estimate works</summary>
      <p>For each area you picked, we multiply the hours one person spends by the number of people, then by a low and a likely net rate taken from published studies of similar work. The net rate is the time saving those studies measured, minus an allowance for checking the tools' work. Where no study matches an area closely, we use our most conservative rate. Hours are capped at 20 a week per person for each area and 30 in total. The dollar figure uses the hourly cost and working weeks shown in the calculator. The range is only as good as the numbers you enter, and your own results could land outside it.</p>
    </details>

    <button type="button" className="ai-secondary" onClick={onReview}>Review my answers</button>
    <Emblem slug="ai-opportunity-check" />
  </>;
}
