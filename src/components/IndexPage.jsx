import { Link } from 'react-router-dom';
import orgPulse from '../data/org-pulse.json';
import dqi from '../data/dqi.json';
import workplaceRead from '../data/workplace-read.json';
import supervisorBlindSpot from '../data/supervisor-blind-spot.json';

const diagnostics = [
  { slug: 'org-pulse', data: orgPulse },
  { slug: 'dqi', data: dqi },
  { slug: 'workplace-read', data: workplaceRead },
  { slug: 'supervisor-blind-spot', data: supervisorBlindSpot },
];

export default function IndexPage() {
  return (
    <main className="bc-page">
      <h1>Free <em>diagnostics</em></h1>
      <p>Short, sharp, and built to surface the thing you can't quite name. Pick the one that fits.</p>
      <div className="bc-card-grid">
        {diagnostics.map(({ slug, data }) => (
          <Link key={slug} to={`/${slug}`} className="bc-card-link-block">
            <h3>{data.title}</h3>
            <p className="bc-card-link-tagline">{data.tagline}</p>
            <span className="bc-card-link-cta">Start →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
