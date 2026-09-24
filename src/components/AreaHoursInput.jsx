import GoldSlider from './GoldSlider';
import PeopleStepper from './PeopleStepper';
import { HOUR_CAP_PER_AREA } from '../lib/aiOpportunity';

// The inline row that appears under a ticked Q2 area tile: hours a week for one person (a gold
// slider with a floating bubble, no separate typed box), and how many people (a stepper plus
// quick-pick chips). No caps note here -- the caps apply silently; they're explained in the
// result's "How this estimate works" disclosure instead.
export default function AreaHoursInput({ area, hours, people, peopleMax, onHoursChange, onPeopleChange }) {
  return (
    <div className="ai-area-input">
      <label className="ai-hours-field-label" htmlFor={`hours-${area}`}>Hours a week, one person</label>
      <GoldSlider
        id={`hours-${area}`} min={0} max={HOUR_CAP_PER_AREA} step={1} value={hours}
        onChange={onHoursChange} ariaLabel={`Hours a week, one person, for this area`}
        format={(h) => `${h} hrs/week`}
      />
      <p className="ai-note ai-slider-hint">Not sure? Leave it at 5.</p>
      <PeopleStepper
        label="People who spend about that much time or more"
        value={people} max={peopleMax} onChange={onPeopleChange}
      />
    </div>
  );
}
