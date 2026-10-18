import { PulseWorkSketch } from './PulseWorkAreas.jsx';
import { PULSE_IDEA_VISUALS } from '../data/pulseIdeaVisuals.js';
import { pulseStartingPoints } from '../lib/pulseStartingPoints.js';
import { pulseAnswerLabel } from '../data/pulseAnswerCopy.js';

export default function PulseIdeaCards({ result, onChoose }) {
  const ideas = pulseStartingPoints(result);
  return <section id="pulse-ideas" aria-label="Your practical opportunities">
    {ideas.map((item, i) => {
      const [title, steps] = PULSE_IDEA_VISUALS[item.id];
      const chosen = result.startingPoint?.id === item.id;
      return <article className={`pulse-idea-visual${chosen ? ' is-starting-point' : ''}`} key={item.id}>
        <div className="pulse-idea-heading"><p className="pulse-eyebrow">Opportunity {i + 1} · {result.future.some(o => o.id === item.id) ? 'Make room for new work' : 'Ease existing work'}</p><h2>{title}</h2></div>
        <PulseWorkSketch family={item.family} steps={steps} />
        <div className="pulse-idea-first"><span className="pulse-idea-number" aria-hidden="true">1</span><div><h3>One step to try</h3><p>{item.first}</p></div></div>
        <div className="pulse-idea-card-actions"><button type="button" className={`pulse-text${chosen ? ' is-chosen' : ''}`} aria-pressed={chosen} onClick={() => onChoose(item.id)}>{chosen ? 'Your chosen starting point ✓' : 'Choose this starting point'}</button><details><summary>What to check</summary><p>{item.explain}</p></details></div>
      </article>;
    })}
    {!ideas.length && <div className="pulse-panel"><h2>{result.uncertain.length ? 'Start with a useful team conversation.' : 'Keep what already works.'}</h2><p>{result.uncertain.length ? 'Ask the people doing the work where they keep searching, rewriting or chasing. An unsure answer is a question to explore.' : 'Your answers have not identified a gap. You can change your starting areas if you want to explore something else.'}</p></div>}
    {result.covered.length > 0 && <aside className="pulse-result-keeps"><h2>Keep what works</h2><ul>{result.covered.map(item => <li key={item.id}>{pulseAnswerLabel(item,'works')}</li>)}</ul></aside>}
    {result.uncertain.length > 0 && <aside className="pulse-team-question"><img src="/art/ai-pulse-wisdom-book-v1.webp" alt="" width="72" height="72" /><div><p className="pulse-eyebrow">A useful question for your team</p><h2>Where could we make this easier?</h2><ul>{result.uncertain.map(item => <li key={item.id}>{item.prompt}</li>)}</ul></div></aside>}
  </section>;
}
