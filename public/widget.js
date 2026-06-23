/* BlueChip People Strategies — lead-capture chat widget.
   Served from Vercel and loaded on Squarespace with a single:
   <script defer src="https://bluechip-diagnostics.vercel.app/widget.js"></script>
   Self-injecting: builds its own styles, DOM, and handlers. No dependencies. */
(function () {
  'use strict';
  if (window.__bcwLoaded) return;            // guard against double-injection
  window.__bcwLoaded = true;

  var LEAD_ENDPOINT = 'https://bluechip-diagnostics.vercel.app/api/lead';

  var NAVY = '#0a2540', GOLD = '#c9a961', CREAM = '#e8e5df', TEXT = '#2c2c2c';

  var CHOICES = [
    'Termination or workplace investigation',
    'Fractional HR support',
    'Leadership coaching',
    'Governance or CEO evaluation',
    "Something else (I'm not sure yet)"
  ];

  // ---- styles ----
  var css = '' +
    '.bcw-launch{position:fixed;right:20px;bottom:20px;z-index:99998;width:60px;height:60px;border-radius:999px;background:' + NAVY + ';border:1.5px solid ' + NAVY + ';cursor:pointer;box-shadow:0 8px 24px rgba(10,37,64,.18);display:flex;align-items:center;justify-content:center;transition:background .2s ease,transform .1s ease}' +
    '.bcw-launch:hover{background:' + GOLD + ';border-color:' + GOLD + ';transform:translateY(-1px)}' +
    '.bcw-launch svg{width:26px;height:26px;fill:#fff;transition:fill .2s ease}' +
    '.bcw-launch:hover svg{fill:' + NAVY + '}' +
    '.bcw-greet{position:fixed;right:90px;bottom:30px;z-index:99998;max-width:230px;background:#fff;color:' + TEXT + ';border:1px solid ' + CREAM + ';border-radius:14px;border-bottom-right-radius:4px;box-shadow:0 8px 24px rgba(10,37,64,.14);padding:12px 14px;font-family:Montserrat,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.45;cursor:pointer}' +
    '.bcw-greet b{display:block;font-weight:600;color:' + NAVY + '}' +
    '.bcw-greet small{color:#6b6b6b}' +
    '.bcw-panel{position:fixed;right:20px;bottom:92px;z-index:99999;width:360px;max-width:calc(100vw - 32px);background:#fff;border:1px solid ' + CREAM + ';border-radius:16px;box-shadow:0 12px 40px rgba(10,37,64,.18);overflow:hidden;font-family:Montserrat,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}' +
    '.bcw-panel.bcw-open{opacity:1;transform:translateY(0);pointer-events:auto}' +
    '.bcw-header{background:' + NAVY + ';color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between}' +
    '.bcw-header h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:22px;margin:0}' +
    '.bcw-close{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 4px}' +
    '.bcw-body{padding:16px 18px;max-height:340px;overflow-y:auto}' +
    '.bcw-msg{font-size:15px;line-height:1.5;margin:0 0 12px;max-width:88%;padding:10px 14px;border-radius:14px}' +
    '.bcw-msg-bot{background:' + CREAM + ';color:' + TEXT + ';border-bottom-left-radius:4px}' +
    '.bcw-msg-user{background:' + NAVY + ';color:#fff;margin-left:auto;border-bottom-right-radius:4px}' +
    '.bcw-foot{border-top:1px solid ' + CREAM + ';padding:12px 14px}' +
    '.bcw-row{display:flex;gap:8px}' +
    '.bcw-input{flex:1;font-family:inherit;font-size:15px;color:' + TEXT + ';padding:10px 12px;border:1px solid ' + CREAM + ';border-radius:10px;outline:none}' +
    '.bcw-input:focus{border-color:' + GOLD + ';box-shadow:0 0 0 3px rgba(201,169,97,.25)}' +
    '.bcw-send{background:' + NAVY + ';color:#fff;border:1.5px solid ' + NAVY + ';border-radius:999px;padding:10px 20px;font-family:inherit;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s ease,color .2s ease,transform .1s ease}' +
    '.bcw-send:hover:not(:disabled){background:' + GOLD + ';border-color:' + GOLD + ';color:' + NAVY + ';transform:translateY(-1px)}' +
    '.bcw-send:disabled{opacity:.45;cursor:not-allowed}' +
    '.bcw-choice{display:block;width:100%;text-align:left;margin:0 0 8px;padding:11px 14px;font-family:inherit;font-size:14px;color:' + NAVY + ';background:#fff;border:1.5px solid ' + CREAM + ';border-radius:10px;cursor:pointer;transition:border-color .15s ease,background .15s ease}' +
    '.bcw-choice:hover{border-color:' + GOLD + ';background:#fcfbf8}' +
    '.bcw-consent{display:flex;gap:9px;align-items:flex-start;margin:10px 2px 4px;font-size:13px;line-height:1.4;color:' + TEXT + '}' +
    '.bcw-consent input{margin-top:2px;width:16px;height:16px;accent-color:' + NAVY + ';flex:0 0 auto}' +
    '.bcw-fine{margin:6px 2px 0;font-size:11px;line-height:1.4;color:#6b6b6b}' +
    '.bcw-note{margin:8px 2px 0;font-size:12px;line-height:1.4;color:#6b6b6b;font-style:italic}' +
    '.bcw-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.bcw-done{text-align:center;padding:22px 18px;color:' + TEXT + ';font-size:14px;line-height:1.5}' +
    '.bcw-done svg{width:34px;height:34px;fill:' + GOLD + ';margin-bottom:8px}' +
    '@media (prefers-reduced-motion:reduce){.bcw-panel,.bcw-launch,.bcw-send{transition:none}}' +
    '@media (max-width:480px){.bcw-panel{right:8px;left:8px;bottom:84px;width:auto;max-width:none}.bcw-greet{display:none}}';

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
    launch = el('button', { 'class': 'bcw-launch', id: 'bcwLaunch', 'aria-label': 'Open chat', 'aria-haspopup': 'dialog' },
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>');

    greet = el('div', { 'class': 'bcw-greet', role: 'button', tabindex: '0', 'aria-label': 'Open chat' },
      "<b>Got a people situation that needs a second set of eyes?</b><small>Tell me what's going on, and we will point you to the clearest next step. No charge for the first look, and it's confidential.</small>");

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
  function renderName() {
    addMsg("Hi, I'm BlueChip's assistant. Whatever you're dealing with, you're in the right place. What should I call you?", 'bot');
    footEl.innerHTML = '';
    var row = el('div', { 'class': 'bcw-row' });
    var input = el('input', { 'class': 'bcw-input', type: 'text', 'aria-label': 'Your name', placeholder: 'Your name' });
    var send = el('button', { 'class': 'bcw-send', type: 'button' }, 'Send');
    row.appendChild(input); row.appendChild(send);
    footEl.appendChild(row);
    input.focus();
    function go() {
      var v = input.value.trim();
      if (!v) return;
      data.name = v; addMsg(v, 'user'); renderChoices();
    }
    send.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  }

  // ---- step 2: choice ----
  function renderChoices() {
    addMsg('Thanks, ' + data.name + '. What’s on your plate?', 'bot');
    footEl.innerHTML = '';
    CHOICES.forEach(function (c) {
      var b = el('button', { 'class': 'bcw-choice', type: 'button' });
      b.textContent = c;
      b.addEventListener('click', function () { data.need = c; addMsg(c, 'user'); renderContact(); });
      footEl.appendChild(b);
    });
  }

  // ---- step 3: contact + consent ----
  function renderContact() {
    addMsg("That's one we work on a lot, and there's usually a clearer next step than it feels like right now. What's the best number to reach you? We follow up by text (not a cold call) with a real read on your situation, usually within a few hours on business days.", 'bot');
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

  function init() { injectStyle(); build(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
