// A row of quick-pick chip buttons. `chips` is [{ label, value, test? }]; the active chip is
// whichever one's `test(current)` matches (falls back to an exact value match).
export default function ChipsRow({ chips, current, onPick, ariaLabel }) {
  return (
    <div className="ai-chips-row" role="group" aria-label={ariaLabel}>
      {chips.map((chip) => {
        const active = chip.test ? chip.test(current) : chip.value === current;
        return (
          <button type="button" key={chip.label} className={active ? 'is-active' : ''}
            aria-pressed={active} onClick={() => onPick(chip.value)}>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
