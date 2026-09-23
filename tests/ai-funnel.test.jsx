import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import AiAuditPage from '../src/components/AiAuditPage';
import { getOpportunity, questions } from '../src/lib/aiOpportunity';

afterEach(cleanup);
const ready = { organisation:'business', workflow:'reporting', tools:'microsoft', workload:'5plus', sensitivity:'public', readiness:'ready' };
describe('AI opportunity routing', () => {
  it('prioritises permissions over purchase readiness', () => {
    expect(getOpportunity({...ready, sensitivity:'sensitive'}).route).toBe('permissions');
    expect(getOpportunity({...ready, readiness:'permissions'}).route).toBe('permissions');
  });
  it('does not treat low or unknown workload as qualifying savings', () => {
    for (const workload of ['under5', 'unsure']) expect(getOpportunity({...ready, workload}).route).toBe('baseline');
    expect(getOpportunity(ready).route).toBe('audit');
    expect(getOpportunity({...ready,readiness:'exploring'}).route).toBe('explore');
  });
  it('rejects unknown workflow values safely', () => {
    expect(getOpportunity({...ready,workflow:'<script>'}).label).toBe('Your recurring work');
  });
  it('keeps incomplete submissions on the check', () => {
    const {container} = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.submit(container.querySelector('form'));
    expect(screen.queryByText('Your next practical step')).not.toBeInTheDocument();
  });
  it('carries only the workflow category to the audit and preserves answers on review', () => {
    const {container} = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    questions.forEach(q => fireEvent.click(container.querySelector(`input[name="${q.id}"][value="${ready[q.id]}"]`)));
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByRole('link', {name:'See what your AI audit includes'})).toHaveAttribute('href','/ai-audit?workflow=reporting');
    expect(screen.getByText(/not a savings estimate/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Review my answers'}));
    expect(container.querySelector('input[name="workflow"][value="reporting"]')).toBeChecked();
  });
  it('discloses organisational tax-inclusive price, scope and no live checkout', () => {
    render(<MemoryRouter initialEntries={['/ai-audit?workflow=reporting']}><AiAuditPage /></MemoryRouter>);
    expect(screen.getByText('C$999 per organisation')).toBeInTheDocument();
    expect(screen.getByText(/Including applicable tax/)).toBeInTheDocument();
    expect(screen.getByText(/One 60-minute discovery/)).toBeInTheDocument();
    expect(screen.getByText(/five business days/)).toBeInTheDocument();
    expect(screen.getByText(/An inquiry does not create a booking or take payment/)).toBeInTheDocument();
    expect(screen.queryByRole('link', {name:/pay and book/i})).not.toBeInTheDocument();
  });
});
