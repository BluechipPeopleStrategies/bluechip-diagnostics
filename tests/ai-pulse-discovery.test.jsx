import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiPulseDiscovery from '../src/components/AiPulseDiscovery.jsx';
beforeEach(()=>{sessionStorage.clear();window.scrollTo=vi.fn();globalThis.fetch=vi.fn();window.posthog={capture:vi.fn()};});
const mount=()=>render(<MemoryRouter><AiPulseDiscovery /></MemoryRouter>);
function start(){fireEvent.click(screen.getByRole('button',{name:/Find my opportunities/}));}
function choose(name){fireEvent.click(screen.getByRole('button',{name:new RegExp(name)}));}
function showEmptyResult(){start();choose('Not sure');fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Show my opportunity snapshot/}));}
it('lets all ten work areas be chosen and requires no workload arithmetic',()=>{const{container}=mount();start();const choices=container.querySelectorAll('[data-family]');expect(choices).toHaveLength(10);for(const button of choices)fireEvent.click(button);expect(container.querySelectorAll('[data-family][aria-pressed=true]')).toHaveLength(10);expect(container.querySelector('input[type=number]')).toBeNull();});
it('groups familiar work and previews an idea without recording an answer',()=>{
  mount();start();
  expect(screen.getByRole('region',{name:'Information & insight'})).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Communication & content'})).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'People & progress'})).toBeInTheDocument();
  choose('Keeping commitments');
  expect(screen.getByRole('status',{name:'A possibility to explore'})).toHaveTextContent('Turn meeting notes into proposed owners, actions and dates.');
  const saved=Object.values(sessionStorage).map(v=>{try{return JSON.parse(v);}catch{return null;}}).find(v=>v?.families);
  expect(saved.answers).toEqual({});
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('teaches one possibility before requiring an answer on the unsure path',()=>{
  mount();start();choose('Not sure');
  expect(screen.getByRole('region',{name:'An example to consider'})).toHaveTextContent('A searchable home for team knowledge');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('discloses the optional fee after selection without interrupting the free check',()=>{
  mount();start();
  expect(screen.queryByRole('complementary',{name:'Optional plan pricing'})).not.toBeInTheDocument();
  choose('Documents');
  const disclosure=screen.getByRole('complementary',{name:'Optional plan pricing'});
  expect(disclosure).toHaveTextContent('Your AI Pulse and results are free.');
  expect(disclosure).toHaveTextContent('C$795');
  expect(screen.getByRole('button',{name:/Documents/})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByRole('button',{name:/Show me what could help/})).toBeEnabled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(globalThis.fetch).not.toHaveBeenCalled();
  choose('Documents');
  expect(screen.queryByRole('complementary',{name:'Optional plan pricing'})).not.toBeInTheDocument();
});
it('learns after an answer, keeps choice focus and can go back without losing progress',()=>{mount();start();choose('Documents');fireEvent.click(screen.getByRole('button',{name:/Show me what could help/}));const answer=screen.getByRole('button',{name:/too much effort/});answer.focus();fireEvent.click(answer);expect(answer).toHaveFocus();expect(screen.getByText(/An option worth exploring/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:/See my snapshot/}));fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByRole('button',{name:/too much effort/})).toHaveAttribute('aria-pressed','true');});
it('shows free results with fixed scale before long ideas and no invented hours',()=>{const{container}=mount();showEmptyResult();expect(screen.getByText('C$48,000')).toBeInTheDocument();expect(container.querySelector('#pulse-scale').compareDocumentPosition(container.querySelector('#pulse-ideas'))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(screen.getByText(/not a result calculated from your answers/)).toBeInTheDocument();expect(screen.getByText(/No opportunity has been assumed/)).toBeInTheDocument();expect(globalThis.fetch).not.toHaveBeenCalled();});
it('explicitly discloses sharing and preserves the visible result on an owner-record failure',async()=>{globalThis.fetch=vi.fn(async()=>({ok:false,json:async()=>({ok:false,emailSent:true,leadNotificationSent:false})}));const{container}=mount();showEmptyResult();fireEvent.click(screen.getByRole('button',{name:/Keep my free snapshot/}));expect(screen.getByText(/completed answers and snapshot are shared with Thomas/)).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Your email'),{target:{value:'visitor@example.com'}});fireEvent.submit(container.querySelector('#pulse-email-form'));await waitFor(()=>expect(screen.getByText(/could not confirm the copy for Thomas/)).toBeInTheDocument());const sent=JSON.parse(globalThis.fetch.mock.calls[0][1].body);expect(sent.sharingNoticeVersion).toBe('ai-pulse-discovery-results-v1');expect(sent.shareCompletedCheck).toBe(true);expect(screen.getByText('C$48,000')).toBeInTheDocument();expect(window.posthog.capture.mock.calls.some(([,p])=>p?.email||p?.answers||p?.information)).toBe(false);});
