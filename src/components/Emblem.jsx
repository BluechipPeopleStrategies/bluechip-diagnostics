import { ART } from '../lib/art';

// Decorative 3D emblem with a soft gold floor glow. Hidden from screen readers.
export default function Emblem({ slug, size = 'lg', className = '' }) {
  const src = ART[slug];
  if (!src) return null;
  return (
    <div className={`bc-emblem bc-emblem--${size} ${className}`} aria-hidden="true">
      <span className="bc-emblem-glow" />
      <img src={src} alt="" decoding="async" />
    </div>
  );
}
