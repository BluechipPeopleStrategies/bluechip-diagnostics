import GlassPanel from '../glass/GlassPanel';

const GROUPS = [
  { name: 'What can AI help with?', items: ['We look at real tasks with your team.', 'Your people keep control of decisions.'], diagram: <div className="plan-inside-diagram"><span>Work your team does</span><span aria-hidden="true">↓</span><span>Steps AI could help with</span><span aria-hidden="true">↓</span><span>What people still check</span></div> },
  { name: 'Which tools fit?', items: ['Use tools your organization approves.', 'See the costs and what information each tool can use.'], diagram: <div className="plan-inside-diagram"><span>Tools you already use</span><span aria-hidden="true">↓</span><span>Cost and setup</span><span aria-hidden="true">↓</span><span>What is safe to share</span></div> },
  { name: 'How much time could you get back?', items: ["We compare today's work with the proposed approach.", 'We add up time across the agreed people.'], diagram: <div className="plan-inside-diagram"><span>Time AI could save</span><span aria-hidden="true">−</span><span>Time for checks and upkeep</span><span aria-hidden="true">=</span><span>Time back for your team</span></div> },
];

export default function PlanInside() {
  return <section className="plan-inside" aria-labelledby="plan-inside-title">
    <h2 id="plan-inside-title">Look inside your AI plan</h2>
    <p className="plan-inside-note">Here is what we look at. We estimate time only after reviewing your work.</p>
    <div className="plan-inside-grid">
      {GROUPS.map(group => <GlassPanel className="glass-panel plan-inside-card" key={group.name}>
        <h3>{group.name}</h3>
        {group.diagram}
        <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
      </GlassPanel>)}
    </div>
  </section>;
}
