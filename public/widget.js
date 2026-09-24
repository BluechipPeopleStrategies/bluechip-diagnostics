/* BlueChip People Strategies — lead-capture chat widget.
   Served from Vercel and loaded on Squarespace with a single:
   <script defer src="https://bluechip-diagnostics.vercel.app/widget.js"></script>
   Self-injecting: builds its own styles, DOM, and handlers. No dependencies. */
(function () {
  'use strict';
  if (window.__bcwLoaded) return;            // guard against double-injection
  window.__bcwLoaded = true;

  var LEAD_ENDPOINT = 'https://bluechip-diagnostics.vercel.app/api/lead';

  var NAVY = '#0B1A33', GOLD = '#C9A24B', CREAM = '#F5EFE6', TEXT = '#2c2c2c';

  var CHOICES = [
    'Termination or workplace investigation',
    'Free AI Opportunity Check',
    'Practical AI Audit',
    'Embedded HR + AI Advisory',
    'Leadership coaching',
    'Governance or CEO evaluation',
    "Something else (I'm not sure yet)"
  ];

  // Approved fixed answers. Update alongside the service pages when offers change.
  var KNOWLEDGE = [
    { title: 'Practical AI Audit', need: 'Practical AI Audit', url: 'https://bluechip-diagnostics.vercel.app/ai-audit', link: 'Read the full audit details', answers: [
      ['What does the audit cost?', 'C$999 per organization, including applicable tax. An inquiry does not book the audit or take payment. BlueChip confirms the next steps with you. If you cancel before discovery, before any audit work has begun, the fee is refunded in full.'],
      ['What is included?', 'One 60-minute discovery session, an organization-wide opportunity scan, one priority workflow redesigned in detail, a written report and a 30-minute findings call. The report is yours to keep.'],
      ['How does the five-hour guarantee work?', 'Your audit fee is refunded in full if BlueChip cannot identify tool recommendations with evidence-backed potential to save at least five net hours a week across your organization in total. That is five hours in total, not five hours per employee, and the hours can come from several opportunities, not only the one redesigned workflow. For a sense of scale, five hours a week could be worth about $8,000 a year in staff capacity, based on an illustrative employee cost of $40 an hour over 40 working weeks, so it is an estimate of potential capacity, not a guaranteed cash saving. The guarantee covers identifying the opportunities, and actual results depend on implementation, adoption and workload.'],
      ['Do you implement the recommendations?', 'No. Your organization implements the recommendations and is responsible for the costs of doing so, including software subscriptions and licences, configuration, integrations, automation builds, training and ongoing support. The audit fee covers the audit only. The report documents one redesigned workflow, the recommended tools, responsibilities, human checkpoints and implementation steps, and lists the expected software costs and setup effort so you can budget and decide what is worth doing before you commit. If you would like help with implementation, it can be quoted separately.'],
      ['When will I receive the report?', 'Within five business days after both the discovery session and receipt of the information needed for the audit. A 30-minute findings call walks you through the recommendations.'],
      ['What does the C$8,000 example mean?', 'Five hours a week multiplied by C$40 per hour and 40 working weeks equals C$8,000 a year in potential staff capacity. Those are illustrative assumptions, not guaranteed cash or payroll savings. Software and implementation costs are not included in the audit fee.'],
      ['Do I have to buy a retainer?', 'No. The Practical AI Audit is standalone. You keep the report and can implement it yourself or with another provider. If the audit leads into a Practical AI and/or Embedded HR Retainer (six-month minimum), its fee is credited against your first invoice.']
    ] },
    { title: 'Free AI Opportunity Check', need: 'Free AI Opportunity Check', url: 'https://bluechip-diagnostics.vercel.app/ai-opportunity-check', link: 'Open the free AI Opportunity Check', answers: [
      ['What does the free check give me?', 'Six questions about your recurring work, tools and readiness lead to a practical starting point and a preparation step. You can use that result on its own or explore the paid Practical AI Audit.'],
      ['Do I need to give my email?', 'No email or contact details are required for the free check. Its answers stay on the page and clear when you reload. Please do not enter confidential information.'],
      ['Does the free check prove I will save five hours?', 'No. It gives a starting point, not an audit or savings estimate, and does not confirm the audit guarantee. The paid audit examines the actual work and the evidence for potential savings.']
    ] },
    { title: 'Embedded HR + AI Advisory', need: 'Embedded HR + AI Advisory', url: 'https://www.bluechip-people-strategies.com/embedded-hr-retainers', link: 'Explore Embedded HR + AI Advisory', answers: [
      ['Can I retain BlueChip for AI alone?', 'Yes. Support can focus on practical AI adoption alone or combine AI with embedded HR advice. The scope and fee are agreed for your engagement.'],
      ['What does embedded HR cover?', 'Senior advice on people decisions: hiring strategy, organizational design, performance management, compensation philosophy, leadership and change. It is strategic advisory, not payroll or benefits administration.'],
      ['How are tools and sensitive information handled?', 'Tools need your approval. Employee or client information should not go into a system you have not cleared. The work identifies where human judgment and review belong. Please keep personnel records and confidential client information out of this chat.'],
      ['How much is ongoing advisory?', 'Advisory pricing is scoped to your engagement. The C$999 audit price is a one-time audit fee, not a monthly advisory price. BlueChip can discuss the work and propose the appropriate scope.']
    ] },
    { title: 'Other BlueChip services', need: 'Other BlueChip services', url: 'https://www.bluechip-people-strategies.com/services', link: 'Explore BlueChip services', answers: [
      ['What is a governance evaluation?', 'A structured, independent review for a board or council and its senior leader. The engagement may include stakeholder interviews, leadership assessment, a written report, a presentation and a forward-looking performance plan. Scope and pricing are discussed with BlueChip.'],
      ['What are Leadership Academies?', 'Cohort-based development for senior leaders, combining leadership assessment, peer learning and practical development over nine months. BlueChip can discuss whether a regional or single-organization cohort fits your team.'],
      ['Can I get a standalone assessment?', 'Yes. BlueChip offers individual leadership, team and organizational assessments, either on their own or within a larger engagement. The tool, scope and price depend on the question you want to answer.'],
      ['What if my question is not listed?', 'These are approved answers to common questions, not a live AI conversation. Ask BlueChip for a response about your situation. Share a high-level description rather than employee or client details.']
    ] }
  ];

  // ---- styles ----
  var css = '' +
    '.bcw-launch{position:fixed;right:20px;bottom:20px;z-index:99998;width:60px;height:60px;border-radius:999px;background:' + NAVY + ';border:1.5px solid ' + NAVY + ';cursor:pointer;box-shadow:0 8px 24px rgba(10,37,64,.18);display:flex;align-items:center;justify-content:center;transition:background .2s ease,transform .1s ease}' +
    '.bcw-launch:hover{background:' + GOLD + ';border-color:' + GOLD + ';transform:translateY(-1px)}' +
    '.bcw-launch svg{width:26px;height:26px;fill:#fff;transition:fill .2s ease}' +
    '.bcw-launch:hover svg{fill:' + NAVY + '}' +
    '.bcw-greet{position:fixed;right:90px;bottom:30px;z-index:99998;max-width:230px;background:#fff;color:' + TEXT + ';border:1px solid ' + CREAM + ';border-radius:14px;border-bottom-right-radius:4px;box-shadow:0 8px 24px rgba(10,37,64,.14);padding:12px 14px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.45;cursor:pointer}' +
    '.bcw-greet b{display:block;font-weight:600;color:' + NAVY + '}' +
    '.bcw-greet small{color:#6b6b6b}' +
    '.bcw-panel{position:fixed;right:20px;bottom:92px;z-index:99999;width:360px;max-width:calc(100vw - 32px);background:#fff;border:1px solid ' + CREAM + ';border-radius:16px;box-shadow:0 12px 40px rgba(10,37,64,.18);overflow:hidden;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}' +
    '.bcw-panel.bcw-open{opacity:1;transform:translateY(0);pointer-events:auto}' +
    '.bcw-header{background:' + NAVY + ';color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}' +
    '#bcwPanel .bcw-header h3{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:20px;line-height:1.2;letter-spacing:normal;margin:0;color:#fff!important}' +
    '.bcw-close{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 4px}' +
    '.bcw-body{padding:12px 14px;max-height:340px;overflow-y:auto}' +
    '.bcw-msg{font-size:15px;line-height:1.5;margin:0 0 12px;max-width:88%;padding:10px 14px;border-radius:14px}' +
    '.bcw-msg-bot{background:' + CREAM + ';color:' + TEXT + ';border-bottom-left-radius:4px}' +
    '.bcw-msg-user{background:' + NAVY + ';color:#fff;margin-left:auto;border-bottom-right-radius:4px}' +
    '.bcw-foot{border-top:1px solid ' + CREAM + ';padding:9px 12px;max-height:32dvh;overflow-y:auto}' +
    '.bcw-panel{max-height:calc(100dvh - 110px);display:flex;flex-direction:column}.bcw-body{min-height:0;flex:1 1 auto}.bcw-header{flex-shrink:0}.bcw-foot{flex-shrink:0;box-sizing:border-box}.bcw-choice{box-sizing:border-box}.bcw-choice:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:2px}' +
    '.bcw-row{display:flex;gap:8px}' +
    '.bcw-input{flex:1;font-family:inherit;font-size:15px;color:' + TEXT + ';padding:10px 12px;border:1px solid ' + CREAM + ';border-radius:10px;outline:none}' +
    '.bcw-input:focus{border-color:' + GOLD + ';box-shadow:0 0 0 3px rgba(201,169,97,.25)}' +
    '.bcw-send{background:' + NAVY + ';color:#fff;border:1.5px solid ' + NAVY + ';border-radius:999px;padding:10px 20px;font-family:inherit;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s ease,color .2s ease,transform .1s ease}' +
    '.bcw-send:hover:not(:disabled){background:' + GOLD + ';border-color:' + GOLD + ';color:' + NAVY + ';transform:translateY(-1px)}' +
    '.bcw-send:disabled{opacity:.45;cursor:not-allowed}' +
    '.bcw-choice{display:block;width:100%;text-align:left;margin:0 0 5px;padding:8px 10px;min-height:36px;font-family:inherit;font-size:13px;line-height:1.35;letter-spacing:normal;color:' + NAVY + ';background:#fff;border:1.5px solid ' + CREAM + ';border-radius:10px;cursor:pointer;transition:border-color .15s ease,background .15s ease}' +
    '.bcw-choice:hover{border-color:' + GOLD + ';background:#fcfbf8}' +
    '.bcw-consent{display:flex;gap:9px;align-items:flex-start;margin:10px 2px 4px;font-size:13px;line-height:1.4;color:' + TEXT + '}' +
    '.bcw-consent input{margin-top:2px;width:16px;height:16px;accent-color:' + NAVY + ';flex:0 0 auto}' +
    '.bcw-fine{margin:6px 2px 0;font-size:11px;line-height:1.4;color:#6b6b6b}' +
    '.bcw-note{margin:8px 2px 0;font-size:12px;line-height:1.4;color:#6b6b6b;font-style:italic}' +
    '.bcw-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.bcw-done{text-align:center;padding:22px 18px;color:' + TEXT + ';font-size:14px;line-height:1.5}' +
    '.bcw-done svg{width:34px;height:34px;fill:' + GOLD + ';margin-bottom:8px}' +
    '@media (prefers-reduced-motion:reduce){.bcw-panel,.bcw-launch,.bcw-send{transition:none}}' +
    '@media (max-width:480px){.bcw-panel{right:8px;left:8px;bottom:84px;width:auto;max-width:none}.bcw-greet{display:none}.bcw-choice{min-height:40px}}';

  function injectStyle() {
    var s = document.createElement('style');
    s.setAttribute('data-bcw', '');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ---- DOM ----
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  var launch, greet, panel, bodyEl, footEl, started = false;
  var data = { name: '', need: '', contact: '', email: '' };

  function build() {
    launch = el('button', { 'class': 'bcw-launch', id: 'bcwLaunch', 'aria-label': 'Chat with Chip', 'aria-haspopup': 'dialog' },
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>');

    greet = el('div', { 'class': 'bcw-greet', role: 'button', tabindex: '0', 'aria-label': 'Chat with Chip' },
      "<b>A people decision or a practical AI question?</b><small>Tell us where you need help. We will point you to the next step.</small>");

    panel = el('div', { 'class': 'bcw-panel', id: 'bcwPanel', role: 'dialog', 'aria-modal': 'false', 'aria-label': "Let's talk", 'aria-hidden': 'true' });
    var header = el('div', { 'class': 'bcw-header' }, '<h3>Let’s talk</h3>');
    var closeBtn = el('button', { 'class': 'bcw-close', 'aria-label': 'Close chat' }, '&times;');
    header.appendChild(closeBtn);
    bodyEl = el('div', { 'class': 'bcw-body', 'aria-live': 'polite' });
    footEl = el('div', { 'class': 'bcw-foot' });
    panel.appendChild(header);
    panel.appendChild(bodyEl);
    panel.appendChild(footEl);

    document.body.appendChild(launch);
    document.body.appendChild(greet);
    document.body.appendChild(panel);

    // On the homepage the hero instrument gets the first beat: Chip's greet
    // bubble waits 12s (launch button stays visible the whole time). Other
    // pages keep the immediate greeting.
    if (location.pathname === '/' || location.pathname === '') {
      greet.style.display = 'none';
      setTimeout(function () {
        if (!started && !panel.classList.contains('bcw-open')) greet.style.display = '';
      }, 12000);
    }

    launch.addEventListener('click', toggle);
    greet.addEventListener('click', open);
    greet.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('bcw-open')) close(); });

    // Any link/button marked for the chat opens it instead of navigating.
    // Hook: <a href="#chat"> or any element with [data-bcw-open].
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var trigger = e.target.closest('a[href$="#chat"], [data-bcw-open]');
      if (trigger) { e.preventDefault(); open(); }
    });
    window.openBlueChipChat = open;   // programmatic open, e.g. onclick="openBlueChipChat()"
  }

  function addMsg(text, who) {
    var p = el('p', { 'class': 'bcw-msg ' + (who === 'user' ? 'bcw-msg-user' : 'bcw-msg-bot') });
    p.textContent = text;
    bodyEl.appendChild(p);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return p;
  }

  function toggle() { panel.classList.contains('bcw-open') ? close() : open(); }

  function open() {
    if (greet) greet.style.display = 'none';
    panel.classList.add('bcw-open');
    panel.setAttribute('aria-hidden', 'false');
    if (!started) { started = true; renderName(); }
  }
  function close() {
    panel.classList.remove('bcw-open');
    panel.setAttribute('aria-hidden', 'true');
    launch.focus();
  }

  // ---- step 1: name ----
  function renderName(onNext) {
    addMsg("Hi, I'm Chip, BlueChip's assistant. Whatever you're dealing with, you're in the right place. What should I call you?", 'bot');
    footEl.innerHTML = '';
    var row = el('div', { 'class': 'bcw-row' });
    var input = el('input', { 'class': 'bcw-input', type: 'text', 'aria-label': 'Your name', placeholder: 'Your name' });
    var send = el('button', { 'class': 'bcw-send', type: 'button' }, 'Send');
    row.appendChild(input); row.appendChild(send);
    footEl.appendChild(row);
    choiceButton('Browse questions and answers', renderTopics);
    input.focus();
    function go() {
      var v = input.value.trim();
      if (!v) return;
      data.name = v; addMsg(v, 'user'); if (typeof onNext === 'function') onNext(); else renderChoices();
    }
    send.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  }

  function choiceButton(label, action) {
    var b = el('button', { 'class': 'bcw-choice', type: 'button' });
    b.textContent = label;
    b.addEventListener('click', action);
    footEl.appendChild(b);
    return b;
  }

  function focusChoices() {
    footEl.scrollTop = 0;
    var first = footEl.querySelector('button, a');
    if (first) first.focus();
  }

  function renderTopics() {
    addMsg('Browse approved answers about BlueChip. No contact details are needed to explore.', 'bot');
    footEl.innerHTML = '';
    KNOWLEDGE.forEach(function (topic) {
      choiceButton(topic.title, function () { renderQuestions(topic); });
    });
    choiceButton('Ask BlueChip a different question', function () {
      data.need = 'General service inquiry';
      if (data.name) renderContact(); else renderName(renderContact);
    });
    focusChoices();
  }

  function renderQuestions(topic) {
    footEl.innerHTML = '';
    topic.answers.forEach(function (answer) {
      choiceButton(answer[0], function () {
        addMsg(answer[0], 'user'); var answerEl = addMsg(answer[1], 'bot');
        renderQuestions(topic);
        bodyEl.scrollTop = Math.max(0, answerEl.offsetTop - bodyEl.offsetTop - 8);
      });
    });
    var resource = el('a', { 'class': 'bcw-choice', href: topic.url });
    resource.textContent = topic.link;
    footEl.appendChild(resource);
    choiceButton('Ask BlueChip about this', function () {
      data.need = topic.need;
      if (data.name) renderContact(); else renderName(renderContact);
    });
    choiceButton('All topics', renderTopics);
    focusChoices();
  }

  // ---- step 2: choice ----
  function renderChoices() {
    addMsg('Thanks, ' + data.name + '. What’s on your plate?', 'bot');
    footEl.innerHTML = '';
    CHOICES.forEach(function (c) {
      var b = el('button', { 'class': 'bcw-choice', type: 'button' });
      b.textContent = c;
      b.addEventListener('click', function () {
        data.need = c; addMsg(c, 'user');
        if (c === 'Free AI Opportunity Check' || c === 'Practical AI Audit' || c === 'Embedded HR + AI Advisory') renderOffering();
        else renderContact();
      });
      footEl.appendChild(b);
    });
    choiceButton('Browse questions and answers', renderTopics);
  }

  function renderOffering() {
    footEl.innerHTML = '';
    if (data.need === 'Free AI Opportunity Check') {
      addMsg('Six questions about your recurring work and current tools. The free check gives you a practical starting point, with no email required. It is not an audit or a savings estimate.', 'bot');
      var checkLink = el('a', { 'class': 'bcw-choice', href: 'https://bluechip-diagnostics.vercel.app/ai-opportunity-check' });
      checkLink.textContent = 'Start the free AI Opportunity Check';
      footEl.appendChild(checkLink);
    } else if (data.need === 'Practical AI Audit') {
      addMsg('The Practical AI Audit is C$999 per organization, including applicable tax. It includes a 60-minute discovery session, an organization-wide opportunity scan, one priority workflow redesigned, a written report and a 30-minute findings call.', 'bot');
      addMsg('Your report arrives within five business days after discovery and receipt of the required information. If we cannot identify evidence-backed potential to save five net hours per week across your organization in total, we refund the audit fee in full. You implement the recommendations. Software, setup and training costs are not included in the audit fee.', 'bot');
    } else {
      addMsg('Embedded HR + AI Advisory brings senior people advice and practical AI adoption into the work of your organization. Support can focus on AI alone or combine HR and AI. The scope and fee are agreed for your engagement.', 'bot');
      addMsg('You can also start with the standalone Practical AI Audit. Its C$999 fee, including applicable tax, is credited against your first invoice if it leads to a Practical AI and/or Embedded HR Retainer (six-month minimum).', 'bot');
    }
    var next = el('button', { 'class': 'bcw-choice', type: 'button' });
    next.textContent = 'Discuss this with BlueChip';
    next.addEventListener('click', renderContact);
    var back = el('button', { 'class': 'bcw-choice', type: 'button' });
    back.textContent = 'Choose a different service';
    back.addEventListener('click', renderChoices);
    footEl.appendChild(next); footEl.appendChild(back);
    choiceButton('Browse questions and answers', renderTopics);
  }

  // ---- step 3: contact + consent ----
  function renderContact() {
    addMsg("What's the best number for BlueChip to text you about this? We usually reply within a few hours on business days. This sends an inquiry; it does not book or charge you for an audit. Please keep employee and client details out of this chat.", 'bot');
    footEl.innerHTML = '';
    var input = el('input', { 'class': 'bcw-input', type: 'tel', 'aria-label': 'Your phone number', placeholder: 'Phone number', style: 'width:100%' });
    var emailInput = el('input', { 'class': 'bcw-input', type: 'email', 'aria-label': 'Your email, optional', placeholder: 'Email (optional)', style: 'width:100%;margin-top:8px' });
    var hp = el('input', { 'class': 'bcw-hp', type: 'text', name: 'company', tabindex: '-1', 'aria-hidden': 'true', autocomplete: 'off' });
    var consentWrap = el('label', { 'class': 'bcw-consent' });
    var cb = el('input', { type: 'checkbox' });
    var cbText = document.createElement('span');
    cbText.textContent = "Yes, it's okay to text me at this number about my inquiry. I can reply STOP anytime.";
    consentWrap.appendChild(cb); consentWrap.appendChild(cbText);
    var fine = el('div', { 'class': 'bcw-fine' });
    fine.textContent = "BlueChip People Strategies, Edmonton, Alberta. We won't share your number or message you about anything unrelated to the opt-in box above. A real person reads each message. We usually reply within a few hours on business days.";
    var send = el('button', { 'class': 'bcw-send', type: 'button', disabled: 'disabled', style: 'margin-top:12px;width:100%' }, 'Send');

    footEl.appendChild(input);
    footEl.appendChild(emailInput);
    footEl.appendChild(hp);
    footEl.appendChild(consentWrap);
    footEl.appendChild(fine);
    footEl.appendChild(send);
    input.focus();

    function refresh() { send.disabled = !(input.value.trim() && cb.checked); }   // phone + consent required; email optional
    input.addEventListener('input', refresh);
    cb.addEventListener('change', refresh);

    function go() {
      if (send.disabled) return;
      data.contact = input.value.trim();
      data.email = emailInput.value.trim();
      submitLead(hp.value);
      finish();
    }
    send.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  }

  function pageLabel() {
    var p = (location.pathname || '/').replace(/\/$/, '');
    if (p === '') return 'homepage chat';
    return p.replace(/^\//, '').replace(/\//g, ' ') + ' chat';
  }

  function submitLead(companyHp) {
    try {
      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, need: data.need, contact: data.contact, email: data.email,
          consent: true, source: pageLabel(), company: companyHp || ''
        })
      }).catch(function () { /* failures logged server-side; user still sees confirmation */ });
    } catch (e) { /* no-op */ }
  }

  function finish() {
    footEl.innerHTML = '';
    var done = el('div', { 'class': 'bcw-done' },
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>');
    var line = document.createElement('div');
    line.textContent = "Got it, " + data.name + ". You've taken the hard first step. Someone from BlueChip People Strategies will text you at " + data.contact + ", usually within a few hours on business days. Nothing you've shared goes any further.";
    done.appendChild(line);
    bodyEl.appendChild(done);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function init() {
    injectStyle(); build();
    if (location.hash === '#chat') open();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
