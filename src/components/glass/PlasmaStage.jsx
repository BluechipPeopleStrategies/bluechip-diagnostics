// Lazy chunk: only fetched on a capable desktop (see src/lib/glassMode.js), so phones and the
// Squarespace iframe never download plasma-ui at all.
import { PlasmaProvider, Plasma } from '@cruxgarden/plasma-ui';
import { GlassSurfaceContext } from './GlassContext';

// Brand mood (docs/2026-09-25-plasma-ui-safety-and-design-fit.md): navy, deep navy, gold. The
// library's default iridescent rim and drifting rainbow sheen carry no meaning and are off-brand,
// so the rim is gold and the sheen is off. Pointer effects are off too: text that moves under
// the cursor is harder to read, and this is a page people read, not a toy.
const BLUECHIP_MOOD = {
  colors: ['#0B1A33', '#13243F', '#C9A24B'],
  // Small blend distance: the five step cards sit 14px apart and must read as five separate
  // steps, not one liquid band (they fused at 30).
  blend: 10,
  spring: { stiffness: 150, damping: 14 },
};

export default function PlasmaStage({ children }) {
  return (
    <PlasmaProvider
      mood={BLUECHIP_MOOD}
      theme="dark"
      radius={18}
      tint="#0B1A33"
      opacity={0.55}
      frost={0.55}
      elevation={0.4}
      rimColor="#C9A24B"
      rim={0.7}
      rimWidth={0.8}
      shimmer={0}
      dispersion={0.35}
      refraction={0.9}
      highlight={0.4}
      glow={0.5}
      grain={0.3}
      stretch={0}
      flow={0}
      pointerDrop={false}
      pointerPull={false}
      ambientDrops={false}
      formIn={false}
      quality={1}
      maxSurfaces={14}
    >
      <GlassSurfaceContext.Provider value={Plasma}>{children}</GlassSurfaceContext.Provider>
    </PlasmaProvider>
  );
}
