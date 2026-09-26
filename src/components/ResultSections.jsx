import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AreaIcon from './AreaIcon';
import { FcIcon, LensBullet, MagnifierMark } from './FreeCheckIcons';
import { areaWeeklyLabel } from '../lib/aiOpportunity';

// Result-screen sections for the free check, rebuilt 2026-09-25 (items 52, 55, 56, 57). Copy is
// unchanged unless the report says otherwise; this is structure and craft.

// Adds `is-in` once the element scrolls into view, so its entrance motion plays where the visitor
// actually sees it. No IntersectionObserver (old browsers, jsdom) means "already in view".
function useRevealOnce() {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window));
  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);
  return [ref, shown];
}

// Item 52: the per-area bars. Each bar is a range band from the low to the likely estimate,
// drawn in with a stagger when it comes into view, with a slow sheen and an end-cap marker.
export function TimeBars({ rows, max, labelFor }) {
  const [ref, shown] = useRevealOnce();
  return (
    <section className={`ai-fc-bars ${shown ? 'is-in' : ''}`} ref={ref} aria-labelledby="ai-fc-bars-title">
      <div className="ai-fc-bars-head">
        <span className="ai-fc-bars-icon" aria-hidden="true"><FcIcon name="clock" /></span>
        <div>
          <h2 id="ai-fc-bars-title" className="ai-fc-bars-title">Time for other work, not a cash saving.</h2>
          <p className="ai-note ai-fc-bars-legend">Each bar runs from the low estimate to the likely one.</p>
        </div>
      </div>
      <div className="ai-area-breakdown">
        {rows.map((r, i) => {
          const lowPct = Math.max(0, Math.min(100, (r.low / max) * 100));
          const likelyPct = Math.max(0, Math.min(100, (r.likely / max) * 100));
          return (
            <div className="ai-area-bar-row" key={r.area} style={{ '--i': i }}>
              <span className="ai-area-bar-label"><AreaIcon area={r.area} className="ai-fc-bar-icon" />{labelFor(r.area)}</span>
              <div className="ai-area-bar-track">
                <div className="ai-area-bar-fill" style={{ left: `${lowPct}%`, width: `${Math.max(2, likelyPct - lowPct)}%` }}>
                  <span className="ai-fc-bar-sheen" aria-hidden="true" />
                </div>
                <span className="ai-fc-bar-cap" aria-hidden="true" style={{ left: `${likelyPct}%` }} />
              </div>
              <span className="ai-area-bar-value">{areaWeeklyLabel(r.low, r.likely)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const CROSS_ICONS = { 'Information handling': 'shield', 'Tools you already have': 'tools', "Who'll run it": 'person' };

// Item 55: "Where to look", with a magnifier motif: a lens beside the heading whose glint sweeps
// across, each card's icon held inside a lens, and lens bullets on the "look for" lines.
export function LookoutSection({ cards, alsoLine }) {
  const [ref, shown] = useRevealOnce();
  return (
    <section className={`ai-panel ai-lookout-section ai-fc-lookout ${shown ? 'is-in' : ''}`} ref={ref} aria-labelledby="ai-lookout-title">
      <div className="ai-fc-lookout-head">
        <MagnifierMark />
        <h2 id="ai-lookout-title">Where to look, based on your answers</h2>
      </div>
      <div className="ai-lookout-grid">
        {cards.map((card, ci) => (
          <div className="ai-lookout-card" key={ci} style={{ '--i': ci }}>
            <div className="ai-fc-lookout-card-head">
              <span className="ai-fc-lens" aria-hidden="true">
                {card.area ? <AreaIcon area={card.area} className="ai-fc-lens-icon" /> : <FcIcon name={CROSS_ICONS[card.title] || 'list'} className="ai-fc-lens-icon" />}
              </span>
              <h3>{card.title}</h3>
            </div>
            <p className="ai-fc-lookfor">Look for</p>
            <ul>
              {card.lines.map((line, li) => <li key={li}><LensBullet /><span>{line}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
      {alsoLine && <p className="ai-note ai-lookout-also">{alsoLine}</p>}
    </section>
  );
}

// Item 56: next steps as a connected sequence of struck-gold medallions.
export function NextStepsSection({ steps }) {
  const [ref, shown] = useRevealOnce();
  return (
    <section className={`ai-panel ai-next-steps-section ai-fc-steps ${shown ? 'is-in' : ''}`} ref={ref} aria-labelledby="ai-next-steps-title">
      <h2 id="ai-next-steps-title">Next steps you can take this week</h2>
      <ol className="ai-next-steps-list">
        {steps.map((s, si) => (
          <li key={si} style={{ '--i': si }}>
            <span className="ai-fc-medal" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <defs>
                  <linearGradient id={`aiFcMedalRim${si}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f7e3a6" />
                    <stop offset=".5" stopColor="#c9a24b" />
                    <stop offset="1" stopColor="#8a6a25" />
                  </linearGradient>
                  <radialGradient id={`aiFcMedalFace${si}`} cx="50%" cy="30%" r="75%">
                    <stop offset="0" stopColor="#23406a" />
                    <stop offset="1" stopColor="#0b1a33" />
                  </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="22" fill={`url(#aiFcMedalRim${si})`} />
                <circle cx="24" cy="24" r="18.2" fill={`url(#aiFcMedalFace${si})`} />
                <circle cx="24" cy="24" r="18.2" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1" />
                <circle cx="24" cy="24" r="15.4" fill="none" stroke="#c9a24b" strokeOpacity=".45" strokeWidth=".8" strokeDasharray="1.2 2.2" />
                <path d="M9.5 17a16 16 0 0 1 11-9.3" fill="none" stroke="#fff8e1" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="ai-fc-medal-num">{si + 1}</span>
            </span>
            <span className="ai-fc-step-text">{s}</span>
          </li>
        ))}
      </ol>
      <CopyStepsButton steps={steps} />
    </section>
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
      <button type="button" className="ai-secondary ai-fc-chip-button" onClick={copy}><FcIcon name="copy" />Copy these steps</button>
      {status === 'copied' && <span className="ai-note" role="status">Copied.</span>}
      {status === 'failed' && <span className="ai-note" role="status">Couldn't copy automatically. Select and copy the text above instead.</span>}
    </div>
  );
}

// Item 57: the closing next step, built out as one designed block (headline, the plan link as a
// glass button rather than a gold CTA, the guarantee as a sealed line) with the estimate's
// method disclosure attached underneath instead of floating on its own.
export function ClosingNextStep({ planHref, children }) {
  return (
    <section className="ai-next-step ai-fc-close" aria-labelledby="ai-fc-close-title">
      <div className="ai-fc-close-body">
        <p className="ai-eyebrow ai-fc-close-eyebrow">Your next step</p>
        <h2 id="ai-fc-close-title" className="ai-fc-close-title">Want to know which tasks and tools could get you there?</h2>
        <p className="ai-fc-close-copy">That's what The AI Handoff Plan works out, measured against your actual work.</p>
        <p className="ai-fc-close-cta-row"><Link className="ai-secondary ai-fc-cta" to={planHref}>See how the plan works<FcIcon name="arrow" className="ai-fc-cta-arrow" /></Link></p>
        <p className="ai-note ai-fc-seal"><span className="ai-fc-seal-icon" aria-hidden="true"><FcIcon name="shield" /></span><span>At least 3 net hours a week found across your organization, or your fee back.</span></p>
      </div>
      <div className="ai-fc-close-art" aria-hidden="true">
        <span className="ai-fc-sheet ai-fc-sheet--3" />
        <span className="ai-fc-sheet ai-fc-sheet--2" />
        <span className="ai-fc-sheet ai-fc-sheet--1"><i /><i /><i /><i /><b /></span>
      </div>
      <div className="ai-fc-close-foot">{children}</div>
    </section>
  );
}
