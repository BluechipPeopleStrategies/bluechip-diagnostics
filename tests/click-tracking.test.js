import {readFileSync,existsSync} from 'node:fs';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const file='public/click-tracking.js';
const install=()=>window.eval(existsSync(file)?readFileSync(file,'utf8'):'');
let ph,ga;
beforeEach(()=>{document.body.innerHTML='';localStorage.clear();ph=vi.fn();ga=vi.fn();window.posthog={capture:ph};window.gtag=ga;delete window.__bcUiTracking;});
afterEach(()=>{vi.restoreAllMocks();document.cookie='bc_internal=; max-age=0; path=/';window.__bcUiTracking?.dispose();delete window.__bcUiTracking;delete window.posthog;delete window.gtag;delete window['ga-disable-G-VZBXPJQXWK'];});
it('records a dynamically added link once in each sink without its query or fragment',()=>{
 install();install();document.body.innerHTML='<main><a href="/ai-handoff-plan?email=secret@example.com#private-note"><span>Plan</span></a></main>';
 document.querySelector('span').click();
 expect(ph.mock.calls.filter(([name])=>name==='bc_click')).toHaveLength(1);expect(ga.mock.calls.filter(([,name])=>name==='bc_click')).toHaveLength(1);
 expect(ph.mock.calls[0]).toEqual(['bc_click',expect.objectContaining({click_kind:'ai_handoff_plan',link_url:'/ai-handoff-plan'})]);
 expect(JSON.stringify(ph.mock.calls)).not.toMatch(/secret|private-note|email=/);
});
it('retains the named destination funnel and does not double count a chat launch forwarded by a CTA',()=>{
 install();document.body.innerHTML='<button data-bcw-open>Ask us</button><button id="bcwLaunch">Chat</button><a href="/ai-opportunity-check">Pulse</a>';
 document.querySelector('[data-bcw-open]').onclick=()=>document.querySelector('#bcwLaunch').click();
 document.querySelector('[data-bcw-open]').click();
 expect(ph.mock.calls.filter(([name])=>name==='bc_click')).toHaveLength(1);
 expect(ph.mock.calls.filter(([name])=>name==='bc_chat_open')).toHaveLength(1);
 document.body.insertAdjacentHTML('beforeend','<div class="bcw-panel"><button>Close</button></div>');document.querySelector('.bcw-panel button').click();
 expect(ph.mock.calls.filter(([name])=>name==='bc_chat_open')).toHaveLength(1);
 document.querySelector('a').click();expect(ph.mock.calls.filter(([name])=>name==='bc_ai_pulse_click')).toHaveLength(1);
});
it('uses a click-aware mirror exactly once and remains compatible with the old mirror',()=>{
 install();document.body.innerHTML='<button>Ask us</button>';ga.__bcMirror=true;
 document.querySelector('button').click();expect(ph).toHaveBeenCalledTimes(1);
 ga.__bcMirrorClicks=true;ga.mockImplementation((_,name,p)=>ph(name,p));ph.mockClear();
 document.querySelector('button').click();expect(ph).toHaveBeenCalledTimes(1);
});
it('records summaries, SVG button targets and keyboard-style activation without blocking their actions',()=>{
 install();document.body.innerHTML='<section><details><summary>Question</summary><p>Answer</p></details><button><svg><path></path></svg></button></section>';
 const summary=document.querySelector('summary');summary.click();document.querySelector('path').dispatchEvent(new MouseEvent('click',{bubbles:true}));
 expect(document.querySelector('details').open).toBe(true);expect(ph.mock.calls.filter(([n])=>n==='bc_click')).toHaveLength(2);
 expect(ph.mock.calls[0][1]).toMatchObject({action_id:'expand_details'});
 expect(ph.mock.calls[0][1]).toHaveProperty('control_index',0);
});
it('records structural choices and changes without answer text, option positions or values',()=>{
 install();document.body.innerHTML='<main class="pulse-page"><div class="pulse-options"><button class="pulse-choice">Private workflow answer</button></div><select><option value="secret-tool">Confidential tools</option></select><textarea class="ph-no-capture">Client secret</textarea></main>';
 document.querySelector('button').click();document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('textarea').click();
 expect(ph.mock.calls[0]).toEqual(['bc_click',expect.objectContaining({action_id:'choose_answer'})]);
 expect(ph.mock.calls[1]).toEqual(['bc_control_change',expect.objectContaining({action_id:'change_select'})]);
 expect(JSON.stringify(ph.mock.calls)).not.toMatch(/Private|secret|Confidential|Client|option_index|answer_value/);
 expect(ph).toHaveBeenCalledTimes(2);
});
it('counts a labelled checkbox once and never transmits contact-link recipients',()=>{
 install();document.body.innerHTML='<label><input type="checkbox">Include confidential answers</label><a href="mailto:person@example.com?body=secret">Contact</a>';
 document.querySelector('label').click();document.querySelector('a').dispatchEvent(new MouseEvent('click',{bubbles:true}));
 expect(ph.mock.calls.filter(([n])=>n==='bc_click')).toHaveLength(2);
 expect(JSON.stringify(ph.mock.calls)).not.toMatch(/person@example|secret|confidential/i);
 expect(ph.mock.calls.at(-1)[1].link_url).toBe('mailto:');
});
it('does not count disabled controls or internal-review browsers',()=>{
 install();document.body.innerHTML='<button disabled>Disabled</button><button>Ask us</button>';
 document.querySelector('button').dispatchEvent(new MouseEvent('click',{bubbles:true}));
 window['ga-disable-G-VZBXPJQXWK']=true;document.querySelectorAll('button')[1].click();expect(ph).not.toHaveBeenCalled();expect(ga).not.toHaveBeenCalled();
});
it('analytics failure cannot block the control or the other sink',()=>{
 install();document.body.innerHTML='<button>Ask us</button>';const control=vi.fn();document.querySelector('button').onclick=control;ga.mockImplementation(()=>{throw Error('blocked');});
 expect(()=>document.querySelector('button').click()).not.toThrow();expect(control).toHaveBeenCalledTimes(1);expect(ph).toHaveBeenCalledTimes(1);
});
it('tracks topic-bearing chat CTAs without their topic and distinguishes a launcher close',()=>{
 install();document.body.innerHTML='<a href="#chat?topic=PrivateWork">Talk</a><button id="bcwLaunch" aria-expanded="false">Chat</button>';
 document.querySelector('a').click();expect(ph.mock.calls.filter(([n])=>n==='bc_chat_open')).toHaveLength(1);
 ph.mockClear();document.querySelector('button').setAttribute('aria-expanded','true');document.querySelector('button').click();expect(ph.mock.calls.filter(([n])=>n==='bc_chat_open')).toHaveLength(0);
 expect(ph.mock.calls[0][1].action_id).toBe('close_chat');expect(JSON.stringify(ph.mock.calls)).not.toContain('PrivateWork');
});
it('never encodes chat-choice or result-priority option positions in fallback identifiers',()=>{
 install();document.body.innerHTML='<div class="bcw-panel"><button class="bcw-choice">A private source</button></div><main><button aria-pressed="false">A private priority</button></main>';
 document.querySelectorAll('button').forEach(b=>b.click());
 expect(ph.mock.calls.map(([,p])=>p.action_id)).toEqual(['choose_option','choose_option']);
 expect(JSON.stringify(ph.mock.calls)).not.toMatch(/private|control_\d|control_index|option_index/i);
});
it('honors an old semantic-event mirror without duplicating the Plan or control-change events',()=>{
 ga.mockImplementation((_,name,p)=>{if(name!=='bc_click')ph(name,p);});ga.__bcMirror=true;install();
 document.body.innerHTML='<a href="/ai-handoff-plan">Plan</a><select><option>One</option></select>';
 document.querySelector('a').click();document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}));
 expect(ph.mock.calls.filter(([n])=>n==='bc_handoff_plan_click')).toHaveLength(1);expect(ph.mock.calls.filter(([n])=>n==='bc_control_change')).toHaveLength(1);
});
it('preserves the internal cookie exclusion when local storage is unavailable',()=>{
 install();document.cookie='bc_internal=1; path=/';const storage=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('blocked');});
 document.body.innerHTML='<button>Ask us</button>';document.querySelector('button').click();
 expect(ph).not.toHaveBeenCalled();storage.mockRestore();document.cookie='bc_internal=; max-age=0; path=/';
});
it('retains known offer-panel events without accepting arbitrary data attribute content',()=>{
 install();document.body.innerHTML='<button data-offer="gov">Offer</button><button data-offer="private-client-name">Other</button>';
 document.querySelectorAll('button').forEach(b=>b.click());
 expect(ph.mock.calls.filter(([n])=>n==='bc_offer_open')).toHaveLength(1);expect(JSON.stringify(ph.mock.calls)).not.toContain('private-client-name');
});
