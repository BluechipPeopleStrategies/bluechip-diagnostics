// Inline SVG icon set for the free check's 2026-09-25 polish (items 44, 50, 55, 57, 60, 61).
// Same drawing language as AreaIcon.jsx (round caps and joins, stroke on currentColor) on a
// 24px grid, so they sit inside the dimensional medallions in FreeCheck.css. No icon library.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

// Q1 organization types. Each path carries `pathLength` so the hover "draw-on" animation in
// FreeCheck.css can run the same dash length on every shape.
const ORG = {
  // briefcase
  professional: <>
    <rect x="3" y="7.5" width="18" height="12" rx="2.2" {...S} pathLength="1" />
    <path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7" {...S} pathLength="1" />
    <path d="M3 12.6c5.6 2 12.4 2 18 0" {...S} pathLength="1" />
    <rect x="10.6" y="12.2" width="2.8" height="2.6" rx=".6" {...S} pathLength="1" />
  </>,
  // hard hat
  trades: <>
    <path d="M5.2 15.5a6.8 6.8 0 0 1 13.6 0" {...S} pathLength="1" />
    <path d="M10.3 8.9V6.6c0-.5.4-.9.9-.9h1.6c.5 0 .9.4.9.9v2.3" {...S} pathLength="1" />
    <rect x="3" y="15.5" width="18" height="3.3" rx="1.6" {...S} pathLength="1" />
    <path d="M8.2 11.6v3.9M15.8 11.6v3.9" {...S} pathLength="1" />
  </>,
  // medical cross in a rounded square
  healthcare: <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" {...S} pathLength="1" />
    <path d="M10.2 7.4h3.6v2.8h2.8v3.6h-2.8v2.8h-3.6v-2.8H7.4v-3.6h2.8z" {...S} pathLength="1" />
  </>,
  // shopping bag
  retail: <>
    <path d="M5.3 8h13.4l-.9 11.2a1.6 1.6 0 0 1-1.6 1.5H7.8a1.6 1.6 0 0 1-1.6-1.5z" {...S} pathLength="1" />
    <path d="M9 10.5V7.2a3 3 0 0 1 6 0v3.3" {...S} pathLength="1" />
  </>,
  // mortarboard
  postsecondary: <>
    <path d="M12 4.5l9.5 4.3L12 13 2.5 8.8z" {...S} pathLength="1" />
    <path d="M6.5 10.9v4.2c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.2" {...S} pathLength="1" />
    <path d="M21.5 8.8v5.4" {...S} pathLength="1" />
    <circle cx="21.5" cy="15.4" r="1" {...S} pathLength="1" />
  </>,
  // civic building
  municipal: <>
    <path d="M3 9.2L12 4l9 5.2z" {...S} pathLength="1" />
    <path d="M6 11.5v5.5M10 11.5v5.5M14 11.5v5.5M18 11.5v5.5" {...S} pathLength="1" />
    <path d="M4.2 19h15.6M3 21h18" {...S} pathLength="1" />
  </>,
  // heart held in an open hand
  nonprofit: <>
    <path d="M12 14.6s-5-3-5-6.6A2.7 2.7 0 0 1 12 6.6 2.7 2.7 0 0 1 17 8c0 3.6-5 6.6-5 6.6z" {...S} pathLength="1" />
    <path d="M2.8 17.6c2.4-1.2 4.4-1.3 6.2-.4l1.9.9h3.4c.8 0 1.2 1 .6 1.5-.3.3-.7.4-1.1.4H10" {...S} pathLength="1" />
    <path d="M14.5 18.4l4.4-2.1c.8-.4 1.8.2 1.8 1.1 0 .4-.2.8-.6 1l-5.3 2.8c-2.1 1.1-4.5 1-6.6-.1l-5.2-2.6" {...S} pathLength="1" />
  </>,
  // three tiles and a plus
  other: <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" {...S} pathLength="1" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" {...S} pathLength="1" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" {...S} pathLength="1" />
    <path d="M16.75 13.8v6.4M13.55 17h6.4" {...S} pathLength="1" />
  </>,
};

export function OrgTypeIcon({ type, className = 'ai-fc-org-icon' }) {
  const content = ORG[type];
  if (!content) return null;
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{content}</svg>;
}

// Q11 "How does your team feel about AI?" as weather: a familiar, non-judgemental scale.
// Parts carry class names so FreeCheck.css can animate them (rays turn, drops fall, the
// "depends on the day" sun and cloud trade places).
const MOOD = {
  keen: <>
    <circle className="ai-fc-mood-sun" cx="16" cy="16" r="5.6" {...S} />
    <g className="ai-fc-mood-rays">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a} d="M16 4.2v2.6" transform={`rotate(${a} 16 16)`} {...S} />
      ))}
    </g>
  </>,
  mixed: <>
    <circle className="ai-fc-mood-sun" cx="12.5" cy="11.5" r="4.6" {...S} />
    <path className="ai-fc-mood-cloud" d="M11 25.5h11.6a4.4 4.4 0 0 0 .6-8.8 6 6 0 0 0-11.4-1.3A4.6 4.6 0 0 0 11 25.5z" {...S} />
  </>,
  worried: <>
    <path className="ai-fc-mood-cloud" d="M8.4 19.5h14.8a4.6 4.6 0 0 0 .6-9.2 6.4 6.4 0 0 0-12.2-1.4 5.3 5.3 0 0 0-3.2 10.6z" {...S} />
    <g className="ai-fc-mood-drops">
      <path d="M11 23l-1 2.6M16 23l-1 2.6M21 23l-1 2.6" {...S} />
    </g>
  </>,
  variesFeel: <>
    <g className="ai-fc-mood-swap-a">
      <circle cx="16" cy="16" r="5" {...S} />
      <path d="M16 6.2v2.2M16 23.6v2.2M6.2 16h2.2M23.6 16h2.2M9.1 9.1l1.5 1.5M21.4 21.4l1.5 1.5M9.1 22.9l1.5-1.5M21.4 10.6l1.5-1.5" {...S} />
    </g>
    <g className="ai-fc-mood-swap-b">
      <path d="M8.4 21.5h14.8a4.6 4.6 0 0 0 .6-9.2 6.4 6.4 0 0 0-12.2-1.4 5.3 5.3 0 0 0-3.2 10.6z" {...S} />
    </g>
  </>,
  notSureFeel: <>
    <path className="ai-fc-mood-fog" d="M6 12.5h14M9 17h17M5 21.5h13" {...S} />
    <path d="M22.5 9.2a2.6 2.6 0 1 1 3.3 2.5c-.6.2-.8.6-.8 1.1" {...S} strokeWidth={1.3} />
    <circle cx="25" cy="15" r=".4" {...S} strokeWidth={1.2} />
  </>,
};

export function MoodIcon({ mood, className = 'ai-fc-mood-icon' }) {
  const content = MOOD[mood];
  if (!content) return null;
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true">{content}</svg>;
}

// A small person, repeated to build the org-size scale's head count.
export function PersonGlyph({ x = 0, className }) {
  return (
    <g className={className} transform={`translate(${x} 0)`}>
      <circle cx="5" cy="4" r="2.4" {...S} strokeWidth={1.3} />
      <path d="M1 13.2c.4-3 2-4.6 4-4.6s3.6 1.6 4 4.6" {...S} strokeWidth={1.3} />
    </g>
  );
}

// "Where to look": a lens with a glint that sweeps across it (FreeCheck.css).
export function MagnifierMark({ className = 'ai-fc-magnifier' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="aiFcLensGlass" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#f5efe6" stopOpacity=".22" />
          <stop offset=".55" stopColor="#8fb0d8" stopOpacity=".08" />
          <stop offset="1" stopColor="#0b1a33" stopOpacity=".35" />
        </radialGradient>
        <linearGradient id="aiFcLensRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d99a" />
          <stop offset="1" stopColor="#b8913f" />
        </linearGradient>
        <clipPath id="aiFcLensClip"><circle cx="26" cy="26" r="16" /></clipPath>
      </defs>
      <path d="M38.5 38.5l14 14" stroke="url(#aiFcLensRim)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M38.5 38.5l14 14" stroke="#0b1a33" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" fill="none" transform="translate(1.2 -1.2)" />
      <circle cx="26" cy="26" r="16" fill="url(#aiFcLensGlass)" />
      <g clipPath="url(#aiFcLensClip)">
        <rect className="ai-fc-magnifier-glint" x="4" y="-4" width="7" height="60" fill="#f5efe6" opacity=".35" transform="rotate(35 26 26)" />
      </g>
      <circle cx="26" cy="26" r="16" fill="none" stroke="url(#aiFcLensRim)" strokeWidth="3.4" />
      <path d="M16.5 21a11 11 0 0 1 6.5-6.2" stroke="#f5efe6" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Small lens used as the bullet on each "look for" line (keeps the ai-lookout-check class the
// tests and older styles key on).
export function LensBullet({ className = 'ai-lookout-check' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5" {...S} strokeWidth={1.5} />
      <path d="M12.3 12.3l4.2 4.2" {...S} strokeWidth={1.8} />
    </svg>
  );
}

const MISC = {
  shield: <>
    <path d="M12 3.2l7.2 2.7v5.4c0 4.6-3 8.3-7.2 9.5-4.2-1.2-7.2-4.9-7.2-9.5V5.9z" {...S} />
    <path d="M8.8 12.1l2.2 2.2 4.4-4.6" {...S} />
  </>,
  tools: <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" {...S} />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" {...S} />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" {...S} />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" {...S} />
  </>,
  person: <>
    <circle cx="12" cy="8" r="3.6" {...S} />
    <path d="M5 20c.7-4.1 3.5-6.3 7-6.3s6.3 2.2 7 6.3" {...S} />
  </>,
  print: <>
    <path d="M7 9V3.5h10V9" {...S} />
    <rect x="3.5" y="9" width="17" height="8" rx="2" {...S} />
    <path d="M7 14.5h10v6H7z" {...S} />
    <path d="M16.8 11.8h.4" {...S} />
  </>,
  mail: <>
    <rect x="3" y="5.5" width="18" height="13" rx="2" {...S} />
    <path d="M3.6 6.6l8.4 6.2 8.4-6.2" {...S} />
  </>,
  arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...S} />,
  copy: <>
    <rect x="8" y="8" width="12" height="12" rx="2" {...S} />
    <path d="M16 8V5.8A1.8 1.8 0 0 0 14.2 4H5.8A1.8 1.8 0 0 0 4 5.8v8.4A1.8 1.8 0 0 0 5.8 16H8" {...S} />
  </>,
  clock: <>
    <circle cx="12" cy="12" r="8.5" {...S} />
    <path d="M12 7.2V12l3.2 2" {...S} />
  </>,
  pencil: <path d="M14.5 4.5l5 5L9 20H4v-5z M12.5 6.5l5 5" {...S} />,
  list: <>
    <path d="M9 7h11M9 12h11M9 17h11" {...S} />
    <circle cx="5" cy="7" r=".8" {...S} /><circle cx="5" cy="12" r=".8" {...S} /><circle cx="5" cy="17" r=".8" {...S} />
  </>,
};

export function FcIcon({ name, className = 'ai-fc-icon' }) {
  const content = MISC[name];
  if (!content) return null;
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{content}</svg>;
}
