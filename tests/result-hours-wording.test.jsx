import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import { saveCheckSession } from '../src/lib/freeCheckSession';

afterEach(() => { cleanup(); sessionStorage.clear(); });

function showResult(area, hours) {
  saveCheckSession({
    step: 'result', headcount: 1,
    answers: {
      orgType: 'professional', areas: [area], toolsToday: ['m365'], aiTools: ['none'],
      information: ['public'], protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone',
      orgSize: '1-10', owner: 'exec', heldBack: ['nothing'], feel: 'keen', timing: 'thisMonth',
    },
    areaInputs: { [area]: { hours, people: 1 } },
  });
  return render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>).container;
}

it('renders a low under 1 with a likely of 1 or more as "Up to about 1 hour", with no decimals, in the headline and both weekly tiles', () => {
  // correspondence, 5 hours, 1 person: low 0.6, likely 1.1
  const container = showResult('correspondence', 5);
  expect(container.querySelector('.ai-result-headline')).toHaveTextContent('Up to about 1 hour a week');
  expect(container.querySelector('.ai-stat-tile strong')).toHaveTextContent(/^Up to about 1$/);
  expect(container.querySelector('.ai-headcount-section .ai-stat-tile strong')).toHaveTextContent(/^Up to about 1$/);
  expect(container.querySelector('.ai-result-headline').textContent).not.toMatch(/\d\.\d/);
});

it('renders a wholly sub-hour estimate without a repeated endpoint or plural hour', () => {
  const container = showResult('scheduling', 0.5);
  expect(container.querySelector('.ai-result-headline')).toHaveTextContent('Under 1 hour a week');
  expect(container.querySelector('.ai-stat-tile strong')).toHaveTextContent(/^Under 1$/);
});
