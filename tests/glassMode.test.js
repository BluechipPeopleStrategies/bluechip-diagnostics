import { describe, it, expect, vi } from 'vitest';
import { detectGlassMode } from '../src/lib/glassMode';

// A fake window: desktop, fine pointer, no reduced motion, top-level, WebGL2 available,
// unless a test overrides one piece.
function fakeWindow({ search = '', framed = false, reduced = false, desktop = true, gl = true, nav = {} } = {}) {
  const lose = vi.fn();
  const win = {
    location: { search },
    matchMedia: (q) => ({ matches: q.includes('prefers-reduced-motion') ? reduced : desktop }),
    navigator: { hardwareConcurrency: 8, deviceMemory: 8, ...nav },
    document: {
      createElement: () => ({ getContext: (type, opts) => (type === 'webgl2' && gl && !(gl === 'software' && opts?.failIfMajorPerformanceCaveat)
        ? { RENDERER: 0x1F01,
            getExtension: (name) => (name === 'WEBGL_lose_context' ? { loseContext: lose } : null),
            getParameter: () => (gl === 'swiftshader' ? 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)' : 'ANGLE (NVIDIA GeForce RTX)') }
        : null) }),
    },
  };
  win.self = win;
  win.top = framed ? {} : win;
  return win;
}

describe('glass mode (plasma only on a capable desktop)', () => {
  it('uses plasma on a capable top-level desktop with WebGL2', () => {
    expect(detectGlassMode(fakeWindow())).toBe('plasma');
  });
  it('keeps the CSS glass inside the Squarespace iframe', () => {
    expect(detectGlassMode(fakeWindow({ framed: true }))).toBe('css');
  });
  it('keeps the CSS glass under prefers-reduced-motion', () => {
    expect(detectGlassMode(fakeWindow({ reduced: true }))).toBe('css');
  });
  it('keeps the CSS glass on phones and touch screens', () => {
    expect(detectGlassMode(fakeWindow({ desktop: false }))).toBe('css');
  });
  it('keeps the CSS glass on low-power or data-saver devices', () => {
    expect(detectGlassMode(fakeWindow({ nav: { hardwareConcurrency: 2 } }))).toBe('css');
    expect(detectGlassMode(fakeWindow({ nav: { deviceMemory: 2 } }))).toBe('css');
    expect(detectGlassMode(fakeWindow({ nav: { connection: { saveData: true } } }))).toBe('css');
  });
  it('keeps the CSS glass without WebGL2, or with only a software renderer', () => {
    expect(detectGlassMode(fakeWindow({ gl: false }))).toBe('css');
    expect(detectGlassMode(fakeWindow({ gl: 'software' }))).toBe('css');
    expect(detectGlassMode(fakeWindow({ gl: 'swiftshader' }))).toBe('css');
  });
  it('honours ?glass=css and ?glass=plasma for QA, but forced plasma still needs WebGL2', () => {
    expect(detectGlassMode(fakeWindow({ search: '?glass=css' }))).toBe('css');
    expect(detectGlassMode(fakeWindow({ search: '?glass=plasma', desktop: false, gl: 'software' }))).toBe('plasma');
    expect(detectGlassMode(fakeWindow({ search: '?glass=plasma', gl: false }))).toBe('css');
  });
  it('is css when there is no window (server render)', () => {
    expect(detectGlassMode(undefined)).toBe('css');
  });
});
