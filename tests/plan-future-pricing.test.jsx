import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage.jsx';
vi.mock('../src/lib/chatWidget.js',()=>({loadChatWidget:vi.fn()}));
it.each(['general','public-sector'])('keeps current pricing qualified, credits the actual fee and shows scale: %s',edition=>{
  const {container}=render(<MemoryRouter><AiHandoffPlanPage edition={edition}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'What your AI Handoff Plan includes'})).toBeInTheDocument();
  expect(screen.getByRole('complementary',{name:'Fee & availability'})).toHaveTextContent('C$795');
  expect(screen.getByText(/Pricing for future bookings may change at BlueChip's sole discretion/)).toBeInTheDocument();
  expect(screen.getByText(/eligible plan fee you paid/)).toBeInTheDocument();
  expect(screen.getByText('C$48,000')).toBeInTheDocument();
  expect(container.querySelector('#pulse-scale').compareDocumentPosition(container.querySelector('#ai-price-title')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
