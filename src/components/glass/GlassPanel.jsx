import { createElement, useContext } from 'react';
import { GlassSurfaceContext } from './GlassContext';

// One glass panel, two renderers. With plasma loaded it becomes a <Plasma> surface (the WebGL
// canvas draws the material behind the ordinary DOM content); otherwise it is the same element
// with the CSS frosted-glass classes. Content, semantics and layout are identical on both paths.
// `plasma` carries per-surface material settings (tint, opacity, frost, elevation, radius).
export default function GlassPanel({ as: Tag = 'div', className = '', plasma, children, ...rest }) {
  const Surface = useContext(GlassSurfaceContext);
  if (Surface) {
    // createElement, not JSX: Surface is a stable module-level component handed down through
    // context (plasma-ui's <Plasma>), not one created during render.
    return createElement(Surface, { as: Tag, className: `${className} is-plasma`, lean: false, ...plasma, ...rest }, children);
  }
  return <Tag className={className} {...rest}>{children}</Tag>;
}
