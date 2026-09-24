import GoldSlider from './GoldSlider';
import PeopleStepper from './PeopleStepper';
import { HOUR_CAP_PER_AREA } from '../lib/aiOpportunity';

// The inline row that appears under a ticked Q2 area tile: hours a week for one person (a gold
// slider with a floating bubble, no separate typed box), and how many people (a stepper plus
// quick-pick chips). No caps note here -- the caps apply silently; they're explained in the
// result's "How this estimate works" disclosure instead.
// For the "Other (type your own)" tile only, a short label field comes first, so a visitor can
// name the work before setting its hours/people. Optional here in the sense that an empty value
// is allowed while typing; `sanitizeAreaLabel` supplies the "Other work" fallback at display time.
export default function AreaHoursInput({ area, hours, people, peopleMax, onHoursChange, onPeopleChange, otherLabel, onOtherLabelChange }) {
  return (
    <div className="ai-area-input">
      {area === 'otherArea' && <div className="ai-other-label-field">
        <label className="ai-hours-field-label" htmlFor="other-area-label">What's the work?</label>
        <input id="other-area-label" type="text" className="ai-compact-text-input" maxLength={60}
          placeholder="e.g. grant reporting" value={otherLabel || ''}
          onChange={(e) => onOtherLabelChange?.(e.target.value)} />
      </div>}
      <label className="ai-hours-field-label" htmlFor={`hours-${area}`}>Hours a week one person spends on this</label>
      <GoldSlider
        id={`hours-${area}`} min={0} max={HOUR_CAP_PER_AREA} step={1} value={hours}
        onChange={onHoursChange} ariaLabel="Hours a week one person spends on this, for this area"
        format={(h) => `${h} hrs/week`} ticks={[0, 5, 10, 15, 20, 25]}
      />
      <p className="ai-note ai-slider-hint">Not sure? Leave it at 5.</p>
      <PeopleStepper
        label={hours > 0
          ? `People at your organization who spend about ${hours} hrs a week on this`
          : 'People at your organization who spend time on this'}
        value={people} max={peopleMax} onChange={onPeopleChange}
      />
    </div>
  );
}
