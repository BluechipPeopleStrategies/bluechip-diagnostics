import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  questions, isComplete, toggleMulti, computeRange, roundHoursLabel, roundDollars, money,
  suggestedAreas, AREA_LABELS, lowerFirst, joinList, groupedOptions,
  sanitizeAreaLabel, sanitizeShortText, areaLookoutLines, crossCuttingCards, nextSteps,
  peopleCapForOrgSize, orgSizeMidpoint, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
  PEOPLE_MAX_BEFORE_ORG_SIZE, areaHoursLabel } from '../lib/aiOpportunity';
import { prefersReducedMotion } from '../lib/useRollingNumber';
import SiteHeader from './SiteHeader';
import AreaIcon, { CheckCircleIcon } from './AreaIcon';
import AreaHoursInput from './AreaHoursInput';
import GoldSlider from './GoldSlider';
import ChipsRow from './ChipsRow';
import RollingNumber from './RollingNumber';
import Emblem from './Emblem';
import './AiFunnel.css';

const LOADING_MESSAGES = [
  'Matching your answers to published studies...',
  'Netting out checking time...',
  'Adding it up...',
];
const LOADING_MS_FULL = 1800;
const LOADING_MS_REDUCED = 600;

// Moves focus to the next/previous sibling input inside an option grid on the arrow keys, so a
// "pick all" checkbox group behaves like the native roving-focus radios do automatically.
function handleGridArrowKeys(e) {
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
  const inputs = Array.from(e.currentTarget.querySelectorAll('input[type="checkbox"], input[type="radio"]'));
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
  const [step, setStep] = useState('questions'); // questions -> loading -> result
  const [areaInputs, setAreaInputs] = useState({}); // { [area]: { hours, people, label? } }
  const [rate, setRate] = useState(40);
  const [weeks, setWeeks] = useState(48);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [ownerOtherText, setOwnerOtherText] = useState(''); // Q9 "Someone else" free text, optional
  const headingRef = useRef(null);

  const question = questions[qIndex];
  const answeredCount = questions.filter(q => isComplete(q, answers)).length;
  const pct = Math.round(((qIndex + 1) / questions.length) * 100);

  useEffect(() => { setTimeout(() => headingRef.current?.focus(), 0); }, [step, qIndex]);

  // Cycles the loading copy, then reveals the result. Reduced motion: a short static beat only.
  useEffect(() => {
    if (step !== 'loading') return;
    const reduced = prefersReducedMotion();
    if (reduced) {
      const t = setTimeout(() => setStep('result'), LOADING_MS_REDUCED);
      return () => clearTimeout(t);
    }
    setLoadingMsgIndex(0);
    const msgTimer = setInterval(() => setLoadingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), LOADING_MS_FULL / LOADING_MESSAGES.length);
    const done = setTimeout(() => setStep('result'), LOADING_MS_FULL);
    return () => { clearInterval(msgTimer); clearTimeout(done); };
  }, [step]);

  function selectSingle(value) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    setTimeout(() => {
      if (qIndex < questions.length - 1) setQIndex(i => i + 1);
      else setStep('loading');
    }, 200);
  }

  function toggleOption(value) {
    setAnswers(prev => ({ ...prev, [question.id]: toggleMulti(prev[question.id] || [], value, question.options, question.maxPicks) }));
    if (question.id === 'areas') {
      setAreaInputs(prev => (prev[value] ? prev : { ...prev, [value]: { hours: 5, people: 1 } }));
    }
  }

  function goNext() {
    if (!isComplete(question, answers)) return;
    if (qIndex < questions.length - 1) setQIndex(i => i + 1);
    else setStep('loading');
  }
  function goBack() {
    if (qIndex > 0) setQIndex(i => i - 1);
  }
  function reviewAnswers() {
    setStep('questions');
    setQIndex(0);
  }

  const value = answers[question?.id];
  const picks = Array.isArray(value) ? value : [];
  const atCap = question?.maxPicks && picks.length >= question.maxPicks;
  const isAreas = question?.id === 'areas';
  const isOwner = question?.id === 'owner';
  const isGrouped = !!question?.groups;
  const peopleMaxDuringQ2 = answers.orgSize ? peopleCapForOrgSize(answers.orgSize) : PEOPLE_MAX_BEFORE_ORG_SIZE;
  const pickedRows = isAreas ? picks.map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 5, people: areaInputs[a]?.people ?? 1 })) : [];
  const livePreview = isAreas && pickedRows.some(r => r.hours > 0) ? computeRange(pickedRows, answers.orgSize) : null;

  function renderTile([val, label]) {
    const disabledByCap = question.type === 'multi' && atCap && !picks.includes(val);
    const checked = question.type === 'multi' ? picks.includes(val) : value === val;
    return <div className={`ai-tile-wrap ${disabledByCap ? 'is-disabled' : ''}`} key={val}>
      <label>
        {question.type === 'multi'
          ? <input type="checkbox" name={question.id} value={val} checked={checked} disabled={disabledByCap}
            onChange={() => toggleOption(val)} />
          : <input type="radio" name={question.id} value={val} checked={checked}
            onChange={() => selectSingle(val)} />}
        {isAreas && <AreaIcon area={val} />}
        <span>{label}</span>
      </label>
      {isAreas && checked && <AreaHoursInput
        area={val} hours={areaInputs[val]?.hours ?? 5} people={areaInputs[val]?.people ?? 1}
        peopleMax={peopleMaxDuringQ2}
        onHoursChange={(h) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], hours: h } }))}
        onPeopleChange={(p) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], people: p } }))}
        otherLabel={areaInputs[val]?.label}
        onOtherLabelChange={(l) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], label: l } }))}
      />}
    </div>;
  }

  return <main className="bc-page ai-funnel">
    <SiteHeader />

    {step === 'questions' && <>
      {qIndex === 0 && <>
        <p className="ai-eyebrow">Free AI Opportunity Check</p>
        <h1 ref={headingRef} tabIndex={-1}>How much time could AI give back to your team?</h1>
        <img className="ai-intro-photo" alt=""
          src="/img/ai/02-free-check-1600.webp"
          srcSet="/img/ai/02-free-check-800.webp 800w, /img/ai/02-free-check-1600.webp 1600w"
          sizes="(max-width: 700px) 45vw, 200px"
          width="1600" height="1600" loading="lazy" />
        <p>Find out roughly how many hours a week AI could give your team back. About three minutes, no email.</p>
        <p className="ai-note">Answers stay on this page and clear when you reload. Please don't enter confidential information.</p>
      </>}

      <div className="ai-stepper">
        <div className="ai-stepper-progress-track" aria-hidden="true"><div className="ai-stepper-progress-fill" style={{ width: `${pct}%` }} /></div>
        <p className="ai-live" aria-live="polite">Question {qIndex + 1} of {questions.length}. {answeredCount} of {questions.length} completed.</p>

        <fieldset className="ai-stepper-question">
          <legend>{qIndex > 0 && <span className="ai-stepper-count">{qIndex + 1} / {questions.length}</span>} <span ref={qIndex > 0 ? headingRef : null} tabIndex={qIndex > 0 ? -1 : undefined}>{question.label}</span></legend>

          <div className={`ai-options ai-options--tiles ${isAreas ? 'ai-options--areas' : ''} ${isGrouped ? 'ai-options--grouped' : ''}`} onKeyDown={question.type === 'multi' ? handleGridArrowKeys : undefined}>
            {isGrouped
              ? groupedOptions(question).flatMap((bucket, bi) => [
                bucket.label && <p className="ai-tile-group-label" key={`group-${bi}`}>{bucket.label}</p>,
                ...bucket.options.map(renderTile),
              ]).filter(Boolean)
              : question.options.map(renderTile)}
          </div>
          {isAreas && <p className="ai-note">Up to four. Each one you pick gets its own hours and people below.</p>}
          {livePreview && <p className="ai-live-preview">About {roundHoursLabel(livePreview.low)} to {roundHoursLabel(livePreview.likely)} hours a week back, so far.</p>}
          {isOwner && value === 'someoneElse' && <div className="ai-other-label-field">
            <label className="ai-hours-field-label" htmlFor="owner-other-text">Who is it? (a role is fine, e.g. finance lead)</label>
            <input id="owner-other-text" type="text" className="ai-compact-text-input" maxLength={60}
              value={ownerOtherText} onChange={(e) => setOwnerOtherText(e.target.value)} />
            {sanitizeShortText(ownerOtherText) && <p className="ai-note">You said: {sanitizeShortText(ownerOtherText)}</p>}
          </div>}
        </fieldset>

        <div className="ai-stepper-nav">
          <button type="button" className="ai-secondary" onClick={goBack} disabled={qIndex === 0}>Back</button>
          {question.type === 'multi' && <button type="button" className="ai-button" onClick={goNext} disabled={!isComplete(question, answers)}>
            {qIndex === questions.length - 1 ? 'See my estimate' : 'Next'}
          </button>}
        </div>
      </div>
    </>}

    {step === 'loading' && <LoadingScreen messageIndex={loadingMsgIndex} headingRef={headingRef} />}

    {step === 'result' && <ResultScreen answers={answers} areaInputs={areaInputs} rate={rate} weeks={weeks}
      onRate={setRate} onWeeks={setWeeks} onReview={reviewAnswers} headingRef={headingRef} />}
  </main>;
}

function LoadingScreen({ messageIndex, headingRef }) {
  return <div className="ai-loading" role="status" aria-live="off">
    <p className="ai-eyebrow" ref={headingRef} tabIndex={-1}>Calculating your estimate...</p>
    <div className="ai-loading-track" aria-hidden="true"><div className="ai-loading-fill" /></div>
    <p className="ai-loading-message" aria-hidden="true">{LOADING_MESSAGES[messageIndex]}</p>
  </div>;
}

function ResultScreen({ answers, areaInputs, rate, weeks, onRate, onWeeks, onReview, headingRef }) {
  const rows = (answers.areas || []).map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 5, people: areaInputs[a]?.people ?? 1 }));
  const { low, likely, rows: rowDetail } = computeRange(rows, answers.orgSize);
  const areas = suggestedAreas(answers.orgType, answers.areas || []);
  const valueLow = low * rate * weeks;
  const valueLikely = likely * rate * weeks;

  const areaCards = (answers.areas || []).map(a => ({
    title: a === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[a],
    lines: areaLookoutLines(a),
  }));
  const lookoutCards = [...areaCards, ...crossCuttingCards(answers)];
  const topArea = rows[0]?.area;
  const topAreaLabel = topArea ? (topArea === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : lowerFirst(AREA_LABELS[topArea])) : null;
  const steps = nextSteps(answers, topAreaLabel);

  const peopleMax = answers.orgSize ? peopleCapForOrgSize(answers.orgSize) : PEOPLE_MAX_BEFORE_ORG_SIZE;
  const totalPeopleEntered = Math.max(1, rowDetail.reduce((s, r) => s + r.people, 0));
  const defaultHeadcount = Math.min(peopleMax, orgSizeMidpoint(answers.orgSize));
  const [headcount, setHeadcount] = useState(defaultHeadcount);
  const perPersonLow = low / totalPeopleEntered;
  const perPersonLikely = likely / totalPeopleEntered;
  const scaledLow = Math.min(HOURS_DISPLAY_CAP, perPersonLow * headcount);
  const scaledLikely = Math.min(HOURS_DISPLAY_CAP, perPersonLikely * headcount);
  const scaledValueLow = scaledLow * rate * weeks;
  const scaledValueLikely = scaledLikely * rate * weeks;

  const carryHours = perPersonHoursForCarry(rows);
  const carryEmployees = orgSizeMidpoint(answers.orgSize);

  return <>
    <p className="ai-eyebrow">Your estimate</p>
    <h1 className="ai-result-headline" ref={headingRef} tabIndex={-1}>
      About <RollingNumber value={low} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={likely} format={(n) => roundHoursLabel(n)} /> hours a week
    </h1>
    <p className="ai-result-sub">across the areas you picked</p>
    <p className="ai-note">This estimate is based on the people you entered. Most of it comes from one person's time in each area.</p>

    <div className="ai-stat-tiles">
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Hours a week</span>
        <strong><RollingNumber value={low} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={likely} format={(n) => roundHoursLabel(n)} /></strong>
      </div>
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Hours a year</span>
        <strong><RollingNumber value={low * weeks} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={likely * weeks} format={(n) => roundHoursLabel(n)} /></strong>
      </div>
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Potential staff time value</span>
        <strong><RollingNumber value={valueLow} format={(n) => money(roundDollars(n))} /> to <RollingNumber value={valueLikely} format={(n) => money(roundDollars(n))} /> <span className="ai-stat-suffix">a year</span></strong>
      </div>
    </div>

    <div className="ai-eq ai-eq--result" role="img" aria-label={`${areaHoursLabel(low)} hours a week, up to ${roundHoursLabel(likely)}, times ${weeks} working weeks equals ${roundHoursLabel(low * weeks)} hours a year, up to ${roundHoursLabel(likely * weeks)}. At ${money(rate)} an hour that is ${money(roundDollars(valueLow))} a year in potential staff time value, up to ${money(roundDollars(valueLikely))}.`}>
      <div className="ai-term ai-hrs">
        <strong><RollingNumber value={low} format={areaHoursLabel} /></strong>
        <span className="ai-term-unit">hrs/week</span>
        <span className="ai-term-low">up to <RollingNumber value={likely} format={areaHoursLabel} /></span>
      </div>
      <div className="ai-op" aria-hidden="true">&times;</div>
      <div className="ai-term ai-term--editable">
        <CompactField value={weeks} onChange={onWeeks} min={20} max={52} suffix="weeks" ariaLabel="Working weeks a year" />
      </div>
      <div className="ai-op" aria-hidden="true">=</div>
      <div className="ai-term ai-hrs">
        <strong><RollingNumber value={low * weeks} format={roundHoursLabel} /></strong>
        <span className="ai-term-unit">hrs/year</span>
        <span className="ai-term-low">up to <RollingNumber value={likely * weeks} format={roundHoursLabel} /></span>
      </div>
      <div className="ai-op" aria-hidden="true">&times;</div>
      <div className="ai-term ai-term--editable">
        <CompactField value={rate} onChange={onRate} min={15} max={250} prefix="C$" suffix="/hr" ariaLabel="Employee cost per hour" />
      </div>
      <div className="ai-op" aria-hidden="true">=</div>
      <div className="ai-term ai-total">
        <strong><span className="ai-term-currency">C$</span><RollingNumber value={valueLow} format={(n) => roundDollars(n).toLocaleString('en-CA')} /></strong>
        <span className="ai-term-unit">a year, potential staff time value</span>
        <span className="ai-term-low">up to <RollingNumber value={valueLikely} format={(n) => money(roundDollars(n))} /></span>
      </div>
    </div>
    <p className="ai-note">Time for other work, not a cash saving.</p>

    {rowDetail.length > 0 && <div className="ai-area-breakdown">
      {rowDetail.map(r => <AreaBarRow key={r.area}
        label={r.area === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[r.area]}
        low={r.low} likely={r.likely} max={Math.max(likely, 1) * 1.15} />)}
    </div>}

    <section className="ai-panel ai-headcount-section" aria-labelledby="ai-headcount-title">
      <h2 id="ai-headcount-title">What if more of your team works like this?</h2>
      <GoldSlider min={1} max={500} step={1} value={headcount} onChange={setHeadcount}
        ariaLabel="Number of people" format={(n) => `${n} people`} />
      <ChipsRow ariaLabel="Quick-pick headcount"
        chips={[10, 25, 50, 100, 250].map(n => ({ label: String(n), value: n }))}
        current={headcount} onPick={(n) => setHeadcount(Math.min(peopleMax, n))} />
      <div className="ai-stat-tiles ai-stat-tiles--pair">
        <div className="ai-stat-tile">
          <span className="ai-stat-label">Hours a week across {headcount}</span>
          <strong><RollingNumber value={scaledLow} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={scaledLikely} format={(n) => roundHoursLabel(n)} /></strong>
        </div>
        <div className="ai-stat-tile">
          <span className="ai-stat-label">Potential staff time value</span>
          <strong><RollingNumber value={scaledValueLow} format={(n) => money(roundDollars(n))} /> to <RollingNumber value={scaledValueLikely} format={(n) => money(roundDollars(n))} /> <span className="ai-stat-suffix">a year</span></strong>
        </div>
      </div>

      <div className="ai-eq ai-eq--result" role="img" aria-label={`${areaHoursLabel(perPersonLow)} hours a week per person, up to ${areaHoursLabel(perPersonLikely)}, times ${headcount} people, times ${weeks} working weeks, times ${money(rate)} an hour, equals ${money(roundDollars(scaledValueLow))} a year in potential staff time value, up to ${money(roundDollars(scaledValueLikely))}.`}>
        <div className="ai-term ai-hrs">
          <strong><RollingNumber value={perPersonLow} format={areaHoursLabel} /></strong>
          <span className="ai-term-unit">hrs/week, per person</span>
          <span className="ai-term-low">up to <RollingNumber value={perPersonLikely} format={areaHoursLabel} /></span>
        </div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term">
          <strong><RollingNumber value={headcount} format={(n) => String(Math.round(n))} /></strong>
          <span className="ai-term-unit">people</span>
        </div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term">
          <strong>{weeks}</strong>
          <span className="ai-term-unit">weeks</span>
        </div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term">
          <strong><span className="ai-term-currency">C$</span>{rate}</strong>
          <span className="ai-term-unit">an hour</span>
        </div>
        <div className="ai-op" aria-hidden="true">=</div>
        <div className="ai-term ai-total">
          <strong><span className="ai-term-currency">C$</span><RollingNumber value={scaledValueLow} format={(n) => roundDollars(n).toLocaleString('en-CA')} /></strong>
          <span className="ai-term-unit">a year, potential staff time value</span>
          <span className="ai-term-low">up to <RollingNumber value={scaledValueLikely} format={(n) => money(roundDollars(n))} /></span>
        </div>
      </div>
      <p className="ai-note">An illustration that assumes each person saves about what one person in your answers does. Real results vary by role, and the plan measures what's actually there.</p>
    </section>

    {lookoutCards.length > 0 && <section className="ai-panel ai-lookout-section" aria-labelledby="ai-lookout-title">
      <h2 id="ai-lookout-title">Where to look, based on your answers</h2>
      <div className="ai-lookout-grid">
        {lookoutCards.map((card, ci) => <div className="ai-lookout-card" key={ci}>
          <h3>{card.title}</h3>
          <ul>
            {card.lines.map((line, li) => <li key={li}><CheckCircleIcon /><span>{line}</span></li>)}
          </ul>
        </div>)}
      </div>
      {areas.length > 0 && <p className="ai-note ai-lookout-also">Also worth a look: {joinList(areas.map(a => lowerFirst(AREA_LABELS[a])))}.</p>}
    </section>}

    <section className="ai-panel ai-next-steps-section" aria-labelledby="ai-next-steps-title">
      <h2 id="ai-next-steps-title">Next steps you can take this week</h2>
      <ol className="ai-next-steps-list">
        {steps.map((s, si) => <li key={si}><span className="ai-flow-num">{si + 1}</span><span>{s}</span></li>)}
      </ol>
      <CopyStepsButton steps={steps} />
    </section>

    <section className="ai-next-step">
      <p>Want to know which tasks and tools could get you there? That's what The AI Handoff Plan works out, measured against your actual work.</p>
      <p><Link className="ai-secondary" to={`/ai-handoff-plan?perPersonHours=${carryHours}&employees=${carryEmployees}`}>See how the plan works</Link></p>
      <p className="ai-note">At least 5 net hours a week found across your organization, or your fee back.</p>
    </section>

    <details className="ai-disclosure">
      <summary>How this estimate works</summary>
      <p>It's built from your numbers for a team of {answers.orgSize ? answers.orgSize.replace('+', ' or more') : 'your'} people. For each area you picked, we multiply the hours one person spends by the number of people, then by a low and a likely net rate taken from published studies of similar work. The net rate is the time saving those studies measured, minus an allowance for checking the tools' work. Where no study matches an area closely, or where you typed in your own area, we use our most conservative rate. To keep the estimate realistic, we count at most 25 hours a week per person for any one area, and at most 30 hours a week per person in total across every area. The dollar figure uses the hourly cost and working weeks shown above. This is an estimate from your answers and published studies. It isn't a promise of results or a cash saving, and your own results could land outside it.</p>
    </details>

    <button type="button" className="ai-secondary" onClick={onReview}>Review my answers</button>
    <Emblem slug="ai-opportunity-check" />
  </>;
}

function AreaBarRow({ label, low, likely, max }) {
  const lowPct = Math.max(0, Math.min(100, (low / max) * 100));
  const likelyPct = Math.max(0, Math.min(100, (likely / max) * 100));
  return (
    <div className="ai-area-bar-row">
      <span className="ai-area-bar-label">{label}</span>
      <div className="ai-area-bar-track"><div className="ai-area-bar-fill" style={{ left: `${lowPct}%`, width: `${Math.max(2, likelyPct - lowPct)}%` }} /></div>
      <span className="ai-area-bar-value">{areaHoursLabel(low)} to {areaHoursLabel(likely)} hrs/week</span>
    </div>
  );
}

// Copies the 3 next-steps as plain numbered text. Clipboard-write only (never reads). Falls back
// to a plain message if the clipboard API is unavailable or blocked, rather than failing silently.
function CopyStepsButton({ steps }) {
  const [status, setStatus] = useState('idle'); // idle | copied | failed
  async function copy() {
    const text = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 2500);
  }
  return (
    <div className="ai-copy-steps">
      <button type="button" className="ai-secondary" onClick={copy}>Copy these steps</button>
      {status === 'copied' && <span className="ai-note" role="status">Copied.</span>}
      {status === 'failed' && <span className="ai-note" role="status">Couldn't copy automatically. Select and copy the text above instead.</span>}
    </div>
  );
}

// A small inline-editable number, used in the equation strips and the tight caption line.
function CompactField({ value, onChange, min, max, prefix, suffix, ariaLabel }) {
  return (
    <span className="ai-inline-field">
      {prefix && <span className="ai-compact-unit">{prefix}</span>}
      <input type="number" inputMode="decimal" min={min} max={max} value={value} aria-label={ariaLabel}
        onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n))); }} />
      {suffix && <span className="ai-compact-unit">{suffix}</span>}
    </span>
  );
}
