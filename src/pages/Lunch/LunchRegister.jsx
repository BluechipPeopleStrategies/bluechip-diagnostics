import { useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader from '../../components/SiteHeader';
import Icon from './Icon';
import { SESSION, LEVELS, NEXT } from '../../data/lunchSession';
import { zonedTimeToUtc, formatInTimeZone } from '../../../shared/tz';
import { googleCalendarUrl, outlookCalendarUrl } from '../../../shared/calendarLinks';
import { buildIcs } from '../../../shared/ics';
import { NEXT_SESSION_CONSENT_LABEL } from '../../../shared/consentCopy';
import './LunchRegister.css';

const ARROW = <path d="M5 12h14M13 6l6 6-6 6" />;
const TICK = <path d="m5 12 5 5 9-10" />;
const MIC = (
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </>
);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEP_TITLES = {
  1: 'Save your seat',
  2: 'Meet you where you are',
  3: 'Make it worth your lunch',
  4: 'Where should we send the link?',
  5: "You're in",
};

function listJoin(a) {
  if (a.length < 2) return a.join('');
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

// "12:00 pm" -- lowercase am/pm to match the sketch's copy style.
function formatClock(date, timeZone) {
  const p = formatInTimeZone(date, timeZone, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${p.hour}:${p.minute} ${(p.dayPeriod || '').toLowerCase()}`;
}

function formatDateLine(date, timeZone) {
  const p = formatInTimeZone(date, timeZone, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${p.weekday}, ${p.month} ${p.day}`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange));
  }, []);
  return reduced;
}

export default function LunchRegister() {
  const reducedMotion = usePrefersReducedMotion();
  const startUtc = useMemo(() => zonedTimeToUtc(SESSION.localStart, SESSION.timeZone), []);
  const endUtc = useMemo(() => new Date(startUtc.getTime() + SESSION.durationMinutes * 60 * 1000), [startUtc]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('');
  const [form, setForm] = useState({
    topics: [SESSION.topic],
    level: 0,
    one: '',
    name: '',
    email: '',
    org: '',
    next: false,
    hp: '',
  });
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const cardWrapRef = useRef(null);
  const cardRef = useRef(null);

  // Per-route title/description/OG tags. src/lib/seo.js's usePageMeta only sets title +
  // description; OG tags are added here directly rather than extending that shared file, to
  // keep this feature's diff confined to new files (see build instructions).
  useEffect(() => {
    const title = `${SESSION.seriesTitle} | BlueChip People Strategies`;
    const description = `Free, virtual, ${SESSION.durationMinutes} minutes. ${SESSION.title}. Save your seat.`;
    const prevTitle = document.title;
    document.title = title;
    const metaSets = [
      ['meta[name="description"]', 'name', 'description', description],
      ['meta[property="og:title"]', 'property', 'og:title', title],
      ['meta[property="og:description"]', 'property', 'og:description', description],
      ['meta[property="og:image"]', 'property', 'og:image', '/linkedin-event-1280x720.png'],
      ['meta[property="og:url"]', 'property', 'og:url', 'https://bluechip-people-strategies.com/lunch'],
      ['meta[property="og:type"]', 'property', 'og:type', 'website'],
    ];
    const created = [];
    metaSets.forEach(([selector, attr, value, content]) => {
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
        created.push(tag);
      }
      tag.setAttribute('content', content);
    });
    return () => {
      document.title = prevTitle;
      created.forEach((tag) => tag.remove());
    };
  }, []);

  // Card tilt + glass sheen toward the cursor (pointer devices only, motion allowed).
  useEffect(() => {
    if (reducedMotion) return undefined;
    const fine = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const wrap = cardWrapRef.current;
    if (!fine || !wrap) return undefined;
    const tilt = wrap.querySelector('.ll-tilt');
    function onMove(e) {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (tilt) {
        tilt.classList.add('live');
        tilt.style.transform = `perspective(1400px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
      }
      const s1 = wrap.querySelector('.ll-sheet.s1');
      const s2 = wrap.querySelector('.ll-sheet.s2');
      if (s1) s1.style.translate = `${(x * -14).toFixed(1)}px ${(y * -10).toFixed(1)}px`;
      if (s2) s2.style.translate = `${(x * -24).toFixed(1)}px ${(y * -16).toFixed(1)}px`;
    }
    function onLeave() {
      if (tilt) {
        tilt.classList.remove('live');
        tilt.style.transform = '';
      }
      const s1 = wrap.querySelector('.ll-sheet.s1');
      const s2 = wrap.querySelector('.ll-sheet.s2');
      if (s1) s1.style.translate = '';
      if (s2) s2.style.translate = '';
    }
    wrap.addEventListener('pointermove', onMove, { passive: true });
    wrap.addEventListener('pointerleave', onLeave);
    return () => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion, step]);

  // Cursor spotlight (.ll-hov elements) + magnetic pull on primary buttons/links. One delegated
  // listener, matching the sketch's single document-level handler rather than per-element ones.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const fine = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return undefined;
    function onMove(e) {
      const hov = e.target.closest && e.target.closest('.ll-hov');
      if (hov) {
        const r = hov.getBoundingClientRect();
        hov.style.setProperty('--mx', `${e.clientX - r.left}px`);
        hov.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const mag = e.target.closest && e.target.closest('.ll-btn.primary,.ll-copy,.ll-offer a');
      document.querySelectorAll('.ll-btn.primary,.ll-copy,.ll-offer a').forEach((b) => {
        if (b !== mag) b.style.translate = '';
      });
      if (mag) {
        const q = mag.getBoundingClientRect();
        const tx = ((e.clientX - q.left - q.width / 2) * 0.12).toFixed(1);
        const ty = ((e.clientY - q.top - q.height / 2) * 0.25).toFixed(1);
        mag.style.translate = `${tx}px ${ty}px`;
      }
    }
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function animateOut(forward) {
    if (reducedMotion || !cardRef.current || !cardWrapRef.current) return;
    const ghost = cardRef.current.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    ghost.querySelectorAll('input,button,textarea,a,select').forEach((el) => {
      el.tabIndex = -1;
      el.disabled = true;
    });
    ghost.classList.remove('rise', 'return');
    ghost.classList.add('ghost');
    if (!forward) ghost.classList.add('back');
    ghost.style.height = `${cardRef.current.getBoundingClientRect().height}px`;
    cardWrapRef.current.appendChild(ghost);
    setTimeout(() => ghost.remove(), 950);
  }

  function goToStep(next) {
    animateOut(next > step);
    setDirection(next > step ? 'rise' : 'return');
    setStep(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailOk = EMAIL_RE.test(form.email.trim());
    setEmailInvalid(!emailOk);
    if (!emailOk) {
      document.getElementById('ll-em')?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/lunch-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          org: form.org.trim(),
          topics: form.topics,
          comfortLevel: LEVELS[form.level].n,
          oneThing: form.one,
          nextSessionConsent: form.next,
          page: '/lunch',
          bc_hp_trap: form.hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'submit_failed');
      goToStep(5);
    } catch {
      setSubmitError('Something went wrong saving your seat. Try again, or email hello@bluechip-people-strategies.com.');
    } finally {
      setSubmitting(false);
    }
  }

  const dateParts = formatInTimeZone(startUtc, SESSION.timeZone, { month: 'short', day: 'numeric', weekday: 'short' });
  const timeText = `${formatClock(startUtc, SESSION.timeZone)} to ${formatClock(endUtc, SESSION.timeZone)} MT`;

  const remaining = Math.max(0, 4 - step);
  const bars = [1, 2, 3, 4];

  if (!SESSION.registrationOpen) {
    return (
      <main className="lunch-page">
        <SiteHeader />
        <div className="ll-stage ll-stage--closed">
          <p className="ll-closed glass">Registration isn&apos;t open yet for this session. Check back soon.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="lunch-page">
      <SiteHeader />
      <div className="ll-stage">
        <div className="ll-orb a" />
        <div className="ll-orb b" />
        <div className="ll-orb c" />
        <div className="ll-gridlines" />
        <div className="ll-ring" />
        <div className="ll-grid">
          <div className="ll-info-top">
            <div className="ll-eyebrow ll-reveal" style={{ '--d': 0 }}>
              <span>Free</span>
              <i>/</i>
              <span>Virtual</span>
              <i>/</i>
              <span>{SESSION.durationMinutes} minutes</span>
              <i>/</i>
              <span>Edmonton, MT</span>
            </div>
            <h1 className="ll-reveal" style={{ '--d': 1 }}>
              The Practical AI <em>Lunch &amp; Learn</em>
            </h1>
            <p className="ll-session ll-reveal" style={{ '--d': 2 }}>
              {SESSION.title}
            </p>
            <div className="ll-when ll-glass ll-reveal ll-hov" style={{ '--d': 3 }}>
              <div className="ll-date" aria-label={`${dateParts.weekday} ${dateParts.month} ${dateParts.day}`}>
                <b>{dateParts.month.toUpperCase()}</b>
                <strong>{dateParts.day}</strong>
                <small>{dateParts.weekday.toUpperCase()}</small>
              </div>
              <div className="ll-whenlines">
                <span className="t">{timeText}</span>
                <span className="m">One live stream, on YouTube and LinkedIn at the same time. YouTube needs no account.</span>
              </div>
              {SESSION.isExample && <span className="ll-ex">Example date</span>}
            </div>
          </div>

          <div className="ll-info">
            <ol className="ll-agenda ll-glass" id="ll-agenda">
              {SESSION.agenda.map((item, i) => (
                <li key={item.title} className={`ll-hov ll-reveal ${form.topics.includes(item.topic) ? 'lit' : ''}`} style={{ '--d': i + 4 }}>
                  <span className="clock">{item.clock}</span>
                  <span className="ai-ic">
                    <Icon paths={item.icon} />
                  </span>
                  <span className="what">
                    {item.title}
                    <small>{item.sub}</small>
                  </span>
                </li>
              ))}
            </ol>

            <figure className="ll-flow ll-glass" aria-labelledby="ll-flowcap">
              <figcaption id="ll-flowcap">
                <b>{SESSION.flow.caption}</b>
                <span>{SESSION.flow.subcaption}</span>
              </figcaption>
              <ol className="ll-nodes">
                {SESSION.flow.nodes.map((node, i) => (
                  <li key={node.title} className={node.ai ? 'ai' : ''}>
                    {i > 0 && (
                      <span className="ll-seg" aria-hidden="true">
                        <i />
                      </span>
                    )}
                    <span className="node">
                      <Icon paths={node.icon} />
                    </span>
                    <b>{node.title}</b>
                    <small>{node.sub}</small>
                  </li>
                ))}
              </ol>
              <p className="ll-flow-note">{SESSION.flow.note}</p>
            </figure>

            <div className="ll-host">
              <div className="mono" aria-hidden="true">
                {SESSION.host.initials}
              </div>
              <p>
                <b>Hosted by {SESSION.host.name}</b>
                <br />
                {SESSION.host.org}
              </p>
            </div>

            <div className="ll-promise">
              {SESSION.promises.map((p) => (
                <span key={p.text} className="ll-hov">
                  <Icon paths={p.icon} />
                  {p.text}
                </span>
              ))}
            </div>
          </div>

          <div className="ll-cardwrap" ref={cardWrapRef}>
            <div className="ll-tilt">
              <div className={`ll-sheet s2 ${remaining < 2 ? 'gone' : ''}`} aria-hidden="true" />
              <div className={`ll-sheet s1 ${remaining < 1 ? 'gone' : ''}`} aria-hidden="true" />
              <form
                key={step}
                ref={cardRef}
                className={`ll-card ll-hov ${direction}`}
                noValidate
                aria-live="polite"
                onSubmit={handleSubmit}
              >
                <span className="ll-spot" aria-hidden="true" />
                <div className="ll-card-head">
                  <div className="row">
                    <h2>{STEP_TITLES[step]}</h2>
                    <span className="ll-stepno">{step <= 4 ? `Step ${step} of 4` : 'Confirmed'}</span>
                  </div>
                  <div className="ll-bar" aria-hidden="true">
                    {bars.map((b) => (
                      <i key={b} className={b <= Math.min(step, 4) ? 'on' : ''} />
                    ))}
                  </div>
                </div>
                <div className="ll-body">
                  {/* Spam trap: not "company" -- browsers autofill company-named fields, which
                      previously flagged real visitors as bots on this same form family. See
                      C:/Users/mtsli/.claude/projects/.../memory/honeypot-field-name-autofill-dropped-leads.md */}
                  <input
                    type="text"
                    name="bc_hp_trap"
                    value={form.hp}
                    onChange={(e) => updateForm({ hp: e.target.value })}
                    className="ll-hp"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  {step === 1 && <Step1Topics form={form} updateForm={updateForm} goToStep={goToStep} />}
                  {step === 2 && <Step2Comfort form={form} updateForm={updateForm} goToStep={goToStep} />}
                  {step === 3 && <Step3OneThing form={form} updateForm={updateForm} goToStep={goToStep} />}
                  {step === 4 && (
                    <Step4Details
                      form={form}
                      updateForm={updateForm}
                      goToStep={goToStep}
                      emailInvalid={emailInvalid}
                      submitting={submitting}
                      submitError={submitError}
                    />
                  )}
                  {step === 5 && <Step5Ticket form={form} startUtc={startUtc} reducedMotion={reducedMotion} />}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="ll-below">
        <span>
          <b>Free.</b> No account needed to watch. One calendar invite, one reminder, one replay if you miss it.
        </span>
      </div>
    </main>
  );
}

function Step1Topics({ form, updateForm, goToStep }) {
  function toggle(id) {
    const has = form.topics.includes(id);
    updateForm({ topics: has ? form.topics.filter((t) => t !== id) : [...form.topics, id] });
  }
  return (
    <div className="ll-step">
      <p className="q">What are you most curious about?</p>
      <p className="help">Tap as many as you like. They shape the demos and the Q&amp;A.</p>
      <fieldset className="ll-chips" aria-label="Topics">
        {SESSION.topics.map((t) => (
          <label key={t.id} className={`ll-chip ll-hov ${t.id === 'other' ? 'wide' : ''}`}>
            <input type="checkbox" checked={form.topics.includes(t.id)} onChange={() => toggle(t.id)} />
            <Icon paths={t.icon} />
            <span>{t.label}</span>
            <span className="tick">
              <svg viewBox="0 0 24 24">{TICK}</svg>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="ll-nav">
        <button type="button" className="ll-btn primary" onClick={() => goToStep(2)}>
          Next
          <svg viewBox="0 0 24 24">{ARROW}</svg>
        </button>
      </div>
      <p className="ll-skip">
        Just want the link?{' '}
        <button type="button" onClick={() => goToStep(4)}>
          Skip to your details
        </button>
      </p>
    </div>
  );
}

function Step2Comfort({ form, updateForm, goToStep }) {
  const L = LEVELS[form.level] || LEVELS[0];
  return (
    <div className="ll-step">
      <p className="q">How comfortable are you with AI today?</p>
      <p className="help">No wrong answer. It tells Thomas where to pitch the demos.</p>
      <div className="ll-level ll-hov">
        <div className="ll-lv-read">
          <span className="ll-lv-n" key={L.n}>
            {L.n}
          </span>
          <div>
            <span className="ll-lv-name">{L.name}</span>
            <span className="ll-lv-eg">{L.eg}</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={L.n}
          aria-label="Comfort with AI, 1 to 5"
          aria-valuetext={L.name}
          style={{ '--p': `${((L.n - 1) / 4) * 100}%` }}
          onChange={(e) => updateForm({ level: Number(e.target.value) - 1 })}
        />
        <div className="ll-lv-scale" aria-hidden="true">
          {LEVELS.map((x) => (
            <button type="button" key={x.n} className={x.n === L.n ? 'on' : ''} onClick={() => updateForm({ level: x.n - 1 })}>
              <span className="lvi">
                <Icon paths={x.icon} />
              </span>
              <span>{x.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="ll-fit">
        <b>What that means for you</b>
        {L.reply}
      </div>
      <div className="ll-nav">
        <button type="button" className="ll-btn ghost ll-hov" onClick={() => goToStep(1)}>
          Back
        </button>
        <button type="button" className="ll-btn primary" onClick={() => goToStep(3)}>
          Next
          <svg viewBox="0 0 24 24">{ARROW}</svg>
        </button>
      </div>
    </div>
  );
}

function topicById(id) {
  return SESSION.topics.find((t) => t.id === id) || null;
}

function Step3OneThing({ form, updateForm, goToStep }) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('Please leave out names or client details.');
  const recRef = useRef(null);

  const picks = form.topics.length ? form.topics : ['other'];
  const ideas = [];
  for (let k = 0; ideas.length < 4 && k < 3; k += 1) {
    picks.forEach((id) => {
      const t = topicById(id);
      const x = t && t.ideas[k];
      if (x && ideas.length < 4) ideas.push(x);
    });
  }

  function handleMic() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (recRef.current) {
      recRef.current.stop();
      return;
    }
    if (!SR) {
      setNote("Voice typing isn't available in this browser. Type it instead.");
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'en-CA';
      rec.interimResults = true;
      rec.continuous = false;
      const base = form.one ? form.one.replace(/\s*$/, ' ') : '';
      rec.onresult = (e) => {
        let s = '';
        for (let i = 0; i < e.results.length; i += 1) s += e.results[i][0].transcript;
        updateForm({ one: (base + s).slice(0, 200) });
      };
      rec.onerror = (e) => {
        setNote(
          e.error === 'not-allowed' || e.error === 'service-not-allowed'
            ? 'Microphone access is blocked here. Type it instead.'
            : "Didn't catch that. Try again or type it."
        );
      };
      rec.onend = () => {
        recRef.current = null;
        setListening(false);
      };
      rec.start();
      recRef.current = rec;
      setListening(true);
      setNote('Listening. Tap again to stop. Only the text is saved.');
    } catch {
      recRef.current = null;
      setNote("Voice typing couldn't start here. Type it instead.");
    }
  }

  function stopRecIfActive() {
    if (recRef.current) recRef.current.stop();
  }

  return (
    <div className="ll-step">
      <p className="q">In your own words, what do you want from this session?</p>
      <p className="help">Type it, tap an idea, or say it out loud. Thomas reads every answer before the session.</p>
      <div className="ll-ideas">
        {ideas.map((x, i) => (
          <button type="button" key={x} style={{ '--i': i }} onClick={() => updateForm({ one: x.slice(0, 200) })}>
            {x}
          </button>
        ))}
      </div>
      <div className="ll-field">
        <label htmlFor="ll-one">
          If you leave with one thing, what should it be? <span>optional</span>
        </label>
        <div className="ll-say">
          <textarea
            id="ll-one"
            maxLength={200}
            placeholder="e.g. A faster way to answer the same tenant emails"
            value={form.one}
            onChange={(e) => updateForm({ one: e.target.value.slice(0, 200) })}
          />
          <button type="button" className={`ll-mic ${listening ? 'live' : ''}`} aria-pressed={listening} onClick={handleMic}>
            <svg viewBox="0 0 24 24">{MIC}</svg>
            <span>{listening ? 'Listening' : 'Say it'}</span>
          </button>
        </div>
        <div className="ll-saybar">
          <span>{note}</span>
          <span className="count">{form.one.length} / 200</span>
        </div>
      </div>
      <div className="ll-nav">
        <button
          type="button"
          className="ll-btn ghost ll-hov"
          onClick={() => {
            stopRecIfActive();
            goToStep(2);
          }}
        >
          Back
        </button>
        <button
          type="button"
          className="ll-btn primary"
          onClick={() => {
            stopRecIfActive();
            goToStep(4);
          }}
        >
          Next
          <svg viewBox="0 0 24 24">{ARROW}</svg>
        </button>
      </div>
    </div>
  );
}

function Step4Details({ form, updateForm, goToStep, emailInvalid, submitting, submitError }) {
  return (
    <div className="ll-step">
      <p className="q">Where should we send your calendar invite?</p>
      <div className="ll-field">
        <label htmlFor="ll-nm">Your name</label>
        <input
          id="ll-nm"
          className="ll-input"
          autoComplete="name"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
        />
      </div>
      <div className="ll-field">
        <label htmlFor="ll-em">Work email</label>
        <input
          id="ll-em"
          className="ll-input"
          type="email"
          autoComplete="email"
          aria-invalid={emailInvalid}
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
        />
        {emailInvalid && (
          <p className="err">That email looks incomplete. Check for an @ and a domain, like name@company.ca.</p>
        )}
      </div>
      <div className="ll-field">
        <label htmlFor="ll-org">Organization</label>
        <input
          id="ll-org"
          className="ll-input"
          autoComplete="organization"
          value={form.org}
          onChange={(e) => updateForm({ org: e.target.value })}
        />
      </div>
      <label className="ll-consent" htmlFor="ll-nx">
        <input type="checkbox" id="ll-nx" checked={form.next} onChange={(e) => updateForm({ next: e.target.checked })} />
        <span>{NEXT_SESSION_CONSENT_LABEL}</span>
      </label>
      <div className="ll-nav">
        <button type="button" className="ll-btn ghost ll-hov" onClick={() => goToStep(3)}>
          Back
        </button>
        <button type="submit" className="ll-btn primary" disabled={submitting}>
          {submitting ? 'Saving your seat…' : 'Save my seat'}
          <svg viewBox="0 0 24 24">{ARROW}</svg>
        </button>
      </div>
      {submitError && <p className="err" role="alert">{submitError}</p>}
      <p className="fine">Free. You get one calendar invite and one reminder for this session.</p>
    </div>
  );
}

function Step5Ticket({ form, startUtc, reducedMotion }) {
  const first = (form.name || 'there').split(' ')[0];
  const L = LEVELS[form.level] || LEVELS[0];
  const [doneCal, setDoneCal] = useState({ google: false, outlook: false, apple: false });
  const [copied, setCopied] = useState(false);
  const burstRef = useRef(null);
  const liveUrl = 'https://bluechip-people-strategies.com/lunch/live';

  useEffect(() => {
    if (reducedMotion || !burstRef.current) return undefined;
    const bu = document.createElement('div');
    bu.className = 'll-burst';
    bu.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i += 1) {
      const sp = document.createElement('span');
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const d = 110 + Math.random() * 120;
      sp.className = 'll-shard';
      sp.style.setProperty('--x', `${Math.cos(a) * d}px`);
      sp.style.setProperty('--y', `${Math.sin(a) * d * 0.7 - 30}px`);
      sp.style.setProperty('--r', `${Math.random() * 540 - 270}deg`);
      sp.style.setProperty('--s', `${6 + Math.random() * 9}px`);
      bu.appendChild(sp);
    }
    burstRef.current.appendChild(bu);
    const t = setTimeout(() => bu.remove(), 1400);
    return () => {
      clearTimeout(t);
      bu.remove();
    };
    // Runs once, on mount of the confirmation step only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addGoogle() {
    window.open(
      googleCalendarUrl({
        title: SESSION.title,
        description: `Join here: ${liveUrl}`,
        location: liveUrl,
        start: startUtc,
        durationMinutes: SESSION.durationMinutes,
      }),
      '_blank',
      'noopener'
    );
    setDoneCal((d) => ({ ...d, google: true }));
  }
  function addOutlook() {
    window.open(
      outlookCalendarUrl({
        title: SESSION.title,
        description: `Join here: ${liveUrl}`,
        location: liveUrl,
        start: startUtc,
        durationMinutes: SESSION.durationMinutes,
      }),
      '_blank',
      'noopener'
    );
    setDoneCal((d) => ({ ...d, outlook: true }));
  }
  function addApple() {
    const ics = buildIcs({
      uid: `lunch-${startUtc.getTime()}-${(form.email || 'guest').replace(/[^a-z0-9]/gi, '')}@bluechip-people-strategies.com`,
      start: startUtc,
      durationMinutes: SESSION.durationMinutes,
      title: SESSION.title,
      description: `Join here: ${liveUrl}`,
      url: liveUrl,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'practical-ai-lunch-and-learn.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    setDoneCal((d) => ({ ...d, apple: true }));
  }

  function copyLink() {
    const u = `https://${NEXT.link}`;
    navigator.clipboard
      ?.writeText(u)
      .then(() => setCopied(true))
      .catch(() => setCopied(true));
  }

  return (
    <div className="ll-step">
      <div className="ll-ticket" role="img" aria-label="Your seat" ref={burstRef}>
        <div className="ll-t-top">
          <span className="ll-stamp">Seat saved</span>
          <span className="adm">Admit one · Practical AI Lunch &amp; Learn</span>
          <span className="nm">{form.name || 'Guest'}</span>
          <dl className="ll-t-grid">
            <div>
              <dt>When</dt>
              <dd>{formatDateLine(startUtc, SESSION.timeZone)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatClock(startUtc, SESSION.timeZone)} MT</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{SESSION.title.replace(/^Session \d+: /, '')}</dd>
            </div>
            <div>
              <dt>Comfort</dt>
              <dd>
                {L.n} of 5 · {L.name}
              </dd>
            </div>
          </dl>
        </div>
        <div className="ll-perf" aria-hidden="true">
          <span className="l" />
          <span className="r" />
        </div>
        <div className="ll-t-stub">
          <small>{form.one ? 'Your one thing' : 'Your picks'}</small>
          <q>{form.one || (form.topics.length ? listJoin(form.topics.map((id) => topicById(id)?.label || id)) : 'Open to anything')}</q>
        </div>
      </div>
      <p className="help" style={{ margin: 0 }}>
        {first}, your invite is on its way to <b>{form.email}</b>. Add it now so the join link is one click away.
      </p>
      <div className="ll-cal">
        <button type="button" className={doneCal.google ? 'done' : ''} onClick={addGoogle}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span>{doneCal.google ? 'Added' : 'Google'}</span>
        </button>
        <button type="button" className={doneCal.outlook ? 'done' : ''} onClick={addOutlook}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span>{doneCal.outlook ? 'Added' : 'Outlook'}</span>
        </button>
        <button type="button" className={doneCal.apple ? 'done' : ''} onClick={addApple}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span>{doneCal.apple ? 'Added' : 'Apple'}</span>
        </button>
      </div>
      <div className="ll-offer">
        <span className="k">{NEXT.kicker}</span>
        <h3>{NEXT.title}</h3>
        <p>{NEXT.body}</p>
        <div className="ll-share">
          <span className="ll-share-url">{NEXT.link}</span>
          <button type="button" className={`ll-copy ${copied ? 'done' : ''}`} onClick={copyLink}>
            {copied ? 'Copied' : NEXT.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
