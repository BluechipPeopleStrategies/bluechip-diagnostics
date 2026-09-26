import { NavLink, useLocation } from 'react-router-dom';
import { scrollPageToTop } from '../lib/motion';
import './SiteHeader.css';

const NAV = [
  { to: '/ai-opportunity-check', label: 'AI Opportunity Check' },
  { to: '/ai-handoff-plan', label: 'The AI Handoff Plan' },
];

// Shared brand header for the AI pages (design review finding #2: the two AI pages were the
// only pages on the whole property with no BlueChip wordmark, nav, or way back to the main site).
// Sticky on scroll with a translucent navy blur; safe-area aware for notched phones.
export default function SiteHeader({ showCta = false }) {
  const { pathname } = useLocation();
  return (
    <header className="bc-site-header">
      <div className="bc-site-header-inner">
        <a className="bc-site-header-logo" href="https://www.bluechip-people-strategies.com/" aria-label="BlueChip People Strategies, home">
          <img src="/brand/bluechip-wordmark-gold.png" alt="BlueChip" width="128" height="34" />
        </a>
        <nav className="bc-site-header-links" aria-label="AI pages">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) => `bc-site-header-link${isActive ? ' is-current' : ''}`}
              onClick={(e) => {
                if (pathname === item.to) { e.preventDefault(); scrollPageToTop(); }
              }}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {showCta && (
          <a className="ai-button plan-btn plan-btn--compact bc-site-header-cta" href="#chat?topic=ai-handoff-plan">Start the conversation</a>
        )}
      </div>
    </header>
  );
}
