import GoldSlider from './GoldSlider';
import PeopleStepper from './PeopleStepper';
import { HOUR_CAP_PER_AREA } from '../lib/aiOpportunity';

// The sizing block for one picked Q2 area (second step of Q2). Two plainly numbered questions,
// each with its answer shown large beside the control: (1) hours a week for ONE person, (2) how
// many people do it. A one-line sum underneath says what the two answers add up to, so nobody
// has to work out what "5 hrs/week" is a rate of. The caps apply silently; they are explained in
// the result's "How this estimate works" disclosure instead.
// For the "Other (type your own)" tile the work is named on the pick step and shown in the block
// title; the label field is repeated here so it can still be edited.
export default function AreaHoursInput({ area, hours, people, peopleMax, onHoursChange, onPeopleChange, otherLabel, onOtherLabelChange }) {
  const total = hours * people;
  return (
    <div className="ai-area-input">
      {area === 'otherArea' && <div className="ai-other-label-field">
        <label className="ai-hours-field-label" htmlFor="other-area-label">What's the work?</label>
        <input id="other-area-label" type="text" className="ai-compact-text-input" maxLength={60}
          placeholder="e.g. grant reporting" value={otherLabel || ''}
          onChange={(e) => onOtherLabelChange?.(e.target.value)} />
      </div>}
      <div className="ai-size-grid">
        <section className="ai-size-q">
          <span className="ai-size-step" data-n="1" aria-hidden="true" />
          <label className="ai-hours-field-label" htmlFor={`hours-${area}`}>Hours a week one person spends on this</label>
          <p className="ai-size-readout" aria-hidden="true"><strong>{hours}</strong> <span>{hours === 1 ? 'hour' : 'hours'} a week, for one person</span></p>
          <GoldSlider
            id={`hours-${area}`} min={0} max={HOUR_CAP_PER_AREA} step={1} value={hours}
            onChange={onHoursChange} ariaLabel="Hours a week one person spends on this, for this area"
            format={(h) => `${h} hrs/week`} ticks={[0, 5, 10, 15, 20, 25]} bubble={false}
          />
          <p className="ai-note ai-slider-hint">Not sure? Leave it at 5.</p>
        </section>
        <section className="ai-size-q">
          <span className="ai-size-step" data-n="2" aria-hidden="true" />
          <PeopleStepper
            label={hours > 0
              ? `People at your organization who spend about ${hours} ${hours === 1 ? 'hr' : 'hrs'} a week on this`
              : 'People at your organization who spend time on this'}
            value={people} max={peopleMax} onChange={onPeopleChange}
          />
          <p className="ai-note ai-people-helper">Count everyone at your organization who does this, not just you.</p>
        </section>
      </div>
      {hours > 0 && <p className="ai-size-sum">
        {people} {people === 1 ? 'person' : 'people'} &times; {hours} {hours === 1 ? 'hour' : 'hours'} = <strong>{total} {total === 1 ? 'hour' : 'hours'} a week</strong> spent on this today
      </p>}
    </div>
  );
}
