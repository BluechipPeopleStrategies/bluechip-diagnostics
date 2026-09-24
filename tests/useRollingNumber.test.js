import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRollingNumber } from '../src/lib/useRollingNumber';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function stubMatchMedia(reduced) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: reduced && query.indexOf('prefers-reduced-motion') !== -1,
    media: query, addEventListener() {}, removeEventListener() {},
  }));
}

describe('useRollingNumber: reduced motion', () => {
  it('jumps straight to the target with no animation', () => {
    stubMatchMedia(true);
    const { result, rerender } = renderHook(({ target }) => useRollingNumber(target), { initialProps: { target: 0 } });
    expect(result.current).toBe(0);
    rerender({ target: 100 });
    expect(result.current).toBe(100);
  });
});

describe('useRollingNumber: animated path', () => {
  it('eventually converges on the target value after the tween duration', () => {
    stubMatchMedia(false);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { result, rerender } = renderHook(({ target }) => useRollingNumber(target, { duration: 400 }), { initialProps: { target: 0 } });
    act(() => { rerender({ target: 100 }); });
    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current).toBe(100);
  });
  it('retargets smoothly mid-animation instead of jumping back to the old start', () => {
    stubMatchMedia(false);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { result, rerender } = renderHook(({ target }) => useRollingNumber(target, { duration: 400 }), { initialProps: { target: 0 } });
    act(() => { rerender({ target: 100 }); });
    act(() => { vi.advanceTimersByTime(200); }); // partway through the first tween
    const mid = result.current;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    act(() => { rerender({ target: 50 }); }); // retarget before the first tween finished
    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current).toBe(50);
  });
});
