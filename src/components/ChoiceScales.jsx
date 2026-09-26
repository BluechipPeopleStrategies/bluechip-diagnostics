import { OrgTypeIcon, MoodIcon, PersonGlyph } from './FreeCheckIcons';

// Varied single-choice inputs for the free check (items 44 + 50, 2026-09-25). Every one is still
// a native radio group underneath (same name, same values, same onChange), so keyboard arrows,
// screen readers, the stored answer and every downstream rule behave exactly as before; only the
// presentation changes. The radio itself is visually hidden but focusable, and the whole card
// shows the focus ring. Selected state is never colour alone: a "Selected" check badge, a
// heavier label and a raised surface all change together.
function Radio({ question, val, checked, onSelect }) {
  return <input className="ai-fc-radio" type="radio" name={question.id} value={val} checked={checked}
    onChange={() => onSelect(val)} />;
}

// Visual only: the radio's own checked state is what assistive tech announces, so the mark is
// hidden from it to avoid "Selected" being read twice. `compact` shows just the check where a
// column is too narrow for the word.
function SelectedMark({ on, compact = false }) {
  if (!on) return null;
  return <span className={`ai-fc-selected-mark ${compact ? 'is-compact' : ''}`} aria-hidden="true">&#10003;{compact ? '' : ' Selected'}</span>;
}

// Splits "Professional services (law, accounting, consulting and similar)" into a title and a
// quieter detail line, so a long option doesn't dominate its card.
function splitLabel(label) {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(label);
  return m ? [m[1], m[2]] : [label, null];
}

// Q1: illustrated organization cards.
export function OrgTypeCards({ question, value, onSelect }) {
  return (
    <div className="ai-fc-org-grid">
      {question.options.map(([val, label], i) => {
        const [title, detail] = splitLabel(label);
        const checked = value === val;
        return (
          <label key={val} className={`ai-fc-org-card ${checked ? 'is-selected' : ''}`} style={{ '--i': i }}>
            <Radio question={question} val={val} checked={checked} onSelect={onSelect} />
            <span className="ai-fc-medallion" aria-hidden="true"><OrgTypeIcon type={val} /></span>
            <span className="ai-fc-org-text">
              <span className="ai-fc-org-title">{title}</span>
              {detail && <span className="ai-fc-org-detail">{detail}</span>}
            </span>
            <SelectedMark on={checked} />
          </label>
        );
      })}
    </div>
  );
}

// Q8: organization size as a rising scale, a head count and a pillar that grow with each step.
export function SizeScale({ question, value, onSelect }) {
  const n = question.options.length;
  return (
    <div className="ai-fc-size-scale" style={{ '--n': n }}>
      {question.options.map(([val, label], i) => {
        const checked = value === val;
        const people = i + 1;
        return (
          <label key={val} className={`ai-fc-size-step ${checked ? 'is-selected' : ''}`} style={{ '--h': `${28 + (72 * i) / (n - 1)}%`, '--i': i }}>
            <Radio question={question} val={val} checked={checked} onSelect={onSelect} />
            <span className="ai-fc-size-pillar" aria-hidden="true">
              <svg className="ai-fc-size-people" viewBox={`0 0 ${people * 11} 14`} style={{ width: `${people * 11}px` }}>
                {Array.from({ length: people }, (_, k) => <PersonGlyph key={k} x={k * 11 + 0.5} />)}
              </svg>
              <span className="ai-fc-size-fill" />
            </span>
            <span className="ai-fc-size-label">{label}</span>
            <SelectedMark on={checked} compact />
          </label>
        );
      })}
    </div>
  );
}

// Q11: team feeling as weather cards.
export function MoodCards({ question, value, onSelect }) {
  return (
    <div className="ai-fc-mood-row">
      {question.options.map(([val, label], i) => {
        const checked = value === val;
        return (
          <label key={val} className={`ai-fc-mood-card ai-fc-mood--${val} ${checked ? 'is-selected' : ''}`} style={{ '--i': i }}>
            <Radio question={question} val={val} checked={checked} onSelect={onSelect} />
            <span className="ai-fc-mood-art" aria-hidden="true"><MoodIcon mood={val} /></span>
            <span className="ai-fc-mood-label">{label}</span>
            <SelectedMark on={checked} />
          </label>
        );
      })}
    </div>
  );
}

// Q12: start timing as a timeline. "Just exploring" sits off the end of the line on a dashed
// spur, because it is not a date.
export function TimingLine({ question, value, onSelect }) {
  const idx = question.options.findIndex(o => o[0] === value);
  const dated = question.options.filter(o => o[0] !== 'exploring').length;
  const onSpur = value === 'exploring';
  const fill = idx < 0 || onSpur ? 0 : idx / (dated - 1);
  return (
    <div className="ai-fc-timeline" style={{ '--fill': fill, '--dated': dated }}>
      <span className="ai-fc-timeline-rail" aria-hidden="true"><span className="ai-fc-timeline-rail-fill" /></span>
      <span className="ai-fc-timeline-spur" aria-hidden="true" />
      {question.options.map(([val, label], i) => {
        const checked = value === val;
        return (
          <label key={val} className={`ai-fc-timeline-stop ${val === 'exploring' ? 'is-spur' : ''} ${checked ? 'is-selected' : ''} ${!onSpur && idx >= 0 && i < idx ? 'is-passed' : ''}`} style={{ '--i': i }}>
            <Radio question={question} val={val} checked={checked} onSelect={onSelect} />
            <span className="ai-fc-timeline-node" aria-hidden="true"><span /></span>
            <span className="ai-fc-timeline-label">{label}</span>
            <SelectedMark on={checked} compact />
          </label>
        );
      })}
    </div>
  );
}
