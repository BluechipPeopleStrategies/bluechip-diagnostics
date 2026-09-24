import { useEffect, useRef } from 'react';
import ChipsRow from './ChipsRow';

const DEFAULT_CHIPS = [
  { label: '1', value: 1, test: (p) => p === 1 },
  { label: '2 to 5', value: 3, test: (p) => p >= 2 && p <= 5 },
  { label: '6 to 10', value: 8, test: (p) => p >= 6 && p <= 10 },
  { label: '11 to 25', value: 18, test: (p) => p >= 11 && p <= 25 },
  { label: '26+', value: 30, test: (p) => p >= 26 },
];

const HOLD_INITIAL_DELAY = 400; // ms before repeat kicks in, so a plain tap never double-steps
const HOLD_REPEAT_MS = 110;

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
        <HoldButton ariaLabel="Fewer people" onStep={() => set(value - 1)} disabled={value <= 1}>&minus;</HoldButton>
        <span className="ai-people-count" aria-live="polite">{value}</span>
        <HoldButton ariaLabel="More people" onStep={() => set(value + 1)} disabled={value >= max}>+</HoldButton>
      </div>
      <ChipsRow chips={chips} current={value} onPick={set} ariaLabel={`${label} quick picks`} />
    </div>
  );
}

// Press-and-hold repeat: a delay, then an interval, both cleared on release. A plain click/tap
// still does exactly one step (via onClick, which also covers keyboard Enter/Space activation,
// since that doesn't fire pointer events) -- `repeatedRef` suppresses that click's own step when
// the hold-repeat already fired at least once, so a long hold doesn't over-count by one at release.
function HoldButton({ ariaLabel, onStep, disabled, children }) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const repeatedRef = useRef(false);

  function stop() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }
  function handlePointerDown() {
    if (disabled) return;
    repeatedRef.current = false;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => { repeatedRef.current = true; onStepRef.current(); }, HOLD_REPEAT_MS);
    }, HOLD_INITIAL_DELAY);
  }
  function handleClick() {
    if (disabled) return;
    if (!repeatedRef.current) onStepRef.current();
    repeatedRef.current = false;
  }
  useEffect(() => stop, []);

  return (
    <button type="button" aria-label={ariaLabel} disabled={disabled}
      onPointerDown={handlePointerDown} onPointerUp={stop} onPointerLeave={stop}
      onBlur={stop} onClick={handleClick}>
      {children}
    </button>
  );
}
