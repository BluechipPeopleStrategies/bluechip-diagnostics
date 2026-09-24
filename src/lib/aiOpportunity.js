export const workflows = {
  correspondence: { label: 'Routine correspondence', opportunity: 'Look at repeated drafts and replies.', preparation: 'Collect three redacted examples and record the drafting and checking time.' },
  reporting: { label: 'Recurring reports', opportunity: 'Look at how information becomes a recurring report.', preparation: 'Map one report from source information to approved output. Time each active step.' },
  meetings: { label: 'Meeting follow-through', opportunity: 'Look at notes, action lists and follow-up.', preparation: 'Time the work after a typical meeting. Check recording and information permissions first.' },
  search: { label: 'Finding information', opportunity: 'Look at repeated searches through approved documents.', preparation: 'Log recurring questions, where answers live and how you verify the answer.' },
  unsure: { label: 'Your recurring work', opportunity: 'Start by making the recurring work visible.', preparation: 'Keep a five-day task log with frequency, active time and who checks the work.' },
};

export const questions = [
  { id: 'organisation', label: 'What kind of organisation are you assessing?', options: [['business', 'Business'], ['municipal', 'Municipal or public sector'], ['nonprofit', 'Nonprofit'], ['other', 'Other / unsure']] },
  { id: 'workflow', label: 'Where would you most like time back?', options: Object.entries(workflows).map(([key, value]) => [key, value.label]) },
  { id: 'tools', label: 'What tools are already available?', options: [['microsoft', 'Microsoft 365'], ['google', 'Google Workspace'], ['mixed', 'A mix of tools'], ['unsure', 'Not sure']] },
  { id: 'workload', label: 'How much weekly time does that work take across the organisation?', options: [['under5', 'Less than five hours'], ['5plus', 'Five hours or more'], ['unsure', 'We have not measured it']] },
  { id: 'sensitivity', label: 'What information does the work involve?', options: [['public', 'Public or non-sensitive information'], ['internal', 'Internal business information'], ['sensitive', 'Employee, client or other sensitive information'], ['unsure', 'Not sure']] },
  { id: 'readiness', label: 'What is your next practical step?', options: [['ready', 'We can assign someone to implement'], ['exploring', 'We are exploring options'], ['permissions', 'We need approvals first']] },
];

export function getOpportunity(answers) {
  const workflow = workflows[answers.workflow] || workflows.unsure;
  const permissionFirst = ['sensitive', 'unsure'].includes(answers.sensitivity) || answers.readiness === 'permissions';
  const baselineFirst = answers.workload !== '5plus' || answers.workflow === 'unsure';
  const route = permissionFirst ? 'permissions' : baselineFirst ? 'baseline' : answers.readiness === 'ready' ? 'audit' : 'explore';
  const next = {
    permissions: 'Clarify permissions before choosing a tool. Identify the information owner and the approved environment first.',
    baseline: 'Build a baseline first. The time spent on a task is not the same as the time a tool could save.',
    audit: 'You have a workflow worth investigating. The audit can examine the actual work and test the case for suitable tools.',
    explore: 'Try the preparation step first, then decide whether a closer assessment would help.',
  }[route];
  const toolAdvice = { microsoft: 'Start by checking the Microsoft 365 features and licences you already have.', google: 'Start by checking the Google Workspace features and licences you already have.', mixed: 'List your current tools and the handoffs between them before adding another subscription.', unsure: 'Make a short inventory of your current tools and who can approve their use.' }[answers.tools] || '';
  return { ...workflow, route, next, toolAdvice };
}

export function defaultHours(workload) {
  return workload === 'under5' ? 2 : 5;
}

// people = how many staff get time back; hours = hours a week each (defaults keep the old one-person maths).
export function teamHours({ hours, people = 1 }) {
  const h = Number(hours), p = Number(people);
  if (![h, p].every(Number.isFinite) || h <= 0 || p <= 0) return 0;
  return h * p;
}
export function estimateCapacity({ hours, rate, weeks, people = 1 }) {
  const r = Number(rate), w = Number(weeks), t = teamHours({ hours, people });
  if (![r, w].every(Number.isFinite) || r <= 0 || w <= 0 || t <= 0) return 0;
  return t * r * w;
}
