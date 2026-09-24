import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  questions, isComplete, toggleMulti, computeRange, roundHoursLabel, roundDollars, money,
  suggestedAreas, AREA_LABELS, lowerFirst, joinList, groupedOptions,
  sanitizeAreaLabel, sanitizeShortText, areaLookoutLinesFor, crossCuttingCards, nextSteps,
  orgSizeMidpoint, perPersonHoursForCarry, HOURS_DISPLAY_CAP,
  PEOPLE_MAX, areaHoursLabel, areaHoursRangeLabel, isSingularHourLabel,
  defaultHoursForPicks } from '../lib/aiOpportunity';
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
  const [toolsOtherText, setToolsOtherText] = useState(''); // Q3 "Other" free text, optional
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
    const nextPicks = toggleMulti(answers[question.id] || [], value, question.options, question.maxPicks);
    setAnswers(prev => ({ ...prev, [question.id]: nextPicks }));
    if (question.id === 'areas') {
      // Per-person recalibration (2026-09-24), doc section 7.2: each newly-picked area defaults
      // to its own evidence-based typical hours, and the SUM of still-default (never manually
      // edited) areas' hours is capped at 20/week, scaled down proportionally if it would
      // otherwise exceed that -- recomputed here every time the picked set changes. An area the
      // visitor has already dragged/typed a real value for (hoursIsDefault: false) is left alone:
      // the cap applies only to defaults, never to entered numbers.
      setAreaInputs(prev => {
        const stillDefault = nextPicks.filter(a => !prev[a] || prev[a].hoursIsDefault !== false);
        const scaledDefaults = defaultHoursForPicks(stillDefault);
        const next = { ...prev };
        for (const a of nextPicks) {
          if (!next[a]) {
            next[a] = { hours: scaledDefaults[a], people: 1, hoursIsDefault: true };
          } else if (next[a].hoursIsDefault !== false) {
            next[a] = { ...next[a], hours: scaledDefaults[a] };
          }
        }
        return next;
      });
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
  const isToolsToday = question?.id === 'toolsToday';
  const isGrouped = !!question?.groups;
  const pickedRows = isAreas ? picks.map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 2, people: areaInputs[a]?.people ?? 1 })) : [];
  const livePreview = isAreas && pickedRows.some(r => r.hours > 0) ? computeRange(pickedRows, { dictation: answers.dictation }) : null;

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
        area={val} hours={areaInputs[val]?.hours ?? 2} people={areaInputs[val]?.people ?? 1}
        peopleMax={PEOPLE_MAX}
        onHoursChange={(h) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], hours: h, hoursIsDefault: false } }))}
        onPeopleChange={(p) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], people: p } }))}
        otherLabel={areaInputs[val]?.label}
        onOtherLabelChange={(l) => setAreaInputs(prev => ({ ...prev, [val]: { ...prev[val], label: l } }))}
      />}
    </div>;
  }

  return <main className="bc-page ai-funnel">
    <SiteHeader />

    {step === 'questions' && <>
      {qIndex === 0 && <div className="ai-intro-head">
        <p className="ai-eyebrow ai-intro-eyebrow">Free AI Opportunity Check</p>
        <h1 className="ai-intro-h1" ref={headingRef} tabIndex={-1}>How much time could AI give back to your team?</h1>
        <p className="ai-intro-sub">Find out roughly how many hours a week AI could give your team back. About three minutes, no email.</p>
        <img className="ai-intro-photo" alt=""
          src="/img/ai/02-free-check-1600.webp"
          srcSet="/img/ai/02-free-check-800.webp 800w, /img/ai/02-free-check-1600.webp 1600w"
          sizes="(max-width: 480px) 45vw, 220px"
          width="1600" height="1600" loading="lazy" />
        <p className="ai-note ai-intro-note">Answers stay on this page and clear when you reload. Please don't enter confidential information.</p>
      </div>}

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
          {isAreas && <p className="ai-note">Each one you pick gets its own hours and people below.</p>}
          {/* Section 8.1 (2026-09-24): a single opt-in checkbox, not a Q2 pick and never counted
              against its 6-pick cap. Ticking it either boosts the picked writing areas' likely
              rate or, if none is picked, adds dictation as its own area -- see computeRange. */}
          {isAreas && <div className="ai-dictation-check">
            <label>
              <input type="checkbox" checked={!!answers.dictation}
                onChange={() => setAnswers(prev => ({ ...prev, dictation: !prev.dictation }))} />
              <span>We'd use voice dictation for drafting</span>
            </label>
          </div>}
          {livePreview && <>
            <p className="ai-live-preview">About {areaHoursRangeLabel(livePreview.low, livePreview.likely)} hours a week back, so far.</p>
            <div className="ai-live-preview-detail">
              {livePreview.rows.map(r => {
                const rowLabel = r.area === 'dictation' ? 'Voice dictation'
                  : r.area === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[r.area];
                const lowPct = Math.round(r.rate.low * 100);
                const likelyPct = Math.round(r.rate.likely * 100);
                const rangeLabel = areaHoursRangeLabel(r.low, r.likely);
                return <p className="ai-note" key={r.area}>
                  {rowLabel}: {r.hours} hrs &times; {r.people} {r.people === 1 ? 'person' : 'people'} &times; {lowPct}% to {likelyPct}% = {rangeLabel} {isSingularHourLabel(rangeLabel) ? 'hr' : 'hrs'} back a week{r.dictationApplied ? ' + dictation' : ''}
                </p>;
              })}
              <p className="ai-note">The percentages are the share of that time AI can realistically save after someone checks its work.</p>
            </div>
          </>}
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
  const rows = (answers.areas || []).map(a => ({ area: a, hours: areaInputs[a]?.hours ?? 2, people: areaInputs[a]?.people ?? 1 }));
  const dictationOpts = { dictation: !!answers.dictation };
  const { low, likely, rows: rowDetail } = computeRange(rows, dictationOpts);
  const areas = suggestedAreas(answers.orgType, answers.areas || []);
  const valueLow = low * rate * weeks;
  const valueLikely = likely * rate * weeks;

  // Per-person recalibration (2026-09-24), doc section 7: what ONE person doing this exact mix
  // of picked areas and hours would save, ignoring however many people were entered per area
  // (the doc's own profiles -- writing-heavy, office generalist, etc. -- are single-person sums,
  // never divided or multiplied by a headcount). This is the headline figure and the one the
  // team-size multiplier below scales; the people-weighted `low`/`likely` above still drives the
  // stat tiles, main equation and per-area breakdown, which reflect what was actually entered.
  const personRows = rows.map(r => ({ ...r, people: 1 }));
  const { low: personLow, likely: personLikely } = computeRange(personRows, dictationOpts);

  const areaCards = (answers.areas || []).map(a => ({
    title: a === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[a],
    lines: areaLookoutLinesFor(a, answers),
  }));
  const lookoutCards = [...areaCards, ...crossCuttingCards(answers)];
  const topArea = rows[0]?.area;
  const topAreaLabel = topArea ? (topArea === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : lowerFirst(AREA_LABELS[topArea])) : null;
  const steps = nextSteps(answers, topAreaLabel);

  const peopleMax = PEOPLE_MAX;
  // "Across 100 people who work like this" (doc section 7.5's recommendation): defaults to 100,
  // not the org-size midpoint -- this is a "what if a group this size all worked like you"
  // illustration, not a claim about your actual headcount.
  const [headcount, setHeadcount] = useState(100);
  const scaledLow = Math.min(HOURS_DISPLAY_CAP, personLow * headcount);
  const scaledLikely = Math.min(HOURS_DISPLAY_CAP, personLikely * headcount);
  const scaledValueLow = scaledLow * rate * weeks;
  const scaledValueLikely = scaledLikely * rate * weeks;

  const carryHours = perPersonHoursForCarry(rows);
  const carryEmployees = orgSizeMidpoint(answers.orgSize);

  return <>
    <p className="ai-eyebrow">Your estimate</p>
    <h1 className="ai-result-headline" ref={headingRef} tabIndex={-1}>
      About <RollingNumber value={personLow} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={personLikely} format={(n) => roundHoursLabel(n)} /> hours a week for one person
    </h1>
    <p className="ai-result-sub">if AI is used across all of this work</p>
    <p className="ai-note ai-across-people">
      Across <RollingNumber value={headcount} format={(n) => String(Math.round(n))} /> people who work like this: about{' '}
      <RollingNumber value={scaledLow} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={scaledLikely} format={(n) => roundHoursLabel(n)} /> hours a week
    </p>

    <div className="ai-stat-tiles">
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Hours a week entered</span>
        <strong><RollingNumber value={low} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={likely} format={(n) => roundHoursLabel(n)} /></strong>
      </div>
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Hours a year entered</span>
        <strong><RollingNumber value={low * weeks} format={(n) => roundHoursLabel(n)} /> to <RollingNumber value={likely * weeks} format={(n) => roundHoursLabel(n)} /></strong>
      </div>
      <div className="ai-stat-tile">
        <span className="ai-stat-label">Potential staff time value</span>
        <strong><RollingNumber value={valueLow} format={(n) => money(roundDollars(n))} /> to <RollingNumber value={valueLikely} format={(n) => money(roundDollars(n))} /> <span className="ai-stat-suffix">a year</span></strong>
      </div>
    </div>
    <p className="ai-note">These reflect the people you entered per area above. Most of it comes from one person's time in each area.</p>
    {personLikely < 5 && <p className="ai-note ai-under-five">This counts only the people you entered. When several people do the same task, the hours can add up quickly, and the team slider below shows what that looks like.</p>}

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
        label={r.area === 'dictation' ? 'Voice dictation'
          : r.area === 'otherArea' ? sanitizeAreaLabel(areaInputs.otherArea?.label) : AREA_LABELS[r.area]}
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

      <div className="ai-eq ai-eq--result" role="img" aria-label={`${areaHoursLabel(personLow)} hours a week per person, up to ${areaHoursLabel(personLikely)}, times ${headcount} people, times ${weeks} working weeks, times ${money(rate)} an hour, equals ${money(roundDollars(scaledValueLow))} a year in potential staff time value, up to ${money(roundDollars(scaledValueLikely))}.`}>
        <div className="ai-term ai-hrs">
          <strong><RollingNumber value={personLow} format={areaHoursLabel} /></strong>
          <span className="ai-term-unit">hrs/week, per person</span>
          <span className="ai-term-low">up to <RollingNumber value={personLikely} format={areaHoursLabel} /></span>
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
      <p>For each area you picked, we take the hours one person spends on it each week, multiply by the number of people who do that work, then multiply by the share of that time AI can realistically save. That share comes from published studies of similar work, minus an allowance for checking the tools' work. Where no study matches closely, or you typed your own area, we use our most conservative rate. Until you set your own hours, we start from a typical figure for that kind of work, taken from published time-use research, and keep the total of those starting figures to at most 20 hours a week; your own numbers are never capped that way. If you said you'd use voice dictation for drafting, we add a small allowance to the areas that involve drafting text. Then we add the areas together. To keep it realistic, we count at most 25 hours a week per person for any one area, and 30 hours a week per person across all areas. The dollar figure uses the hourly cost and working weeks shown above. It's an estimate, not a promise of results or a cash saving.</p>
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
