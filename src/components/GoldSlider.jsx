import { useState } from 'react';

// A styled native range slider: gold fill tracking the thumb, and a floating value bubble that
// moves with it. No library. Native range inputs are keyboard-adjustable (arrow keys, Home/End
// jump to min/max) with no extra code; PageUp/PageDown get an explicit handler below because the
// browser-default page step isn't guaranteed to be 5. `ticks` (optional array of numbers within
// [min,max]) renders small marks with labels under the track.
export default function GoldSlider({ id, min, max, step = 1, value, onChange, format, ariaLabel, tooltip, ticks, pageStep = 5 }) {
  const [dragging, setDragging] = useState(false);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const bubbleLeft = Math.min(94, Math.max(6, pct));
  const label = format ? format(value) : String(value);

  function clamp(n) {
    return Math.min(max, Math.max(min, n));
  }
  function handleKeyDown(e) {
    if (e.key === 'PageUp') {
      e.preventDefault();
      onChange(clamp(value + pageStep));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      onChange(clamp(value - pageStep));
    }
    // Home/End and the arrow keys already work natively on a range input; no code needed.
  }

  return (
    <div className={`ai-gold-slider ${dragging ? 'is-dragging' : ''}`} style={{ '--pct': `${pct}%` }}>
      <span className="ai-slider-bubble" style={{ left: `${bubbleLeft}%` }} aria-hidden="true">{label}</span>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        aria-label={ariaLabel} aria-valuetext={label}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={handleKeyDown}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        onBlur={() => setDragging(false)}
      />
      {ticks && ticks.length > 0 && <div className="ai-slider-ticks" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="ai-slider-tick" style={{ left: `${((t - min) / (max - min)) * 100}%` }}>
            <span className="ai-slider-tick-mark" />
            <span className="ai-slider-tick-label">{t}</span>
          </span>
        ))}
      </div>}
      {tooltip && <p className="ai-slider-tooltip">{tooltip}</p>}
    </div>
  );
}
