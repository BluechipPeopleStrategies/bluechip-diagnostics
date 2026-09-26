import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/motion';

// Hero art for the plan page (punch list item 35, 2026-09-25). The render used to sit in a
// bordered, rounded frame; it is now feathered into the page ground (radial mask), and animated
// in layers that stay locked to the render itself:
//   - the frosted AI cube breathes light, a spark travels its wires into the gold cube, and the
//     glow then hands off along the row of cubes (an 8s loop, SVG overlay in the image's own
//     1600x1073 coordinate space, so it tracks the render at every size);
//   - a slow light sweep crosses the scene;
//   - scroll parallax and a small pointer tilt move the whole stage in 3D.
// prefers-reduced-motion: no listeners and no loops; the still render with a steady glow.
const ROW_CUBES = [
  { cx: 1265, cy: 700, delay: 0 },
  { cx: 1420, cy: 760, delay: 0.35 },
  { cx: 1545, cy: 820, delay: 0.7 },
];

export default function PlanHeroArt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') return undefined;
    el.dataset.motion = 'on';
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        el.style.setProperty('--plan-par', p.toFixed(3));
      });
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--plan-tx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty('--plan-ty', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    const onLeave = () => { el.style.setProperty('--plan-tx', '0'); el.style.setProperty('--plan-ty', '0'); };
    window.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="plan-hero-art" ref={ref} aria-hidden="true">
      <div className="plan-hero-tilt">
        <div className="plan-hero-stage">
          <img className="plan-hero-img" alt=""
            src="/img/ai/01-plan-hero-1600.webp"
            srcSet="/img/ai/01-plan-hero-800.webp 800w, /img/ai/01-plan-hero-1600.webp 1600w"
            sizes="(max-width: 700px) 100vw, 44vw"
            width="1600" height="1073" fetchpriority="high" />
          <svg className="plan-hero-fx" viewBox="0 0 1600 1073" preserveAspectRatio="xMidYMid meet" focusable="false">
            <defs>
              <radialGradient id="planGlowWhite">
                <stop offset="0" stopColor="#fff6e0" stopOpacity=".85" />
                <stop offset=".45" stopColor="#f0d99a" stopOpacity=".28" />
                <stop offset="1" stopColor="#f0d99a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="planGlowGold">
                <stop offset="0" stopColor="#ffe7a6" stopOpacity=".9" />
                <stop offset=".5" stopColor="#c9a24b" stopOpacity=".3" />
                <stop offset="1" stopColor="#c9a24b" stopOpacity="0" />
              </radialGradient>
              <filter id="planSpark" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <ellipse className="plan-hero-glow plan-hero-glow--ai" cx="795" cy="505" rx="300" ry="270" fill="url(#planGlowWhite)" />
            <ellipse className="plan-hero-glow plan-hero-glow--gold" cx="1112" cy="712" rx="250" ry="215" fill="url(#planGlowGold)" />
            {ROW_CUBES.map(c => (
              <ellipse key={c.cx} className="plan-hero-glow plan-hero-glow--row" cx={c.cx} cy={c.cy} rx="120" ry="90"
                fill="url(#planGlowGold)" style={{ '--d': `${c.delay}s` }} />
            ))}
            <g filter="url(#planSpark)">
              <path className="plan-hero-wire" pathLength="100" d="M 905 468 C 985 500, 945 650, 1004 700" />
              <path className="plan-hero-wire plan-hero-wire--2" pathLength="100" d="M 915 520 C 975 560, 955 668, 1004 718" />
            </g>
          </svg>
          <div className="plan-hero-sweep" />
        </div>
      </div>
      <div className="plan-hero-motes">
        <i /><i /><i /><i /><i />
      </div>
    </div>
  );
}
