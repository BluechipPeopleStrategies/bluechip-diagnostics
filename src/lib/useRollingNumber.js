import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const EASE_OUT = (t) => 1 - Math.pow(1 - t, 3);

// Animates a displayed number from its previous value to a new target whenever `target`
// changes, via requestAnimationFrame (no library). Retargeting mid-animation starts from
// whatever is currently on screen, not the original start, so dragging a slider doesn't jitter.
// prefers-reduced-motion updates instantly. Exposed as a hook so both the free-check result and
// the plan page's team calculator can share one implementation.
export function useRollingNumber(target, { duration = 420 } = {}) {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef(null);
  const fromRef = useRef(target);
  const startRef = useRef(null);

  useEffect(() => {
    const t = Number(target);
    if (!Number.isFinite(t)) return;
    if (prefersReducedMotion()) {
      setDisplay(t);
      fromRef.current = t;
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    const from = fromRef.current;
    if (from === t) return;

    function tick(now) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = EASE_OUT(p);
      setDisplay(from + (t - from) * eased);
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(t);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export { prefersReducedMotion };
