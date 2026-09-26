// Intro hourglass (item 43, 2026-09-25): the photo stays the base layer, and an SVG in the
// photo's own 800x800 coordinate space adds the motion on top of it, so the particles line up
// with the real glass at every size. Sand trickles from the upper bulb into the crystal, and
// gold "hours" drop from the crystal onto the pile below; a slow glint crosses the glass.
// Pure CSS keyframes (FreeCheck.css); under prefers-reduced-motion the overlay is hidden and
// the still photo is all that shows.
const GRAINS = [0, 1, 2, 3, 4, 5, 6];
const CUBES = [
  { x: 396, d: 0, s: 1 },
  { x: 404, d: 0.55, s: 0.85 },
  { x: 392, d: 1.1, s: 0.95 },
  { x: 409, d: 1.65, s: 0.8 },
  { x: 399, d: 2.2, s: 0.9 },
];

export default function HourglassHero() {
  return (
    <div className="ai-fc-hourglass">
      <img className="ai-intro-photo" alt=""
        src="/img/ai/02-free-check-1600.webp"
        srcSet="/img/ai/02-free-check-800.webp 800w, /img/ai/02-free-check-1600.webp 1600w"
        sizes="(max-width: 480px) 45vw, 220px"
        width="1600" height="1600" loading="lazy" />
      <svg className="ai-fc-hourglass-fx" viewBox="0 0 800 800" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="aiFcCube" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1c4" />
            <stop offset=".45" stopColor="#e2b94f" />
            <stop offset="1" stopColor="#a67a22" />
          </linearGradient>
          <linearGradient id="aiFcGlint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".22" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="aiFcGlass"><path d="M268 236h264c-6 70-40 118-96 150 56 30 92 90 100 168H264c8-78 44-138 100-168-56-32-90-80-96-150z" /></clipPath>
        </defs>
        <line className="ai-fc-sand-stream" x1="400" y1="258" x2="400" y2="356" />
        {GRAINS.map(g => <circle key={g} className="ai-fc-sand-grain" cx={398 + (g % 3) * 2} cy="262" r="3.2" style={{ '--d': `${g * 0.19}s` }} />)}
        {CUBES.map((c, i) => (
          <g key={i} className="ai-fc-cube" style={{ '--d': `${c.d}s`, '--x': `${c.x}px` }}>
            <rect x="-8" y="-8" width="16" height="16" rx="2" fill="url(#aiFcCube)" transform={`scale(${c.s})`} />
          </g>
        ))}
        <g clipPath="url(#aiFcGlass)">
          <rect className="ai-fc-glass-glint" x="-120" y="200" width="90" height="420" fill="url(#aiFcGlint)" transform="skewX(-18)" />
        </g>
      </svg>
    </div>
  );
}
