// A horizontal "hours a week" track: the low-to-likely band in gold, with the 5-hour guarantee
// threshold marked. Used as a live preview on the calculator step and as the large result visual.
export default function HoursRangeTrack({ low, likely, max = 30, threshold = 5, size = 'lg' }) {
  const clampPct = (n) => Math.max(0, Math.min(100, (n / max) * 100));
  const lowPct = clampPct(low);
  const likelyPct = clampPct(Math.max(likely, low));
  const thresholdPct = clampPct(threshold);
  return (
    <div className={`ai-track ai-track--${size}`} role="img"
      aria-label={`Estimated ${Math.round(low)} to ${Math.round(likely)} hours a week, out of a ${max}-hour scale, with the 5-hour guarantee threshold marked.`}>
      <div className="ai-track-rail">
        <div className="ai-track-band" style={{ left: `${lowPct}%`, width: `${Math.max(0, likelyPct - lowPct)}%` }} />
        <div className="ai-track-threshold" style={{ left: `${thresholdPct}%` }}>
          <span className="ai-track-threshold-label">5-hour guarantee line</span>
        </div>
      </div>
      <div className="ai-track-scale" aria-hidden="true"><span>0</span><span>{max} hrs / wk</span></div>
    </div>
  );
}
