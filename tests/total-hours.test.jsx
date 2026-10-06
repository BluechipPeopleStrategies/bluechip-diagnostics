import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import TotalHours from '../src/components/TotalHours';
import { totalHoursRangeLabel } from '../src/lib/aiOpportunity';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('total hours display', () => {
  it.each([
    [0, 0, '0'],
    [0.025, 0.06, 'under 1'],
    [0.6, 0.9, 'under 1'],
    [0.6, 1.1, '0.6 to 1'],
    [0.6, 2.2, '0.6 to 2'],
    [1, 1.4, '1'],
    [2.1, 2.4, '2'],
    [2.4, 4.6, '2 to 5'],
  ])('formats %s to %s hours as %s', (low, likely, expected) => {
    expect(totalHoursRangeLabel(low, likely)).toBe(expected);
  });

  it.each([
    [0, 0, 'About 0 hours a week'],
    [0.025, 0.06, 'Under 1 hour a week'],
    [0.6, 1.1, 'About 0.6 to 1 hours a week'],
    [1, 1.4, 'About 1 hour a week'],
    [2.1, 2.4, 'About 2 hours a week'],
    [2.4, 4.6, 'About 2 to 5 hours a week'],
  ])('renders the complete estimate for %s to %s', (low, likely, expected) => {
    const { container } = render(<TotalHours low={low} likely={likely} headline />);
    expect(container.textContent).toBe(expected);
  });

  it('uses the same range in summary tiles and after an updated estimate', () => {
    const { container, rerender } = render(<TotalHours low={0.6} likely={1.1} />);
    expect(container.textContent).toBe('0.6 to 1');
    rerender(<TotalHours low={1} likely={1.4} />);
    expect(container.textContent).toBe('1');
    rerender(<TotalHours low={0.6} likely={0.9} headline />);
    expect(container.textContent).toBe('Under 1 hour a week');
  });

  it('keeps units consistent during an animated update across one hour', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { container, rerender } = render(<TotalHours low={0.2} likely={0.4} headline />);
    rerender(<TotalHours low={1} likely={1.4} headline />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(container.textContent).not.toContain('under 1 to');
    expect(container.textContent).not.toContain('1 to 1');
    act(() => { vi.advanceTimersByTime(600); });
    expect(container.textContent).toBe('About 1 hour a week');
  });
});
