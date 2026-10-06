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

it('renders the reported low estimate consistently in the headline and both weekly tiles', () => {
  const container = showResult('correspondence', 5);
  expect(container.querySelector('.ai-result-headline')).toHaveTextContent('About 0.6 to 1 hours a week');
  expect(container.querySelector('.ai-stat-tile strong')).toHaveTextContent(/^0.6 to 1$/);
  expect(container.querySelector('.ai-headcount-section .ai-stat-tile strong')).toHaveTextContent(/^0.6 to 1$/);
});

it('renders a wholly sub-hour estimate without a repeated endpoint or plural hour', () => {
  const container = showResult('scheduling', 0.5);
  expect(container.querySelector('.ai-result-headline')).toHaveTextContent('Under 1 hour a week');
  expect(container.querySelector('.ai-stat-tile strong')).toHaveTextContent(/^under 1$/);
});
