import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ResultsPage from '../src/components/ResultsPage';
import diagnostic from '../src/data/org-pulse.json';
import { CLARITY_CALL_ENABLED } from '../src/lib/siteFeatures';
afterEach(cleanup);
describe('Paused Clarity Call offer', () => {
 it('keeps results available without displaying a booking offer', () => {
   const answers = Object.fromEntries(diagnostic.questions.map(q => [q.id, 3]));
   render(<ResultsPage diagnostic={diagnostic} answers={answers} onRestart={() => {}} emailSubmitted={true} />);
   expect(CLARITY_CALL_ENABLED).toBe(false);
   expect(screen.queryByText(/clarity call/i)).not.toBeInTheDocument();
   expect(document.querySelector('a[href*="cal.com"]')).toBeNull();
   expect(screen.getByRole('button', {name:/Retake/})).toBeInTheDocument();
 });
});
