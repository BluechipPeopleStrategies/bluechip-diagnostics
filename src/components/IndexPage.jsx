import { Link } from 'react-router-dom';
import orgPulse from '../data/org-pulse.json';
import dqi from '../data/dqi.json';
import workplaceRead from '../data/workplace-read.json';
import supervisorBlindSpot from '../data/supervisor-blind-spot.json';

// audience = the "who it's for" routing line so a visitor self-selects the right tool
// instead of guessing (QW6). startHere flags the broadest org-level tool.
const diagnostics = [
  {
    slug: 'org-pulse',
    data: orgPulse,
    audience: 'For execs and boards reading the whole organization.',
    startHere: true,
  },
  {
    slug: 'dqi',
    data: dqi,
    audience: 'For executives and founders pressure-testing how they make the big calls.',
  },
  {
    slug: 'workplace-read',
    data: workplaceRead,
    audience: 'For a leader who senses something is off and wants to read it clearly.',
  },
  {
    slug: 'supervisor-blind-spot',
    data: supervisorBlindSpot,
    audience: 'For owners and team leads who manage people directly.',
  },
];

export default function IndexPage() {
  return (
    <main className="bc-page">
      <h1>Free <em>diagnostics</em></h1>
      <p>Short, sharp, and built to surface the thing you already half-suspect. Pick the one that fits your seat.</p>
      <div className="bc-card-grid">
        {diagnostics.map(({ slug, data, audience, startHere }) => (
          <Link key={slug} to={`/${slug}`} className="bc-card-link-block">
            {startHere && <span className="bc-card-badge">Start here</span>}
            <h3>{data.title}</h3>
            <p className="bc-card-link-tagline">{data.tagline}</p>
            {audience && <p className="bc-card-audience">{audience}</p>}
            <span className="bc-card-link-cta">Start →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
