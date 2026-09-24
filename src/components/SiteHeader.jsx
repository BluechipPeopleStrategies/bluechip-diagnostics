import { Link } from 'react-router-dom';

// Shared brand header for the AI pages (design review finding #2: the two AI pages were the
// only pages on the whole property with no BlueChip wordmark, nav, or way back to the main site).
// Sticky on scroll with a translucent navy blur; safe-area aware for notched phones.
export default function SiteHeader({ showCta = false }) {
  return (
    <header className="bc-site-header">
      <div className="bc-site-header-inner">
        <a className="bc-site-header-logo" href="https://www.bluechip-people-strategies.com/" aria-label="BlueChip People Strategies, home">
          <img src="/brand/bluechip-wordmark-gold.png" alt="BlueChip" width="128" height="34" />
        </a>
        <nav className="bc-site-header-links" aria-label="AI pages">
          <Link to="/ai-opportunity-check">Free AI check</Link>
          <Link to="/ai-handoff-plan">The AI Handoff Plan</Link>
        </nav>
        {showCta && (
          <a className="ai-button bc-site-header-cta" href="#chat?topic=ai-handoff-plan">Start the conversation</a>
        )}
      </div>
    </header>
  );
}
