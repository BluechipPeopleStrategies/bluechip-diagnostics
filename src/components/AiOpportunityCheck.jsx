import { useEffect, useRef, useState } from 'react';
import {
  questions, isComplete, toggleMulti, computeRange, roundHoursLabel, roundDollars, money,
  suggestedAreas, AREA_LABELS, lowerFirst, joinList, groupedOptions,
  sanitizeAreaLabel, sanitizeShortText, areaLookoutLines, crossCuttingCards, nextSteps,
  orgSizeMidpoint, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
  PEOPLE_MAX, areaHoursLabel, GUARANTEE_NET_HOURS } from '../lib/aiOpportunity';
import { prefersReducedMotion } from '../lib/useRollingNumber';
import { loadCheckSession, saveCheckSession, clearCheckSession } from '../lib/freeCheckSession';
import SiteHeader from './SiteHeader';
import AreaIcon from './AreaIcon';
import AreaHoursInput from './AreaHoursInput';
import RunningTotal from './RunningTotal';
import GoldSlider from './GoldSlider';
import ChipsRow from './ChipsRow';
import RollingNumber from './RollingNumber';
import Emblem from './Emblem';
import HourglassHero from './HourglassHero';
import { OrgTypeCards, SizeScale, MoodCards, TimingLine } from './ChoiceScales';
import { TimeBars, LookoutSection, NextStepsSection, ClosingNextStep } from './ResultSections';
import { AnswersSummary, KeepResults } from './KeepResults';
import './AiFunnel.css';
import './FreeCheck.css';

// Single-choice questions that get their own tactile input (items 44 + 50); every other
// question keeps the tile grid.
const CHOICE_PRESENTATIONS = { orgType: OrgTypeCards, orgSize: SizeScale, feel: MoodCards, timing: TimingLine };

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
  // Restored once from sessionStorage (item 59): leaving for the plan page and coming back, or a
  // reload, lands the visitor where they were instead of on an empty question 1.
  const [restored] = useState(() => loadCheckSession());
  const [answers, setAnswers] = useState(() => restored?.answers ?? {});
  const [qIndex, setQIndex] = useState(() => {
    const i = Number(restored?.qIndex);
    return Number.isInteger(i) && i >= 0 && i < questions.length ? i : 0;
  });
  // A session saved mid-"loading" resumes on the result: the loading beat is theatre, not work.
  const [step, setStep] = useState(() => {
    const s = restored?.step;
    if (s === 'result' || s === 'loading') return questions.every(q => isComplete(q, restored.answers)) ? 'result' : 'questions';
    return 'questions';
  }); // questions -> loading -> result
  const [areaInputs, setAreaInputs] = useState(() => restored?.areaInputs ?? {}); // { [area]: { hours, people, label? } }
  const [rate, setRate] = useState(() => restored?.rate ?? 40);
  const [weeks, setWeeks] = useState(() => restored?.weeks ?? 48);
  const [headcount, setHeadcount] = useState(() => restored?.headcount ?? null); // null = org-size default
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [ownerOtherText, setOwnerOtherText] = useState(() => restored?.ownerOtherText ?? ''); // Q9 "Someone else" free text, optional
  const [toolsOtherText, setToolsOtherText] = useState(() => restored?.toolsOtherText ?? ''); // Q3 "Other" free text, optional
  const headingRef = useRef(null);

  useEffect(() => {
    saveCheckSession({ answers, qIndex, step, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText });
  }, [answers, qIndex, step, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText]);

  function startOver() {
    clearCheckSession();
    setAnswers({}); setAreaInputs({}); setRate(40); setWeeks(48); setHeadcount(null);
    setOwnerOtherText(''); setToolsOtherText(''); setQIndex(0); setStep('questions');
  }

  const question = questions[qIndex];
  const answeredCount = questions.filter(q => isComplete(q, answers)).length;
  const allAnswered = answeredCount === questions.length;
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
  // "Review my answers" starts at question 1; a "Change" link in the answers summary jumps
  // straight to that question.
  function reviewAnswers(index = 0) {
    setStep('questions');
    setQIndex(Number.isInteger(index) && index >= 0 && index < questions.length ? index : 0);
  }

  const value = answers[question?.id];
  const picks = Array.isArray(value) ? value : [];
  const atCap = question?.maxPicks && picks.length >= question.maxPicks;
  const isAreas = question?.id === 'areas';
  const isOwner = question?.id === 'owner';
  const isToolsToday = question?.id === 'toolsToday';
  const isGrouped = !!question?.groups;
  const pickedRows = isAreas ? picks.map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 5, people: areaInputs[a]?.people ?? 1 })) : [];
  const livePreview = isAreas && pickedRows.some(r => r.hours > 0) ? computeRange(pickedRows) : null;

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
        peopleMax={PEOPLE_MAX}
        onHoursChange={(h) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], hours: h } }))}
        onPeopleChange={(p) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], people: p } }))}
        otherLabel={areaInputs[val]?.label}
        onOtherLabelChange={(l) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], label: l } }))}
      />}
    </div>;
  }

  const Presentation = question?.type === 'single' ? CHOICE_PRESENTATIONS[question.id] : null;

  return <main className="bc-page ai-funnel ai-funnel--check">
    <SiteHeader />

    {step === 'questions' && <>
      {qIndex === 0 && <div className="ai-intro-head">
        <p className="ai-eyebrow ai-intro-eyebrow">Free AI Opportunity Check</p>
        <h1 className="ai-intro-h1" ref={headingRef} tabIndex={-1}>How much time could AI give back to your team?</h1>
        <p className="ai-intro-sub">Find out roughly how many hours a week AI could give your team back. About three minutes, no email.</p>
        <HourglassHero />
        <p className="ai-note ai-intro-note">Your answers stay in this browser tab until you close it, unless you choose to email them to yourself at the end. Please don't enter confidential information.</p>
      </div>}

      <div className="ai-stepper">
        <div className="ai-stepper-progress-track" aria-hidden="true"><div className="ai-stepper-progress-fill" style={{ width: `${pct}%` }} /></div>
        <p className="ai-live" aria-live="polite">Question {qIndex + 1} of {questions.length}. {answeredCount} of {questions.length} completed.</p>

        <fieldset className="ai-stepper-question">
          <legend>{qIndex > 0 && <span className="ai-stepper-count">{qIndex + 1} / {questions.length}</span>} <span ref={qIndex > 0 ? headingRef : null} tabIndex={qIndex > 0 ? -1 : undefined}>{question.label}</span></legend>

          {Presentation && <Presentation question={question} value={value} onSelect={selectSingle} />}
          {!Presentation && <div className={`ai-options ai-options--tiles ${isAreas ? 'ai-options--areas' : ''} ${isGrouped ? 'ai-options--grouped' : ''}`} onKeyDown={question.type === 'multi' ? handleGridArrowKeys : undefined}>
            {isGrouped
              ? groupedOptions(question).flatMap((bucket, bi) => [
                bucket.label && <p className="ai-tile-group-label" key={`group-${bi}`}>{bucket.label}</p>,
                ...bucket.options.map(renderTile),
              ]).filter(Boolean)
              : question.options.map(renderTile)}
          </div>}
          {isAreas && <p className="ai-note">Each one you pick gets its own hours and people below.</p>}
          {livePreview && <RunningTotal preview={livePreview}
            labelFor={(a) => (a === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[a])} />}
          {isOwner && value === 'someoneElse' && <div className="ai-other-label-field">
            <label className="ai-hours-field-label" htmlFor="owner-other-text">Who is it? (a role is fine, e.g. finance lead)</label>
            <input id="owner-other-text" type="text" className="ai-compact-text-input" maxLength={60}
              value={ownerOtherText} onChange={(e) => setOwnerOtherText(e.target.value)} />
            {sanitizeShortText(ownerOtherText) && <p className="ai-note">You said: {sanitizeShortText(ownerOtherText)}</p>}
          </div>}
          {isToolsToday && picks.includes('toolsOther') && <div className="ai-other-label-field">
            <label className="ai-hours-field-label" htmlFor="tools-other-text">What tool? (optional)</label>
            <input id="tools-other-text" type="text" className="ai-compact-text-input" maxLength={60}
              value={toolsOtherText} onChange={(e) => setToolsOtherText(e.target.value)} />
            {sanitizeShortText(toolsOtherText) && <p className="ai-note">You said: {sanitizeShortText(toolsOtherText)}</p>}
          </div>}
        </fieldset>

        <div className="ai-stepper-nav">
          <button type="button" className="ai-secondary" onClick={goBack} disabled={qIndex === 0}>Back</button>
          {/* Once every question has an answer (e.g. after "Change" from the results summary), the
              visitor can jump straight back instead of re-stepping the rest of the check. */}
          {allAnswered && <button type="button" className="ai-secondary ai-fc-back-to-results" onClick={() => setStep('result')}>Back to my results</button>}
          {question.type === 'multi' && <button type="button" className="ai-button" onClick={goNext} disabled={!isComplete(question, answers)}>
            {qIndex === questions.length - 1 ? 'See my estimate' : 'Next'}
          </button>}
        </div>
      </div>
    </>}

    {step === 'loading' && <LoadingScreen messageIndex={loadingMsgIndex} headingRef={headingRef} />}

    {step === 'result' && <ResultScreen answers={answers} areaInputs={areaInputs} rate={rate} weeks={weeks}
      ownerOtherText={ownerOtherText} toolsOtherText={toolsOtherText}
      onRate={setRate} onWeeks={setWeeks} onReview={reviewAnswers} headingRef={headingRef}
      headcount={headcount} onHeadcount={setHeadcount} onStartOver={startOver} />}
  </main>;
}

function LoadingScreen({ messageIndex, headingRef }) {
  return <div className="ai-loading" role="status" aria-live="off">
    <p className="ai-eyebrow" ref={headingRef} tabIndex={-1}>Calculating your estimate...</p>
    <div className="ai-loading-track" aria-hidden="true"><div className="ai-loading-fill" /></div>
    <p className="ai-loading-message" aria-hidden="true">{LOADING_MESSAGES[messageIndex]}</p>
  </div>;
}

function ResultScreen({ answers, areaInputs, rate, weeks, onRate, onWeeks, onReview, headingRef, headcount: headcountChoice, onHeadcount, onStartOver, ownerOtherText, toolsOtherText }) {
  const rows = (answers.areas || []).map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 5, people: areaInputs[a]?.people ?? 1 }));
  const { low, likely, rows: rowDetail } = computeRange(rows);
  const areas = suggestedAreas(answers.orgType, answers.areas || []);
  const valueLow = low * rate * weeks;
  const valueLikely = likely * rate * weeks;

  const labelFor = (a) => (a === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[a]);
  const areaCards = (answers.areas || []).map(a => ({
    area: a,
    title: labelFor(a),
    lines: areaLookoutLines(a),
  }));
  const lookoutCards = [...areaCards, ...crossCuttingCards(answers)];
  const topArea = rows[0]?.area;
  const topAreaLabel = topArea ? (topArea === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : lowerFirst(AREA_LABELS[topArea])) : null;
  const steps = nextSteps(answers, topAreaLabel);

  const peopleMax = PEOPLE_MAX;
  const totalPeopleEntered = Math.max(1, rowDetail.reduce((s, r) => s + r.people, 0));
  const defaultHeadcount = Math.min(peopleMax, orgSizeMidpoint(answers.orgSize));
  const headcount = headcountChoice ?? defaultHeadcount;
  const setHeadcount = onHeadcount;
  const perPersonLow = low / totalPeopleEntered;
  const perPersonLikely = likely / totalPeopleEntered;
  const scaledLow = Math.min(HOURS_DISPLAY_CAP, perPersonLow * headcount);
  const scaledLikely = Math.min(HOURS_DISPLAY_CAP, perPersonLikely * headcount);
  const scaledValueLow = scaledLow * rate * weeks;
  const scaledValueLikely = scaledLikely * rate * weeks;

  const carryHours = perPersonHoursForCarry(rows);
  const carryEmployees = orgSizeMidpoint(answers.orgSize);

  return <>
    <p className="ai-fc-print-only ai-fc-print-head">BlueChip People Strategies · AI Opportunity Check results, {new Date().toLocaleDateString('en-CA', { dateStyle: 'long' })}</p>
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
    {likely < GUARANTEE_NET_HOURS && <p className="ai-note ai-under-guarantee">This counts only the people you entered. When several people do the same task, the hours can add up quickly, and the team slider below shows what that looks like.</p>}

    <div className="ai-eq ai-eq--result" role="img" aria-label={`${areaHoursLabel(low)} hours a week, up to ${roundHoursLabel(likely)}, times ${weeks} working weeks equals ${roundHoursLabel(low * weeks)} hours a year, up to ${roundHoursLabel(likely * weeks)}. At ${money(rate)} an hour that is ${money(roundDollars(valueLow))} a year in potential staff time value, up to ${money(roundDollars(valueLikely))}.`}>
      <div className="ai-term ai-hrs">
        <strong><RollingNumber value={low} format={areaHoursLabel} /></strong>
        <span className="ai-term-unit">hrs/week</span>
        <span className="ai-term-low">up to <RollingNumber value={likely} format={areaHoursLabel} /></span>
      </div>
      <div className="ai-op" aria-hidden="true">&times;</div>
      <div className="ai-term ai-term--editable">
        <CompactField value={weeks} onChange={onWeeks} min={20} max={52} suffix="weeks" ariaLabel="Working weeks a year" />
        <span className="ai-term-unit ai-fc-edit-hint">You can change this</span>
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
        <span className="ai-term-unit ai-fc-edit-hint">You can change this</span>
      </div>
      <div className="ai-op" aria-hidden="true">=</div>
      <div className="ai-term ai-total">
        <strong><span className="ai-term-currency">C$</span><RollingNumber value={valueLow} format={(n) => roundDollars(n).toLocaleString('en-CA')} /></strong>
        <span className="ai-term-unit">a year, potential staff time value</span>
        <span className="ai-term-low">up to <RollingNumber value={valueLikely} format={(n) => money(roundDollars(n))} /></span>
      </div>
    </div>
    {rowDetail.length > 0 && <TimeBars rows={rowDetail} max={Math.max(likely, 1) * 1.15} labelFor={labelFor} />}

    <section className="ai-panel ai-headcount-section" aria-labelledby="ai-headcount-title">
      <h2 id="ai-headcount-title">What if more of your team saves the same amount of time?</h2>
      <GoldSlider min={1} max={500} step={1} value={headcount} onChange={setHeadcount}
        ariaLabel="How many people save the same amount of time" format={(n) => `${n} people`} />
      <ChipsRow ariaLabel="Quick-pick headcount"
        chips={[10, 25, 50, 100, 250].map(n => ({ label: String(n), value: n }))}
        current={headcount} onPick={(n) => setHeadcount(Math.min(peopleMax, n))} />
      <div className="ai-stat-tiles ai-stat-tiles--pair">
        <div className="ai-stat-tile">
          <span className="ai-stat-label">Hours a week back, {headcount} {headcount === 1 ? 'person' : 'people'}</span>
          <strong><RollingNumber value={scaledLow} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={scaledLikely} format={(n) => roundHoursLabel(n)} /></strong>
        </div>
        <div className="ai-stat-tile">
          <span className="ai-stat-label">Potential staff time value</span>
          <strong><RollingNumber value={scaledValueLow} format={(n) => money(roundDollars(n))} /> to <RollingNumber value={scaledValueLikely} format={(n) => money(roundDollars(n))} /> <span className="ai-stat-suffix">a year</span></strong>
        </div>
      </div>

      <div className="ai-eq ai-eq--result" role="img" aria-label={`${areaHoursLabel(perPersonLow)} hours a week saved per person, up to ${areaHoursLabel(perPersonLikely)}, times ${headcount} people saving the same, times ${weeks} working weeks, times ${money(rate)} an hour, equals ${money(roundDollars(scaledValueLow))} a year in potential staff time value, up to ${money(roundDollars(scaledValueLikely))}.`}>
        <div className="ai-term ai-hrs">
          <strong><RollingNumber value={perPersonLow} format={areaHoursLabel} /></strong>
          <span className="ai-term-unit">hrs/week each person saves</span>
          <span className="ai-term-low">up to <RollingNumber value={perPersonLikely} format={areaHoursLabel} /></span>
        </div>
        <div className="ai-op" aria-hidden="true">&times;</div>
        <div className="ai-term">
          <strong><RollingNumber value={headcount} format={(n) => String(Math.round(n))} /></strong>
          <span className="ai-term-unit">people saving the same</span>
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
      <p className="ai-note">An illustration: each of these people saves about the same time as one person in your answers. Real results vary by role, and the plan measures what's actually there.</p>
    </section>

    {lookoutCards.length > 0 && <LookoutSection cards={lookoutCards}
      alsoLine={areas.length > 0 ? `Also worth a look: ${joinList(areas.map(a => lowerFirst(AREA_LABELS[a])))}.` : null} />}

    <NextStepsSection steps={steps} />

    <ClosingNextStep planHref={`/ai-handoff-plan?perPersonHours=${carryHours}&employees=${carryEmployees}`}>
      <details className="ai-disclosure ai-fc-disclosure">
        <summary>How this estimate works</summary>
        <p>For each area you picked, we take the hours one person spends on it each week, multiply by the number of people who do that work, then multiply by the share of that time AI can realistically save. That share comes from published studies of similar work, minus an allowance for checking the tools' work. Where no study matches closely, or you typed your own area, we use our most conservative rate. Then we add the areas together. To keep it realistic, we count at most 25 hours a week per person for any one area, and 30 hours a week per person across all areas. The dollar figure uses the hourly cost and working weeks shown above. It's an estimate, not a promise of results or a cash saving.</p>
      </details>
    </ClosingNextStep>

    <AnswersSummary answers={answers} areaInputs={areaInputs} ownerOtherText={ownerOtherText} toolsOtherText={toolsOtherText} onEdit={onReview} />

    <KeepResults answers={answers} areaInputs={areaInputs} rate={rate} weeks={weeks} headcount={headcount}
      ownerOtherText={ownerOtherText} toolsOtherText={toolsOtherText} />

    <div className="ai-fc-result-foot">
      <button type="button" className="ai-secondary" onClick={() => onReview(0)}>Review my answers</button>
      <button type="button" className="ai-secondary ai-fc-start-over" onClick={onStartOver}>Start over</button>
    </div>
    <Emblem slug="ai-opportunity-check" />
  </>;
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
