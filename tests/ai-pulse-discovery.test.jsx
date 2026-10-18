import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiPulseDiscovery from '../src/components/AiPulseDiscovery.jsx';
beforeEach(()=>{sessionStorage.clear();window.scrollTo=vi.fn();globalThis.fetch=vi.fn();window.posthog={capture:vi.fn()};});
const mount=()=>render(<MemoryRouter><AiPulseDiscovery /></MemoryRouter>);
function start(){fireEvent.click(screen.getByRole('button',{name:/Find my opportunities/}));}
function choose(name){fireEvent.click(screen.getByRole('button',{name:new RegExp(name)}));}
function showEmptyResult(){start();choose('Not sure');fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));fireEvent.click(screen.getByRole('button',{name:/Show my AI starting points/}));}
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
it('asks about current work and teaches an idea after an unsure answer',()=>{
  mount();start();choose('Not sure');
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('What is it like finding the right document?');
  fireEvent.click(screen.getByRole('button',{name:/I would need to ask the team/}));
  expect(screen.getByRole('status')).toHaveTextContent('A searchable home for team knowledge');
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
it('learns after an answer, keeps choice focus and can go back without losing progress',()=>{mount();start();choose('Documents');fireEvent.click(screen.getByRole('button',{name:/Show me what could help/}));const answer=screen.getByRole('button',{name:/Finding documents slows us down/});answer.focus();fireEvent.click(answer);expect(answer).toHaveFocus();expect(screen.getByText(/An option worth exploring/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:/See my ideas/}));fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByRole('button',{name:/Finding documents slows us down/})).toHaveAttribute('aria-pressed','true');});
it('leads with useful starting points, keeps the scale optional and has no print or extra catalogue',()=>{
  const {container}=mount();showEmptyResult();
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Your AI starting points.');
  expect(container.querySelector('#pulse-ideas').compareDocumentPosition(container.querySelector('#pulse-scale')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('.pulse-scale-toggle')).not.toHaveAttribute('open');
  expect(screen.queryByRole('button',{name:/Print/})).not.toBeInTheDocument();
  expect(screen.queryByText('Curious what else is possible?')).not.toBeInTheDocument();
  expect(screen.getByText(/Your answers have not identified a gap/)).toBeInTheDocument();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('matches priority and HR questions with specific answers and preserves their categories',()=>{
  mount();start();choose('Deciding what comes first');choose('Handling everyday HR');
  fireEvent.click(screen.getByRole('button',{name:/Show me what could help/}));
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Which best describes how your team sets priorities?');
  fireEvent.click(screen.getByRole('button',{name:/People know what to work on first/}));
  fireEvent.click(screen.getByRole('button',{name:/Next area/}));
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Which best describes onboarding and routine staff questions?');
  fireEvent.click(screen.getByRole('button',{name:/We want to build more onboarding/}));
  fireEvent.click(screen.getByRole('button',{name:/See my ideas/}));
  fireEvent.click(screen.getByRole('button',{name:/Show my AI starting points/}));
  expect(screen.getByRole('heading',{name:'Reuse good HR starting points'})).toBeInTheDocument();
  expect(screen.getByRole('heading',{name:'Keep what works'})).toBeInTheDocument();
  const saved=Object.values(sessionStorage).map(v=>{try{return JSON.parse(v);}catch{return null;}}).find(v=>v?.answers);
  expect(saved.answers).toEqual({weeklyPriorities:'works',hrStartingPoints:'aspire'});
});
it('keeps newsletter consent separate from the free result and opens the existing tagged signup',()=>{
  mount();showEmptyResult();
  const invite=screen.getByRole('region',{name:'Stay in the loop with BlueChip'});
  expect(invite).toHaveTextContent('twice-monthly emails');
  expect(invite).toHaveTextContent('Optional and free. Unsubscribe at any time.');
  const link=screen.getByRole('link',{name:/Sign up for BlueChip Updates/});
  const destination=new URL(link.href);
  expect(destination.origin+destination.pathname).toBe('https://stats.sender.net/forms/b68O7R/view');
  expect(destination.searchParams.get('utm_source')).toBe('ai_pulse');
  expect(link).toHaveAttribute('target','_blank');
  expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(screen.queryByLabelText('Your email')).not.toBeInTheDocument();
  expect(globalThis.fetch).not.toHaveBeenCalled();
  fireEvent.click(link);
  expect(window.posthog.capture).toHaveBeenCalledWith('newsletter_signup_opened',{source:'ai_pulse',placement:'result'});
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('leads the paid next step with a conditional time-value example and preserves the findings-based refund',()=>{
  const {container}=mount();showEmptyResult();
  const offer=container.querySelector('#plan-next-step');
  expect(offer.querySelector('h2')).toHaveTextContent('Could three hours a week be worth 7× your investment?');
  expect(offer).toHaveTextContent('One-time investment: C$795');
  expect(offer.querySelector('.pulse-value-example')).toHaveTextContent('Illustration if achieved: 3 net team hours/week × 48 working weeks × C$40/hour = C$5,760/year');
  expect(offer).toHaveTextContent('This is not cash savings. Net allows for checking and upkeep.');
  expect(offer).toHaveTextContent('This covers plan findings, not actual implementation savings.');
  expect(offer).toHaveTextContent('The Pulse and its results are free.');
  expect(offer.querySelector('h2')).not.toHaveTextContent(/money back|guaranteed return/i);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('explicitly discloses sharing and preserves the visible result on an owner-record failure',async()=>{globalThis.fetch=vi.fn(async()=>({ok:false,json:async()=>({ok:false,emailSent:true,leadNotificationSent:false})}));const{container}=mount();showEmptyResult();fireEvent.click(screen.getByRole('button',{name:/Email my ideas/}));expect(screen.getByText(/completed answers, optional note and snapshot are shared with Thomas/)).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Your email'),{target:{value:'visitor@example.com'}});fireEvent.submit(container.querySelector('#pulse-email-form'));await waitFor(()=>expect(screen.getByText(/could not confirm the copy for Thomas/)).toBeInTheDocument());const sent=JSON.parse(globalThis.fetch.mock.calls[0][1].body);expect(sent.sharingNoticeVersion).toBe('ai-pulse-discovery-results-v2');expect(sent.shareCompletedCheck).toBe(true);expect(screen.getByText('C$48,000')).toBeInTheDocument();expect(window.posthog.capture.mock.calls.some(([,p])=>p?.email||p?.answers||p?.information)).toBe(false);});
it('keeps a bounded optional note in the tab until the disclosed email request',async()=>{
  globalThis.fetch=vi.fn(async()=>({ok:true,json:async()=>({ok:true,emailSent:true,leadNotificationSent:true})}));
  const {container}=mount();start();choose('Not sure');
  for(let i=0;i<3;i++)fireEvent.click(screen.getByRole('button',{name:/Skip this for now/}));
  const note=screen.getByRole('textbox',{name:/Anything we missed/});
  expect(note).toHaveAttribute('maxlength','600');expect(note).toHaveClass('ph-mask');
  fireEvent.change(note,{target:{value:'Tracking renewal dates'}});
  fireEvent.click(screen.getByRole('button',{name:/Show my AI starting points/}));
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(screen.queryByText('Tracking renewal dates')).not.toBeInTheDocument();
  expect(JSON.stringify(window.posthog.capture.mock.calls)).not.toContain('Tracking renewal dates');
  fireEvent.click(screen.getByRole('button',{name:/Email my ideas/}));
  expect(screen.getByText(/optional note and snapshot are shared with Thomas/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Your email'),{target:{value:'visitor@example.com'}});
  fireEvent.submit(container.querySelector('#pulse-email-form'));
  await waitFor(()=>expect(screen.getByText(/Your ideas were sent/)).toBeInTheDocument());
  expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).pulse.note).toBe('Tracking renewal dates');
});
