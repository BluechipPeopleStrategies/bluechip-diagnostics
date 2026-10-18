import { useEffect, useRef, useState } from 'react';
import SiteHeader from './SiteHeader.jsx';
import PulseScale from './PulseScale.jsx';
import PulseNewsletterInvite from './PulseNewsletterInvite.jsx';
import PulseWorkAreas from './PulseWorkAreas.jsx';
import PulseIdeaCards from './PulseIdeaCards.jsx';
import { pulseAnswerChoices } from '../data/pulseAnswerCopy.js';
import { dollars, FUTURE_PRICE_NOTICE, PLAN_CAPACITY_NOTICE } from '../lib/planPricing.js';
import { usePageMeta } from '../lib/seo.js';
import { getAttribution } from '../lib/attribution.js';
import { trackEvent } from '../lib/checkAnalytics.js';
import { loadChatWidget } from '../lib/chatWidget.js';
import { FAMILIES, PULSE_VERSION, SHARING_NOTICE, PLAN_FEE, SAFETY_NET, freshPulse, loadPulse, savePulse, pulseQuestions, pulseSnapshot } from '../lib/pulseDiscovery.js';
import './AiPulseDiscovery.css';

const PLAN = '/ai-handoff-plan';
const HELP = [['none','Nothing yet'],['part','A tool or process helps with part of it'],['underused','We have tools we could use more fully'],['unknown','Not sure']];
const INFO = [['public','Public or non-sensitive information'],['internal','Internal work information'],['confidential','Personal, client or other confidential information'],['unknown','Not sure yet']];
const TOOLS = [['m365','Microsoft 365'],['google','Google Workspace'],['mixed','A mix of tools'],['other','Something else'],['unknown','Not sure']];
const options = list => list.map(([value,label]) => <option key={value} value={value}>{label}</option>);

function Insight({ item, state, setHelp }) {
  const answer = state.answers[item.id]; if (!answer) return null;
  if (answer === 'na') return <div className="pulse-insight" role="status">This stays out of your opportunity list. You can change it any time.</div>;
  return <div className={`pulse-insight${answer === 'unknown' ? ' pulse-insight-wisdom' : ''}`} role="status">{answer === 'unknown' && <img src="/art/ai-pulse-wisdom-book-v1.webp" width="64" height="64" alt="" />}<div><p className="pulse-small">{answer === 'works' ? 'Keep what already works.' : answer === 'unknown' ? 'A useful question for your team:' : answer === 'aspire' ? 'A way to make room for work you would like to do:' : 'An option worth exploring:'}</p><h3>{item.capability}</h3><p>{item.explain}</p>{answer === 'friction' && <label className="pulse-field">Does anything already help with this?<select value={state.help[item.id] || ''} onChange={e => setHelp(item.id,e.target.value)}><option value="">Optional: choose what fits</option>{options(HELP)}</select></label>}</div></div>;
}
function EmailSnapshot({ state }) {
  const [email,setEmail] = useState(''), [include,setInclude] = useState(false), [trap,setTrap] = useState(''), [status,setStatus] = useState('idle');
  async function submit(event) {
    event.preventDefault(); if (status === 'sending') return;
    setStatus('sending'); trackEvent('check_results_email_requested',{check_variant:'discovery_v1',include_answers:include});
    try {
      const res = await fetch(import.meta.env.VITE_SUBMIT_ENDPOINT || '/api/submit',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({diagnosticId:'ai-opportunity-check',email,pulseVersion:PULSE_VERSION,pulse:state,shareCompletedCheck:true,sharingNoticeVersion:SHARING_NOTICE,includeAnswers:include,bc_hp_trap:trap,attribution:getAttribution()})});
      const data = await res.json();
      const complete = res.ok && data.ok === true && data.leadNotificationSent === true;
      setStatus(complete ? data.emailSent ? 'sent' : 'visitorFailed' : data.emailSent ? 'ownerPending' : 'error');
      trackEvent(complete ? 'check_results_email_accepted' : 'check_results_email_failed',{check_variant:'discovery_v1',visitor_email_accepted:data.emailSent === true,owner_recorded:data.leadNotificationSent === true});
    } catch { setStatus('error'); trackEvent('check_results_email_failed',{check_variant:'discovery_v1',failure:'network'}); }
  }
  return <section className="pulse-panel" id="pulse-email" aria-labelledby="pulse-email-title"><h2 id="pulse-email-title">Email your AI starting points</h2><p>Your email, completed answers, optional note and snapshot are shared with Thomas at BlueChip to understand your result, develop useful workplace content and help organizations improve how they use AI in practice. You receive one results email. Newsletter signup is a separate choice. Please do not enter confidential information.</p><form id="pulse-email-form" onSubmit={submit}><label className="pulse-field">Your email<input type="email" name="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label><label className="pulse-check"><input type="checkbox" checked={include} onChange={e=>setInclude(e.target.checked)} />Include my answers in my own email too</label><div className="pulse-trap" aria-hidden="true"><label>Leave this empty<input tabIndex={-1} autoComplete="off" name="bc_hp_trap" value={trap} onChange={e=>setTrap(e.target.value)} /></label></div><button className="pulse-button" disabled={status === 'sending'}>{status === 'sending' ? 'Sending...' : 'Email my ideas'}</button><div role="status">{status === 'sent' && <p>Your ideas were sent. Check your inbox or spam folder.</p>}{status === 'visitorFailed' && <p>Thomas received your snapshot, but your email could not be sent. Your ideas stay here; you can contact thomas@bluechip-people-strategies.com.</p>}{status === 'ownerPending' && <p>Your email was sent, but we could not confirm the copy for Thomas. Your result stays here. Contact thomas@bluechip-people-strategies.com for help.</p>}{status === 'error' && <p>Something went wrong. Your result stays here. Try again or contact thomas@bluechip-people-strategies.com.</p>}</div></form></section>;
}
export default function AiPulseDiscovery() {
  usePageMeta('AI Pulse: discover practical AI opportunities | BlueChip','Discover practical ways to make work easier. Free opportunities and next steps, with no email or purchase required.');
  const [state,setState] = useState(loadPulse), [emailOpen,setEmailOpen] = useState(false);
  const heading = useRef(null), emailHeading = useRef(null), started = useRef(state.screen !== 'intro'), resultViewed = useRef(false);
  const questions = pulseQuestions(state), question = questions[state.questionIndex], result = pulseSnapshot(state);
  useEffect(()=>{ loadChatWidget(); },[]);
  const update = changes => setState(s=>({...s,...changes}));
  function go(screen,changes={}) { setState(s=>({...s,...changes,screen})); window.scrollTo?.(0,0); }
  useEffect(()=>savePulse(state),[state]);
  useEffect(()=>{ heading.current?.focus(); },[state.screen,state.questionIndex]);
  useEffect(()=>{ if(state.screen === 'questions') trackEvent('check_question_viewed',{check_variant:'discovery_v1',question_id:question?.id || 'none',question_number:state.questionIndex+1,total_questions:questions.length}); },[state.screen,state.questionIndex,question?.id,questions.length]);
  const exploredCount = Object.keys(state.answers).length;
  useEffect(()=>{if(state.screen === 'result' && !resultViewed.current)trackEvent('check_result_viewed',{check_variant:'discovery_v1',explored_count:exploredCount});resultViewed.current=state.screen === 'result';},[state.screen,exploredCount]);
  useEffect(()=>{if(emailOpen){emailHeading.current?.scrollIntoView?.({block:'start'});document.querySelector('#pulse-email input[type=email]')?.focus();}},[emailOpen]);
  function start() { if(!started.current){started.current=true;trackEvent('check_started',{check_variant:'discovery_v1'});} go('choose'); }
  function toggle(id) { setState(s=>({...s,families:s.families.includes(id)?s.families.filter(v=>v!==id):[...s.families,id]})); }
  function answer(id,value) { setState(s=>{const answers={...s.answers},help={...s.help};if(value)answers[id]=value;else delete answers[id];if(value !== 'friction')delete help[id];return {...s,answers,help};}); }
  const setHelp = (id,value) => setState(s=>({...s,help:{...s.help,[id]:value}}));
  function next(skip=false) { if(skip && question)answer(question.id,'');if(state.questionIndex < questions.length-1)go('questions',{questionIndex:state.questionIndex+1});else go('context'); }
  function choices(item) { return <div className="pulse-options" role="group" aria-label="Your situation">{pulseAnswerChoices(item).map(({value,label,hint})=><button key={value} type="button" className="pulse-choice" aria-pressed={state.answers[item.id]===value} onClick={()=>answer(item.id,value)}><strong>{label}</strong><span>{hint}</span></button>)}</div>; }
  const count = result.opportunities.length + result.future.length;
  return <div className="pulse-shell"><SiteHeader /><main className={`pulse-page ${['intro','choose'].includes(state.screen) ? 'pulse-page-wide' : ''}`}>
    {state.screen !== 'intro' && <ol className="pulse-progress" aria-label="Progress">{['Choose your work','Explore ideas','Your ideas'].map((label,i)=><li key={label} aria-current={(state.screen==='choose'?0:state.screen==='result'?2:1)===i?'step':undefined}><span aria-hidden="true">{i+1}</span>{label}</li>)}</ol>}
    {state.screen === 'intro' && <>
      <section className="pulse-intro-hero">
        <div className="pulse-intro-copy">
          <p className="pulse-eyebrow">Free AI Pulse <span className="pulse-time">About 3–4 minutes</span></p>
          <h1 ref={heading} tabIndex={-1}>Where could your organization be losing time and money?</h1>
          <p className="pulse-lead">Discover everyday work AI could help simplify or automate, including opportunities you may not know exist. No technical knowledge needed. Just start with what your people do day to day.</p>
          <ul className="pulse-promises"><li>Free check and results</li><li>No email required</li><li>One useful starting step</li></ul>
          <div className="pulse-actions"><button className="pulse-button" onClick={start}>Find my opportunities →</button></div>
        </div>
        <figure className="pulse-intro-art"><img src="/art/ai-pulse-abstract-v3-20261018.webp" width="1536" height="1024" fetchPriority="high" alt="Abstract navy and gold forms connected around a clear cube, suggesting connected work and new possibilities." /></figure>
      </section>
      <p className="pulse-small pulse-sharing-note">The check is free. Please leave out confidential information.</p>
    </>}
    {state.screen === 'choose' && <>
      <p className="pulse-eyebrow">Everyday work, practical possibilities</p>
      <h1 ref={heading} tabIndex={-1}>Start with work you recognize.</h1>
      <p className="pulse-lead">Choose all that apply, even if they already work well. We’ll explore up to three quick examples.</p>
      <PulseWorkAreas selected={state.families} onToggle={toggle} />
      <div className="pulse-choice-footer"><p role="status">{state.families.length} work {state.families.length===1?'area':'areas'} selected.</p><div className="pulse-actions"><button className="pulse-button" disabled={!state.families.length} onClick={()=>go('questions',{questionIndex:0})}>Show me what could help →</button><button className="pulse-text" onClick={()=>go('questions',{families:['knowledge','priorities','industry'],questionIndex:0})}>Not sure where to start? Show me some possibilities</button></div></div>
      <p className="pulse-plan-bridge">Want to go further? <a href={PLAN}>AI Handoff Plan discovery</a> explores these areas and other opportunities across the work we agree to review.</p>
      {state.families.length > 0 && <aside className="pulse-price-disclosure" aria-label="Optional plan pricing"><p>Your AI Pulse and results are free. If you want a tailored AI Handoff Plan, the current one-time fee is <strong>{dollars(PLAN_FEE)}</strong>.</p></aside>}
    </>}
    {state.screen === 'questions' && question && <><p className="pulse-eyebrow">{state.questionIndex+1} of {questions.length}</p><h1 ref={heading} tabIndex={-1}>{question.prompt}</h1><p>Choose the closest fit. There is no right answer, and you do not need to use AI for this to work well.</p><p className="pulse-question-context">Think about: {FAMILIES.find(f=>f.id===question.family)?.cue.toLowerCase()}.</p>{choices(question)}<Insight item={question} state={state} setHelp={setHelp} /><div className="pulse-actions"><button className="pulse-button secondary" onClick={()=>state.questionIndex?go('questions',{questionIndex:state.questionIndex-1}):go('choose')}>Back</button><button className="pulse-button" onClick={()=>next()}>{state.questionIndex===questions.length-1?'See my ideas':'Next area →'}</button><button className="pulse-text" onClick={()=>next(true)}>Skip this for now</button></div></>}
    {(state.screen === 'context' || state.screen === 'questions' && !question) && <><p className="pulse-eyebrow">One useful check</p><h1 ref={heading} tabIndex={-1}>What kind of information is involved?</h1><p className="pulse-lead">This helps keep the next steps sensible. No documents, account access or private details are needed.</p><section className="pulse-panel"><label className="pulse-field">Information your team would use<select value={state.information} onChange={e=>update({information:e.target.value})}><option value="">Choose, or leave this unanswered</option>{options(INFO)}</select></label><label className="pulse-field">What does your team already work in?<select value={state.tools} onChange={e=>update({tools:e.target.value})}><option value="">Optional</option>{options(TOOLS)}</select></label><p className="pulse-small">We will start with what you already have. Whether a feature is included or needs a subscription must be checked against your actual tools and licence.</p><label className="pulse-field">Anything we missed? (optional)<textarea className="ph-no-capture ph-mask" data-ph-mask="true" name="pulse_note" maxLength={600} rows={4} value={state.note} onChange={e=>update({note:e.target.value})} aria-describedby="pulse-note-help" placeholder="For example, a task that keeps getting put off." /></label><p id="pulse-note-help" className="pulse-small">Up to 600 characters. Leave out names and confidential details. This stays in your tab unless you choose to email your snapshot.</p></section><div className="pulse-actions"><button className="pulse-button secondary" onClick={()=>go('questions',{questionIndex:Math.max(0,questions.length-1)})}>Back</button><button className="pulse-button" onClick={()=>go('result')}>Show my AI starting points →</button></div></>}
    {state.screen === 'result' && <>
      <p className="pulse-eyebrow">Your free AI Pulse takeaway</p>
      <h1 ref={heading} tabIndex={-1}>Your AI starting points.</h1>
      <p className="pulse-lead">{count ? `${Math.min(count,3)} practical ${count === 1 ? 'idea' : 'ideas'} to explore, with one first step to try.` : 'Keep what works. Ask one useful question. Choose your next step.'}</p>
      <p className="pulse-small">Based on the areas you chose. This is a starting point, not a time-savings estimate.</p>
      <PulseIdeaCards result={result} onChoose={id => update({priority:id})} />
      <div className="pulse-takeaway-actions"><div><h2>Keep your ideas handy.</h2><p>One free email. Newsletter signup is a separate choice.</p></div><button className="pulse-button" onClick={()=>setEmailOpen(true)}>Email my ideas →</button></div>
      {emailOpen && <div ref={emailHeading}><EmailSnapshot state={state} /></div>}
      <details className="pulse-scale-toggle"><summary>See how a small weekly time saving adds up</summary><PulseScale /></details>
      <section className="pulse-panel pulse-next" id="plan-next-step">
        <p className="pulse-eyebrow">Want a plan for your actual work?</p>
        <h2>Go further with the AI Handoff Plan.</h2>
        <p>Explore these areas and other opportunities across the work we agree to review. Get practical priorities, tool choices and an evidence-backed time estimate.</p>
        <h3>Current one-time fee: {dollars(PLAN_FEE)}</h3>
        <p className="pulse-small">{SAFETY_NET}</p>
        <p className="pulse-capacity">{PLAN_CAPACITY_NOTICE}</p>
        <div className="pulse-actions"><a className="pulse-button" href={PLAN}>See how the plan works →</a></div>
        <p className="pulse-small">The Pulse and its results are free. The AI Handoff Plan is a separate paid service. {FUTURE_PRICE_NOTICE}</p>
        <hr /><h3>Not sure whether the AI Handoff Plan is right for your team?</h3><a className="pulse-button secondary" href="#chat?topic=ai-handoff-plan">Ask us →</a>
      </section>
      <p className="pulse-small">Use a non-sensitive example in tools your organization approves. Check permissions and who reviews the work before trying an integration.</p>
      <PulseNewsletterInvite />
      <div className="pulse-actions"><button className="pulse-button secondary" onClick={()=>go('choose')}>Change my starting areas</button><button className="pulse-text" onClick={()=>{setState(freshPulse());setEmailOpen(false);started.current=false;}}>Start fresh</button></div>
    </>}
    <footer className="pulse-footer"><a href="https://www.bluechip-people-strategies.com/privacy" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">Privacy</a><a href="https://www.bluechip-people-strategies.com/terms" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">Terms</a><a href="https://www.bluechip-people-strategies.com/refund-policy" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">Refund policy</a></footer>
  </main></div>;
}
