import { useEffect, useState } from 'react';
import { detectGlassMode } from '../../lib/glassMode';

// The layered light the CSS glass frosts: two soft orbs (gold high right, blue low left), a faint
// grid that shows it is glass (sharp outside a panel, frosted inside), and a thin gold ring.
function GlassGround() {
  return (
    <div className="glass-ground" aria-hidden="true">
      <span className="glass-orb glass-orb--gold" />
      <span className="glass-orb glass-orb--blue" />
      <span className="glass-orb glass-orb--low" />
      <span className="glass-grid" />
      <span className="glass-ring" />
    </div>
  );
}

// Renders the CSS glass immediately (fast first paint on every device), then, only on a capable
// desktop, lazy-loads plasma-ui and swaps the same panels onto the WebGL surface.
export default function GlassStage({ children }) {
  const [Stage, setStage] = useState(null);

  useEffect(() => {
    if (detectGlassMode() !== 'plasma') return undefined;
    let alive = true;
    import('./PlasmaStage')
      .then((m) => { if (alive) setStage(() => m.default); })
      .catch(() => { /* chunk failed: the CSS glass is already the finished page */ });
    return () => { alive = false; };
  }, []);

  const mode = Stage ? 'plasma' : 'css';
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.glass = mode;
    return () => { delete root.dataset.glass; };
  }, [mode]);

  if (Stage) return <Stage>{children}</Stage>;
  return <>{<GlassGround />}{children}</>;
}
