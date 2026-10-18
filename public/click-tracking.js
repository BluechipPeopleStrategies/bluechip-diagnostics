/* Shared www/check interaction collector. Public structural identifiers only.
   bc_click is one generic click; bc_control_change is separate, never a second click.
   No text, answer, form value, recipient, URL query or fragment is emitted. */
(function () {
  'use strict';
  if (window.__bcUiTracking) return;
  var selector = 'a,button,summary,input,select,textarea,[role="button"],[role="radio"],[data-offer]';
  var routes = ['home-1','about','faq','services','ai-opportunity-check','ai-check','ai-handoff-plan','ai-audit','contact','contact-thanks','privacy','terms','refund','refund-policy','leadership','leadership-cohort','assessments','embedded-hr-retainers','governance-evaluations','workplace-investigations','org-architecture','free-diagnostics','workplace-read','decision-quality-index','org-pulse','supervisor-blind-spot'];
  var actions = {'Ask us':'ask_us','Start the conversation':'start_conversation','Back':'back','Next':'next','Next area →':'next_area','Skip this for now':'skip','Find my opportunities →':'start_pulse','Show me what could help →':'explore_ideas','See my ideas →':'see_ideas','Show my AI starting points →':'show_starting_points','Email my ideas':'email_ideas','Send':'send','Close':'close','Clear':'clear','Pause motion':'pause_motion','Play motion':'play_motion'};
  var lastChatTrigger = null, lastChatAt = 0;
  function safePath(path) {
    var first = path.replace(/^\/+/, '').split('/')[0];
    if (!first) return '/';
    if (routes.indexOf(first) < 0) return '/other';
    return '/' + first + (first === 'ai-handoff-plan' && /\/public-sector\/?$/.test(path) ? '/public-sector' : '');
  }
  function destination(el) {
    var raw = el.getAttribute('href');
    if (!raw) return '';
    if (/^mailto:/i.test(raw)) return 'mailto:';
    if (/^tel:/i.test(raw)) return 'tel:';
    if (raw.charAt(0) === '#') return 'in_page';
    try {
      var u = new URL(raw, location.href);
      if (!/^https?:$/.test(u.protocol)) return '';
      var own = /(^|\.)bluechip-people-strategies\.com$/.test(u.hostname) || u.origin === location.origin;
      return own ? safePath(u.pathname) : u.origin;
    } catch { return ''; }
  }
  function scope(el) {
    if (el.closest('.bcw-panel,.bcw-launch,.bcw-greet')) return 'chat';
    if (el.closest('header,#header,.site-header')) return 'header';
    if (el.closest('footer,#footer-sections')) return 'footer';
    if (el.closest('#plan-next-step')) return 'pulse_paid_next_step';
    if (el.closest('.pulse-page')) {
      if (document.querySelector('#pulse-ideas')) return 'pulse_result';
      if (document.querySelector('.pulse-options')) return 'pulse_questions';
      if (el.closest('[data-family],.pulse-work-areas')) return 'pulse_work_selection';
      return 'pulse';
    }
    if (el.closest('.plan-booking-facts')) return 'plan_investment';
    if (el.closest('.glass-faq')) return 'plan_faq';
    var box = el.closest('nav,dialog,section,main');
    return box ? box.tagName.toLowerCase() : 'page';
  }
  function action(el, area) {
    if (el.matches('.pulse-choice,[role="radio"]')) return 'choose_answer';
    if (el.matches('[data-family]')) return 'choose_work_area';
    if (el.matches('.bcw-choice,[aria-pressed]')) return 'choose_option';
    if (el.matches('summary')) return el.parentElement.open ? 'collapse_details' : 'expand_details';
    if (el.matches('a')) return 'follow_link';
    if (el.matches('input,select,textarea')) return 'interact_' + (el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase());
    if (el.matches('[data-bcw-open],#bcwLaunch,.bcw-launch')) return 'open_chat';
    var key = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (actions[key]) return actions[key];
    return area + '_control';
  }
  function emit(name, props) {
    if (window['ga-disable-G-VZBXPJQXWK']) return;
    try { if (localStorage.getItem('bc_internal') === '1') return; } catch { /* storage unavailable */ }
    try { if (/(?:^|;\s*)bc_internal=1(?:;|$)/.test(document.cookie)) return; } catch { /* cookie unavailable */ }
    var mirrored = false;
    try { if (typeof window.gtag === 'function') { window.gtag('event', name, props); mirrored = name === 'bc_click' ? window.gtag.__bcMirrorClicks === true : !!window.gtag.__bcMirror; } } catch { /* independent sinks */ }
    try { if (!mirrored && window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, props); } catch { /* never block the visitor */ }
  }
  function handle(e) {
    var target = e.target && e.target.closest ? e.target : e.target && e.target.parentElement;
    if (!target || target.closest('.ph-no-capture,[data-analytics-ignore],[contenteditable="true"]')) return;
    var el = target.closest(selector);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (e.type === 'change' && !el.matches('select,input[type="checkbox"],input[type="radio"],input[type="range"]')) return;
    var area = scope(el), url = destination(el);
    var chatOpener = el.matches('#bcwLaunch,.bcw-launch,[data-bcw-open]') || /^#chat(?:$|\?)/.test(el.getAttribute('href') || '');
    var chatOpen = !!document.querySelector('#bcwLaunch[aria-expanded="true"],.bcw-panel.bcw-open,.bcw-panel[aria-hidden="false"]');
    var kind = /ai-opportunity-check|\/ai-check/.test(url) ? 'ai_pulse' : /ai-handoff-plan/.test(url) ? 'ai_handoff_plan' : area === 'chat' || chatOpener ? 'chat' : url === 'mailto:' ? 'email' : url === 'tel:' ? 'phone' : /^https?:/.test(url) ? 'outbound' : url ? 'internal' : 'control';
    if (e.type === 'click' && el.matches('#bcwLaunch,.bcw-launch') && !e.isTrusted && !chatOpen && lastChatTrigger && lastChatTrigger !== el && Date.now() - lastChatAt < 300) return;
    if (e.type === 'click' && chatOpener) { lastChatTrigger = el; lastChatAt = Date.now(); }
    var props = {tracking_version:'ui-v1',page_path:safePath(location.pathname),page_area:area,action_id:e.type === 'change' ? 'change_' + el.tagName.toLowerCase() : action(el,area),click_kind:kind,element_type:el.tagName.toLowerCase(),link_url:url,transport_type:'beacon'};
    if (el.matches('#bcwLaunch,.bcw-launch')) props.action_id = chatOpen ? 'close_chat' : 'open_chat';
    if (el.matches('summary')) props.control_index = Array.prototype.indexOf.call(document.querySelectorAll('summary'),el);
    emit(e.type === 'change' ? 'bc_control_change' : 'bc_click', props);
    if (e.type === 'click' && (['ai_pulse','ai_handoff_plan'].indexOf(kind) >= 0 || (chatOpener && !chatOpen))) {
      emit(kind === 'ai_pulse' ? 'bc_ai_pulse_click' : kind === 'ai_handoff_plan' ? 'bc_handoff_plan_click' : 'bc_chat_open',props);
    }
    if (e.type === 'click' && ['gov','ehr','inv','org','acad'].indexOf(el.getAttribute('data-offer')) >= 0) emit('bc_offer_open',{offer:el.getAttribute('data-offer'),page_path:safePath(location.pathname)});
  }
  document.addEventListener('click',handle,true);
  document.addEventListener('change',handle,true);
  window.__bcUiTracking = {version:'ui-v1',dispose:function(){document.removeEventListener('click',handle,true);document.removeEventListener('change',handle,true);}};
})();
