import { createContext } from 'react';

// Holds plasma-ui's <Plasma> component once the lazy chunk has loaded on a capable desktop, and
// null everywhere else, so <GlassPanel> can render either the WebGL surface or a plain element.
export const GlassSurfaceContext = createContext(null);
