import { useId, useState } from 'react';
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

function WorkNode({ stage, variant }) {
  const id = useId();
  return <svg className="pulse-node-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-navy`} x2="1" y2="1"><stop stopColor="#60758f"/><stop offset="1" stopColor="#13243c"/></linearGradient>
      <linearGradient id={`${id}-paper`} x2="1" y2="1"><stop stopColor="#f5efe6"/><stop offset="1" stopColor="#b7bdc6"/></linearGradient>
      <linearGradient id={`${id}-gold`} x2="1" y2="1"><stop stopColor="#f1d58d"/><stop offset="1" stopColor="#a6802d"/></linearGradient>
    </defs>
    {stage === 0 && <g stroke="#8793a6" strokeWidth="1">
      {variant === 'people' ? <><rect x="8" y="25" width="18" height="23" rx="6" fill={`url(#${id}-navy)`}/><rect x="32" y="9" width="18" height="23" rx="6" fill={`url(#${id}-navy)`}/><rect x="32" y="39" width="18" height="20" rx="6" fill={`url(#${id}-gold)`} stroke="#d6b761"/></> : <>
        <rect x="10" y="9" width="37" height="37" rx={variant === 'communication' ? 18 : 7} transform="rotate(-12 28.5 27.5)" fill={`url(#${id}-navy)`}/>
        <rect x="18" y="18" width="37" height="37" rx={variant === 'communication' ? 18 : 7} transform="rotate(10 36.5 36.5)" fill={`url(#${id}-navy)`}/>
        <rect x="6" y="36" width="22" height="22" rx="7" fill={`url(#${id}-gold)`} stroke="#d6b761"/>
      </>}
    </g>}
    {stage === 1 && <><rect x="12" y="10" width="40" height="44" rx="8" fill={`url(#${id}-paper)`} stroke="#e6c77b"/><path d="M23 24h18M23 32h18M23 40h13" fill="none" stroke="#ac9459" strokeWidth="3" strokeLinecap="round"/></>}
    {stage === 2 && <><rect x="10" y="10" width="44" height="44" rx="9" fill={`url(#${id}-gold)`} stroke="#f1d58d"/><path d="m22 32.5 7 7 13-15" fill="none" stroke="#0b1a33" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></>}
  </svg>;
}

function SelectionMark({ selected }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={selected ? 'm6 12 4 4 8-8' : 'M12 6v12M6 12h12'} /></svg>;
}

function WorkDiagram({ steps, variant }) {
  return <div className={`pulse-work-diagram pulse-work-diagram--${variant}`} aria-label={steps.join(' → ')} role="img">
    <div className="pulse-diagram-path" aria-hidden="true" />
    {steps.map((step, i) => <div className="pulse-diagram-stop" key={step}>
      <div className={`pulse-abstract-node pulse-abstract-node--${i}`} aria-hidden="true"><WorkNode stage={i} variant={variant}/></div>
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
              <span className="pulse-family-copy"><strong>{family.title}</strong><span className="pulse-family-cue">{family.cue}</span></span>
              <span className="pulse-select-mark" aria-hidden="true"><SelectionMark selected={pressed}/></span>
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
