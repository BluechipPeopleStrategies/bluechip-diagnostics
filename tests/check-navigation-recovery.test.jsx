import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';

const KEY = 'bluechip:ai-opportunity-check:session';
const renderCheck = () => render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
const advance = () => act(() => { vi.advanceTimersByTime(1000); });

beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.useRealTimers(); });

describe('single-choice navigation recovery', () => {
  it('can continue with the same answer after going Back', () => {
    renderCheck();
    fireEvent.click(document.querySelector('input[name="orgType"][value="professional"]'));
    advance();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(document.querySelector('input[name="orgType"][value="professional"]')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/^Question 2 of 12/)).toBeInTheDocument();
  });

  it('can continue an answered single-choice question restored after refresh', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ v: 1, answers: { orgType: 'professional' }, qIndex: 0, step: 'questions' }));
    renderCheck();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/^Question 2 of 12/)).toBeInTheDocument();
  });

  it('lets a pointer user enter the optional role before continuing', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ v: 1, answers: { owner: 'exec' }, qIndex: 8, step: 'questions' }));
    renderCheck();
    const other = document.querySelector('input[name="owner"][value="someoneElse"]');
    fireEvent.pointerDown(other);
    fireEvent.click(other, { detail: 1 });
    advance();
    const field = screen.getByLabelText(/Who is it/);
    fireEvent.change(field, { target: { value: 'Operations lead' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/^Question 10 of 12/)).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(KEY)).ownerOtherText).toBe('Operations lead');
  });
});
