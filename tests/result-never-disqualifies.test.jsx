import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import { computeRange } from '../src/lib/aiOpportunity';
import { saveCheckSession } from '../src/lib/freeCheckSession';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const ANSWERS = {
  orgType: 'professional',
  areas: ['findingInfo'],
  toolsToday: ['m365'],
  aiTools: ['none'],
  information: ['public'],
  protectInfo: ['ownDevices'],
  readiness: 'yesHaveSomeone',
  orgSize: '11-50',
  owner: 'exec',
  heldBack: ['nothing'],
  feel: 'keen',
  timing: 'thisMonth',
};

describe('free check result never disqualifies a visitor', () => {
  it.each([
    ['0', 0, 1, 0],
    ['1', 4, 1, 1],
    ['3', 12, 1, 3],
    ['10+', 25, 2, 12.5],
  ])('keeps the plan CTA and qualification-neutral copy at %s likely hours', (_band, hours, people, expectedLikely) => {
    const rows = [{ area: 'findingInfo', hours, people }];
    expect(computeRange(rows).likely).toBe(expectedLikely);
    saveCheckSession({
      answers: ANSWERS,
      qIndex: 11,
      step: 'result',
      areaInputs: { findingInfo: { hours, people } },
    });

    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    const result = container.querySelector('main');
    expect(within(result).getByRole('link', { name: 'See how the plan works' })).toBeInTheDocument();
    expect(result.textContent).not.toMatch(/not qualify|don't qualify|do not qualify|ineligible|disqualif/i);
  });
});
