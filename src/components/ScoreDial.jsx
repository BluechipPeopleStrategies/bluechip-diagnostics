import { useEffect, useState } from 'react';

function useCountUp(target, ms = 1100) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [v, setV] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setV(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);
  return v;
}

// Overall score ring (0-100). The number counts up; the arc follows it.
export default function ScoreDial({ value }) {
  const shown = useCountUp(value);
  const r = 64;
  const c = 2 * Math.PI * r;
  return (
    <figure className="bc-dial" aria-label={`Overall score ${value} out of 100`}>
      <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
        <defs>
          <linearGradient id="bcDialGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d99a" />
            <stop offset="1" stopColor="#b8913f" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} className="bc-dial-track" />
        <circle cx="80" cy="80" r={r} className="bc-dial-arc" stroke="url(#bcDialGold)"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} transform="rotate(-90 80 80)" />
      </svg>
      <figcaption><strong>{shown}</strong><span>/100</span></figcaption>
    </figure>
  );
}
