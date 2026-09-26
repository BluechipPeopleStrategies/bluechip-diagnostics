import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/motion';

// "Look inside the plan" (punch list item 37, 2026-09-25): the bare five-item list becomes a
// stylised plan document, so a prospect can see the SHAPE of the deliverable. Everything inside
// the page is an illustration of structure only: grey bars stand in for text, and the few words
// on it are generic labels, never a client name, a tool name or a number presented as a result.
// The section titles are real text (#50's list: six sections, the fifth on the 2026-09-25 scope
// and the sixth naming the one place to start); the sketches are aria-hidden.
// The page assembles section by section as it scrolls into view (skipped under reduced motion).
const Bars = ({ widths }) => (
  <span className="plan-doc-bars" aria-hidden="true">
    {widths.map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}
  </span>
);

const SECTIONS = [
  {
    title: 'Current workflow and evidence',
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--flow" aria-hidden="true">
        <b>Step</b><em /><b>Step</b><em /><b>Handoff</b><em /><b>Step</b>
      </span>
    ),
  },
  {
    title: 'Recommended tool and alternatives',
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--tools" aria-hidden="true">
        <b className="is-pick"><span className="plan-doc-tick">&#10003;</span>Recommended</b>
        <b>Alternative</b>
        <b>Alternative</b>
      </span>
    ),
  },
  {
    title: 'Baseline time, expected review time and net savings',
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--time" aria-hidden="true">
        <span><small>Baseline</small><i style={{ width: '92%' }} /></span>
        <span><small>Review</small><i className="is-review" style={{ width: '24%' }} /></span>
        <span><small>Net</small><i className="is-net" style={{ width: '48%' }} /></span>
      </span>
    ),
  },
  {
    title: 'Costs, permissions and setup effort',
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--table" aria-hidden="true">
        <span><small>Costs</small><i style={{ width: '58%' }} /></span>
        <span><small>Permissions</small><i style={{ width: '72%' }} /></span>
        <span><small>Setup</small><i style={{ width: '44%' }} /></span>
      </span>
    ),
  },
  {
    // Scope (Thomas, 2026-09-25): key workflows talked through, not one workflow redesigned.
    // A few workflow rows, each ending in its own small first-step marker.
    title: "Your key workflows talked through, with where AI fits and where it doesn't, and a first step for each",
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--walk" aria-hidden="true">
        <span><small>Workflow</small><i style={{ width: '58%' }} /><b className="plan-doc-first">First step<em /></b></span>
        <span><small>Workflow</small><i style={{ width: '44%' }} /><b className="plan-doc-first">First step<em /></b></span>
        <span><small>Workflow</small><i style={{ width: '66%' }} /><b className="plan-doc-first">First step<em /></b></span>
      </span>
    ),
  },
  {
    // Panel condition (2026-09-25): the plan names the one place to start.
    title: 'The one recommendation to start with',
    sketch: (
      <span className="plan-doc-sketch plan-doc-sketch--start" aria-hidden="true">
        <b className="plan-doc-flag"><span className="plan-doc-tick">&#9873;</span>Start here</b>
        <i style={{ width: '54%' }} />
      </span>
    ),
  },
];

export default function PlanInside() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') return undefined;
    el.dataset.motion = 'on';
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { el.dataset.shown = 'true'; io.disconnect(); } });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="plan-inside" aria-labelledby="plan-inside-title" ref={ref}>
      <div className="plan-inside-intro">
        <p className="ai-eyebrow">What you receive</p>
        <h2 id="plan-inside-title">Look inside the plan</h2>
        <p className="plan-inside-tag"><span aria-hidden="true" className="plan-inside-tag-dot" />Illustrative structure, not a client result.</p>
        <p className="plan-inside-note">No savings figure is assigned until the actual work has been assessed.</p>
      </div>

      <div className="plan-doc-scene">
        <div className="plan-doc-sheet plan-doc-sheet--back2" aria-hidden="true" />
        <div className="plan-doc-sheet plan-doc-sheet--back1" aria-hidden="true" />
        <div className="plan-doc">
          <div className="plan-doc-head" aria-hidden="true">
            <span className="plan-doc-mark">The AI Handoff Plan</span>
            <span className="plan-doc-stamp">Illustrative</span>
            <Bars widths={[62, 38]} />
          </div>
          <ol className="plan-doc-sections">
            {SECTIONS.map((s, i) => (
              <li className="plan-doc-section" key={s.title} style={{ '--i': i }}>
                <span className="plan-doc-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="plan-doc-body">
                  <span className="plan-doc-title">{s.title}</span>
                  {s.sketch}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
