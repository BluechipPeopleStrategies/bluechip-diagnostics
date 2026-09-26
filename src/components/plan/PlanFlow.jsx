import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/motion';
import GlassPanel from '../glass/GlassPanel';

// "How it works, and what you get" (punch list item 36, 2026-09-25). Same five steps and copy as
// before, now a lit track the visitor travels along: the connector draws itself as the section
// scrolls through the viewport, each step's coin lights as the line reaches it, and tiles lift on
// hover. Progress is written straight to CSS custom properties / data attributes (no React
// state), so scrolling never re-renders. Without JS, in tests, or under reduced motion the track
// is simply drawn in full and every step is shown at rest.
// Combined with #50 (2026-09-26, decision D7): each tile is #50's glass step card, with its step
// icon and #50's copy; on the plasma path the WebGL surface draws the tile, so the hover lift and
// the scroll offset apply only on the CSS glass path (see plan.css).
export default function PlanFlow({ steps }) {
  const ref = useRef(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') return undefined;
    const items = Array.from(list.querySelectorAll('.plan-flow-step'));
    list.dataset.motion = 'on';
    let raf = 0;
    let best = 0; // the line only ever draws forward: scrolling back up never un-draws it
    const update = () => {
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the list's top reaches 85% down the viewport, 1 when its bottom passes 60%.
      const start = vh * 0.85;
      const span = Math.max(1, r.height + vh * 0.25);
      best = Math.max(best, Math.min(1, (start - r.top) / span));
      const p = best;
      list.style.setProperty('--flow-p', p.toFixed(4));
      const reached = p * (items.length - 1) + 0.02;
      items.forEach((li, i) => { li.dataset.reached = i <= reached ? 'true' : 'false'; });
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="plan-flow" ref={ref}>
      <div className="plan-flow-track" aria-hidden="true"><span className="plan-flow-fill" /><span className="plan-flow-head" /></div>
      <ol className="plan-flow-list">
        {steps.map((s, i) => (
          <li className={`plan-flow-step${s.key ? ' plan-flow-step--key' : ''}`} key={s.name} style={{ '--i': i }}>
            <span className="plan-flow-coin" aria-hidden="true"><span>{i + 1}</span></span>
            <GlassPanel className="glass-panel plan-flow-tile"
              plasma={s.key ? { radius: 14, tint: '#4A3A14', opacity: 0.5, elevation: 0.55, fuse: false } : { radius: 14, opacity: 0.5, fuse: false }}>
              <span className="visually-hidden">Step {i + 1}: </span>
              {s.Icon && <s.Icon className="ai-flow-icon" />}
              <p className="ai-flow-time">{s.time}</p>
              <p className="ai-flow-name">{s.name}</p>
              <p className="ai-flow-you-get"><span>You get</span> {s.youGet}</p>
            </GlassPanel>
          </li>
        ))}
      </ol>
    </div>
  );
}
