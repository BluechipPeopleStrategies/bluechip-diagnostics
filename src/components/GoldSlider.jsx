// A styled native range slider: gold fill tracking the thumb, and a floating value bubble that
// moves with it. No library. Native range inputs are keyboard-adjustable (arrow keys) with no
// extra code, and aria-valuetext overrides the default numeric announcement.
export default function GoldSlider({ id, min, max, step = 1, value, onChange, format, ariaLabel, tooltip }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const bubbleLeft = Math.min(94, Math.max(6, pct));
  const label = format ? format(value) : String(value);
  return (
    <div className="ai-gold-slider" style={{ '--pct': `${pct}%` }}>
      <span className="ai-slider-bubble" style={{ left: `${bubbleLeft}%` }} aria-hidden="true">{label}</span>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        aria-label={ariaLabel} aria-valuetext={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {tooltip && <p className="ai-slider-tooltip">{tooltip}</p>}
    </div>
  );
}
