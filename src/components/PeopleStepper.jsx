import ChipsRow from './ChipsRow';

const DEFAULT_CHIPS = [
  { label: '1', value: 1, test: (p) => p === 1 },
  { label: '2 to 5', value: 3, test: (p) => p >= 2 && p <= 5 },
  { label: '6 to 10', value: 8, test: (p) => p >= 6 && p <= 10 },
  { label: '11 to 25', value: 18, test: (p) => p >= 11 && p <= 25 },
  { label: '26+', value: 30, test: (p) => p >= 26 },
];

// A clickable +/- stepper plus quick-pick chips, for a "how many people" input. Each chip sets a
// representative value; the stepper fine-tunes from there.
export default function PeopleStepper({ label, value, max, onChange, chips = DEFAULT_CHIPS }) {
  function set(n) {
    onChange(Math.min(max, Math.max(1, n)));
  }
  return (
    <div className="ai-people-field">
      <span className="ai-people-label">{label}</span>
      <div className="ai-people-stepper">
        <button type="button" aria-label="Fewer people" onClick={() => set(value - 1)} disabled={value <= 1}>&minus;</button>
        <span className="ai-people-count" aria-live="polite">{value}</span>
        <button type="button" aria-label="More people" onClick={() => set(value + 1)} disabled={value >= max}>+</button>
      </div>
      <ChipsRow chips={chips} current={value} onPick={set} ariaLabel={`${label} quick picks`} />
    </div>
  );
}
