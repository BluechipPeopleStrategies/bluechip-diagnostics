import { Link } from 'react-router-dom';
import Emblem from './Emblem';
import { usePageMeta } from '../lib/seo';
import orgPulse from '../data/org-pulse.json';
import dqi from '../data/dqi.json';
import workplaceRead from '../data/workplace-read.json';
import supervisorBlindSpot from '../data/supervisor-blind-spot.json';
import governanceEvalReadiness from '../data/governance-eval-readiness.json';

// audience = the "who it's for" routing line so a visitor self-selects the right tool
// instead of guessing (QW6). The AI Pulse is the first step and carries the "Start here" badge
// (Thomas, Oct 9 2026: AI Pulse and the AI Handoff Plan lead; replaces the 2026-07-04 governance-first order).
const diagnostics = [
  {
    slug: 'governance-eval-readiness',
    data: governanceEvalReadiness,
    audience: 'For board chairs, mayors, councillors, and directors: anyone who sits on a board that evaluates a CAO, CEO, or Executive Director.',
  },
  {
    slug: 'org-pulse',
    data: orgPulse,
    audience: 'For execs and boards reading the whole organization.',
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

const SITE = 'https://www.bluechip-people-strategies.com';

export default function IndexPage() {
  usePageMeta('Free checks | BlueChip', 'Free checks from BlueChip: start with the AI Pulse, about 3 minutes, no email needed.');
  return (
    <main className="bc-page">
      <p className="bc-back"><a href={SITE + '/'}>← BlueChip People Strategies</a></p>
      <h1>Free <em>diagnostics</em></h1>
      <p>Short, sharp, and built to surface the thing you already half-suspect. Pick the one that fits your seat.</p>
      <div className="bc-card-grid">
        <Link to="/ai-opportunity-check" className="bc-card-link-block">
          <Emblem slug="ai-opportunity-check" size="md" />
          <span className="bc-card-badge">Start here</span>
          <h3>AI Pulse</h3>
          <p className="bc-card-link-tagline">Find a practical place to start with AI.</p>
          <p className="bc-card-audience">For organizations exploring tools to reduce recurring work. Free, with no email required.</p>
          <span className="bc-card-link-cta">Start →</span>
        </Link>
        {diagnostics.map(({ slug, data, audience }) => (
          <Link key={slug} to={`/${slug}`} className="bc-card-link-block">
            <Emblem slug={slug} size="md" />
            <h3>{data.title}</h3>
            <p className="bc-card-link-tagline">{data.tagline}</p>
            {audience && <p className="bc-card-audience">{audience}</p>}
            <span className="bc-card-link-cta">Start →</span>
          </Link>
        ))}
      </div>
      <nav className="bc-hub-foot" aria-label="BlueChip">
        <a href={SITE + '/'}>BlueChip People Strategies</a>
        <a href={SITE + '/contact'}>Contact</a>
        <a href={SITE + '/privacy'}>Privacy</a>
        <a href={SITE + '/terms'}>Terms</a>
        <a href={SITE + '/refund'}>Refund policy</a>
      </nav>
    </main>
  );
}
