import { useState } from 'react';
import { FAMILIES } from '../data/pulseCatalogue.js';
import PulseWorkIcon from './PulseWorkIcon.jsx';

const GROUPS = [
  { id: 'information', title: 'Information & insight', steps: ['Your sources', 'Find the answer', 'Check the source'], families: ['knowledge', 'documents', 'industry'] },
  { id: 'communication', title: 'Communication & content', steps: ['Your ideas', 'A useful draft', 'Your review'], families: ['voice', 'inbox', 'social'] },
  { id: 'people', title: 'People & progress', steps: ['The work', 'Clear next steps', 'People decide'], families: ['operations', 'priorities', 'accountability', 'people'] },
];
const EXAMPLES = {
  knowledge: 'Find an answer across approved documents, with a link back to its source.',
  documents: 'Turn approved research into a first draft of a report you can check.',
  industry: 'Bring chosen industry news, niche creators and public competitor offers into one daily briefing.',
  voice: 'Speak a first draft, then check the wording, names and numbers.',
  inbox: 'Draft a reply from an email thread and flag the follow-up for your review.',
  social: 'Turn one useful idea into draft updates for your different channels.',
  operations: 'Turn a recurring request into a checklist or a draft response.',
  priorities: 'Organize a task list around deadlines and dependencies, then decide what comes first.',
  accountability: 'Turn meeting notes into proposed owners, actions and dates.',
  people: 'Prepare onboarding checklists and policy answers from approved sources. People handle sensitive decisions.',
};

function WorkDiagram({ steps, variant }) {
  return <div className={`pulse-work-diagram pulse-work-diagram--${variant}`} aria-label={steps.join(' → ')} role="img">
    <div className="pulse-diagram-path" aria-hidden="true" />
    {steps.map((step, i) => <div className="pulse-diagram-stop" key={step}>
      <div className={`pulse-abstract-node pulse-abstract-node--${i}`} aria-hidden="true"><i /><i /><i /></div>
      <span>{step}</span>
    </div>)}
  </div>;
}

export function PulseWorkSketch({ family }) {
  const group = GROUPS.find(g => g.families.includes(family)) || GROUPS[0];
  return <WorkDiagram steps={group.steps} variant={group.id} />;
}

export default function PulseWorkAreas({ selected, onToggle }) {
  const [preview, setPreview] = useState(null);
  return <>
    <div className="pulse-work-buckets">
      {GROUPS.map(group => <section className="pulse-work-bucket" aria-labelledby={`pulse-group-${group.id}`} key={group.id}>
        <WorkDiagram steps={group.steps} variant={group.id} />
        <h2 id={`pulse-group-${group.id}`}>{group.title}</h2>
        <div className="pulse-bucket-choices">
          {group.families.map(id => {
            const family = FAMILIES.find(f => f.id === id);
            const pressed = selected.includes(id);
            return <button type="button" className="pulse-family" data-family={id} key={id}
              aria-label={`${family.title}. ${family.cue}`} aria-pressed={pressed}
              onClick={() => { onToggle(id); setPreview(pressed ? null : id); }}>
              <PulseWorkIcon family={id} size={23} />
              <strong>{family.title}</strong>
              <span className="pulse-select-mark" aria-hidden="true">{pressed ? '✓' : '+'}</span>
            </button>;
          })}
        </div>
      </section>)}
    </div>
    {preview && <div className="pulse-work-preview" role="status" aria-label="A possibility to explore">
      <span className="pulse-preview-spark" aria-hidden="true">↗</span>
      <div><p className="pulse-eyebrow">One possibility</p><p>{EXAMPLES[preview]}</p></div>
    </div>}
  </>;
}
