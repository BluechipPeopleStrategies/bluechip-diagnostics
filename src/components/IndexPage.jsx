import { Link } from 'react-router-dom';
import Emblem from './Emblem';
import { usePageMeta } from '../lib/seo';
import governanceEvalReadiness from '../data/governance-eval-readiness.json';

// The hub shows three cards, in this order (Thomas, Oct 9 2026): AI Pulse (the "Start here" badge),
// the Governance Health Check, and the Decision Signature, which lives on the main site. Org Pulse,
// the Decision Quality Index, the Workplace Read and the Supervisor Blind Spot are off the hub only:
// their routes, quiz data and pages are unchanged (see App.jsx and QuizPage.jsx).
// audience = the "who it's for" routing line so a visitor self-selects the right tool (QW6).
const governance = {
  slug: 'governance-eval-readiness',
  data: governanceEvalReadiness,
  audience: 'For board chairs, mayors, councillors, and directors: anyone who sits on a board that evaluates a CAO, CEO, or Executive Director.',
};

const SITE = 'https://www.bluechip-people-strategies.com';

export default function IndexPage() {
  usePageMeta('Free checks | BlueChip', 'Free checks from BlueChip: start with the AI Pulse, about 4 minutes, no email needed.');
  return (
    <main className="bc-page">
      <p className="bc-back"><a href={SITE + '/'}>← BlueChip People Strategies</a></p>
      <h1>Free <em>checks</em></h1>
      <p>Pick the one that fits your seat.</p>
      <div className="bc-card-grid">
        <Link to="/ai-opportunity-check" className="bc-card-link-block">
          <Emblem slug="ai-opportunity-check" size="md" />
          <span className="bc-card-badge">Start here</span>
          <h3>AI Pulse</h3>
          <p className="bc-card-link-tagline">Find a practical place to start with AI.</p>
          <p className="bc-card-audience">For organizations exploring tools to reduce recurring work. Free, with no email required.</p>
          <span className="bc-card-link-cta">Start →</span>
        </Link>
        <Link to={`/${governance.slug}`} className="bc-card-link-block">
          <Emblem slug={governance.slug} size="md" />
          <h3>{governance.data.title}</h3>
          <p className="bc-card-link-tagline">{governance.data.tagline}</p>
          <p className="bc-card-audience">{governance.audience}</p>
          <span className="bc-card-link-cta">Start →</span>
        </Link>
        <a href={SITE + '/decision-signature'} className="bc-card-link-block">
          <Emblem slug="supervisor-blind-spot" size="md" />
          <h3>Decision Signature</h3>
          <p className="bc-card-link-tagline">25 questions. About 4 minutes. How you make decisions, and the gap it can create in the people you lead.</p>
          <p className="bc-card-audience">For leaders and owners who manage people.</p>
          <span className="bc-card-link-cta">Start →</span>
        </a>
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
