import GlassPanel from '../glass/GlassPanel';

const GROUPS = [
  { name: 'The workflow', items: ['Current workflow and evidence', 'Which parts of the workflow AI can take on and which stay with your people'], diagram: <div className="plan-inside-diagram"><span>Current work</span><span aria-hidden="true">→</span><span>AI + human checkpoints</span></div> },
  { name: 'The tools', items: ['Recommended tool, why it fits, and alternatives', "Costs, setup effort, and what should and shouldn't go into each tool"], diagram: <div className="plan-inside-diagram"><span>Tool fit</span><span aria-hidden="true">+</span><span>Costs + permissions</span></div> },
  { name: 'The time', items: ['Baseline time, expected review time and net savings', 'How the hours add up across the people who do it'], diagram: <div className="plan-inside-diagram"><span>Time saved</span><span aria-hidden="true">−</span><span>Review + upkeep</span><span aria-hidden="true">=</span><span>Net team hours</span></div> },
];

export default function PlanInside() {
  return <section className="plan-inside" aria-labelledby="plan-inside-title">
    <h2 id="plan-inside-title">Look inside your AI plan</h2>
    <p className="plan-inside-note">Illustrative structure, not a client result.</p>
    <p className="plan-inside-note">No savings figure is assigned until the actual work has been assessed.</p>
    <div className="plan-inside-grid">
      {GROUPS.map(group => <GlassPanel className="glass-panel plan-inside-card" key={group.name}>
        <h3>{group.name}</h3>
        {group.diagram}
        <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
      </GlassPanel>)}
    </div>
  </section>;
}
