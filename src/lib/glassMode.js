// Which glass the plan page draws (2026-09-25, plasma-ui trial).
//
// 'plasma' = WebGL2 liquid glass from @cruxgarden/plasma-ui, lazy-loaded. Its author is explicit
//            that it is GPU-heavy and belongs on desktop, so it only runs on a capable desktop.
// 'css'    = the frosted CSS glass every other visitor gets. It is the finished design, not a
//            degraded one: most visitors (phones, the Squarespace iframe, reduced motion) see it.
//
// A ?glass=css or ?glass=plasma query forces a path for QA. Forcing plasma still requires WebGL2.

function webgl2Available(doc, strict) {
  try {
    const canvas = doc.createElement('canvas');
    // failIfMajorPerformanceCaveat refuses software renderers (SwiftShader, blocklisted GPUs),
    // which is exactly the "low-power device" case the CSS path is for.
    const gl = canvas.getContext('webgl2', strict ? { failIfMajorPerformanceCaveat: true } : undefined);
    if (!gl) return false;
    let software = false;
    if (strict) {
      // Chrome does not always raise the performance caveat for its software fallback (headless
      // runs got plasma with --disable-gpu), so also refuse a renderer that names itself as one.
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
      software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !software;
  } catch {
    return false;
  }
}

export function detectGlassMode(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win || !win.document) return 'css';
  let forced = null;
  try { forced = new URLSearchParams(win.location?.search || '').get('glass'); } catch { /* ignore */ }
  if (forced === 'css') return 'css';

  const mq = (q) => { try { return !!win.matchMedia?.(q).matches; } catch { return false; } };

  if (forced !== 'plasma') {
    // Inside the Squarespace iframe the viewport is sized to the whole page height, and plasma
    // draws a full-viewport canvas, so the GPU cost would scale with the page. CSS glass only.
    try { if (win.self !== win.top) return 'css'; } catch { return 'css'; }
    if (mq('(prefers-reduced-motion: reduce)')) return 'css';
    if (!mq('(min-width: 1024px) and (hover: hover) and (pointer: fine)')) return 'css';
    const nav = win.navigator || {};
    if (nav.connection?.saveData) return 'css';
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return 'css';
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return 'css';
  }
  return webgl2Available(win.document, forced !== 'plasma') ? 'plasma' : 'css';
}
