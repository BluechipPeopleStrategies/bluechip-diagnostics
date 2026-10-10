/* BlueChip People Strategies: lead-capture chat widget.
   Served from Vercel and loaded on Squarespace with a single:
   <script defer src="https://check.bluechip-people-strategies.com/widget.js"></script>
   Self-injecting: builds its own styles, DOM, and handlers. No dependencies. */
(function () {
  'use strict';
  if (window.__bcwLoaded) return;            // guard against double-injection
  window.__bcwLoaded = true;

  var LEAD_ENDPOINT = 'https://check.bluechip-people-strategies.com/api/lead';

  // ---- lead-source attribution (2026-10-09) ----
  // Records where this visitor came from: a first touch once per browser (localStorage,
  // kept 90 days) and a last touch per session (sessionStorage). Campaign tags come from the
  // utm_* query params, the referrer is the host only (and empty for our own sites), and the
  // landing page is the path only. Every storage access is wrapped: if storage is blocked the
  // values still live in memory for this page. The lead payload carries it as `attribution`.
  var FIRST_KEY = 'bc_first_touch', LAST_KEY = 'bc_last_touch', FIRST_DAYS = 90;
  var OWN_HOSTS = ['bluechip-people-strategies.com', 'bluechip-diagnostics.vercel.app'];
  var TOUCH_KEYS = ['source', 'medium', 'campaign', 'content', 'referrer', 'landing', 'date'];

  function attrTag(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
  }
  function attrParam(name) {
    var q = String(location.search || '').replace(/^\?/, '');
    if (!q) return '';
    var parts = q.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (kv[0] === name) {
        try { return decodeURIComponent((kv.slice(1).join('=') || '').replace(/\+/g, ' ')); }
        catch { return ''; }
      }
    }
    return '';
  }
  function attrHost(h) { return String(h || '').toLowerCase().replace(/^www\./, ''); }
  function attrReferrerHost() {
    var ref;
    try { ref = document.referrer || ''; } catch { return ''; }
    var m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?([^/?#:]+)/i.exec(ref);
    if (!m) return '';
    var host = attrHost(m[1]).replace(/[^a-z0-9.-]/g, '');
    if (!host) return '';
    var hosts = OWN_HOSTS.concat([attrHost(location.hostname)]);
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i] && (host === hosts[i] || host.slice(-(hosts[i].length + 1)) === '.' + hosts[i])) return '';
    }
    return host.slice(0, 100);
  }
  function attrToday() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  }
  // Only the known keys, strings only: what is stored and what get() hands out.
  function attrStrip(t) {
    var out = {};
    for (var i = 0; i < TOUCH_KEYS.length; i++) out[TOUCH_KEYS[i]] = (t && typeof t[TOUCH_KEYS[i]] === 'string') ? t[TOUCH_KEYS[i]] : '';
    return out;
  }
  // This page view as a touch, and whether it carries any new signal (a UTM or an outside referrer).
  function attrCurrent() {
    var t = {
      source: attrTag(attrParam('utm_source')),
      medium: attrTag(attrParam('utm_medium')),
      campaign: attrTag(attrParam('utm_campaign')),
      content: attrTag(attrParam('utm_content')),
      referrer: attrReferrerHost(),
      landing: String(location.pathname || '/').slice(0, 100),
      date: attrToday()
    };
    var known = !!(t.source || t.medium || t.campaign || t.content || t.referrer);
    if (!known) t.source = 'direct';
    return { touch: attrStrip(t), known: known };
  }
  function attrRead(store, key) {
    try {
      var raw = window[store].getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function attrWrite(store, key, value) {
    try { window[store].setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep it in memory only */ }
  }
  var attrFirst = null, attrLast = null;
  function captureAttribution() {
    var cur = attrCurrent();
    var now = Date.now();
    var stored = attrRead('localStorage', FIRST_KEY);
    var fresh = !!(stored && stored.touch && typeof stored.ts === 'number' && now - stored.ts >= 0 && now - stored.ts <= FIRST_DAYS * 86400000);
    if (fresh) {
      attrFirst = attrStrip(stored.touch);
    } else {
      attrFirst = cur.touch;
      attrWrite('localStorage', FIRST_KEY, { ts: now, touch: attrFirst });
    }
    var last = attrRead('sessionStorage', LAST_KEY);
    if (last && last.touch && !cur.known) {
      attrLast = attrStrip(last.touch);   // same session and nothing new on this page: keep the earlier last touch
    } else {
      attrLast = cur.touch;
      attrWrite('sessionStorage', LAST_KEY, { touch: attrLast });
    }
  }
  window.BlueChipAttribution = {
    get: function () { return { first: attrStrip(attrFirst), last: attrStrip(attrLast) }; }
  };
  try { captureAttribution(); } catch { /* never let attribution break the chat */ }

  // "How did you hear about us?" choices: label shown, slug sent as `heard_about`.
  var HEARD_OPTIONS = [
    ['LinkedIn', 'linkedin'], ['Instagram', 'instagram'], ['TikTok', 'tiktok'], ['YouTube', 'youtube'],
    ['Facebook', 'facebook'], ['Threads', 'threads'], ['Google search', 'google'],
    ['ChatGPT or another AI', 'ai_assistant'], ['Someone referred me', 'referral'],
    ['An email from BlueChip', 'email'], ['An event or talk', 'event'], ['Other', 'other']
  ];

  // Browse questions and answers: hidden 2026-09-24, back on 2026-10-08 (Thomas, AI door release).
  var SHOW_BROWSE = true;

  var NAVY = '#0B1A33', GOLD = '#C9A24B', CREAM = '#F5EFE6', TEXT = '#2c2c2c';

  var PLAN_NEED = 'The AI Handoff Plan';
  var PUBLIC_NEED = 'The AI Handoff Plan (public sector)';
  var PULSE_NEED = 'AI Pulse';
  var RETAINER_NEED = 'Practical AI and/or Embedded HR Retainers';
  var LEADERSHIP_NEED = 'Leadership development';

  var CHOICES = [
    PLAN_NEED,
    'The AI Handoff Plan for a municipality or public body',
    RETAINER_NEED,
    LEADERSHIP_NEED,
    'Governance or CEO evaluation',
    'Workplace investigation',
    "Something else (I'm not sure yet)"
  ];
  // Chooser label -> the lead's topic label (what Thomas sees). Labels not listed are their own topic label.
  var CHOICE_NEED = { 'The AI Handoff Plan for a municipality or public body': PUBLIC_NEED };
  // Topic label -> topic slug, for the offering bubbles.
  var NEED_SLUG = {};
  NEED_SLUG[PLAN_NEED] = 'ai-handoff-plan';
  NEED_SLUG[PUBLIC_NEED] = 'public-sector';
  NEED_SLUG[PULSE_NEED] = 'free-check';
  NEED_SLUG[RETAINER_NEED] = 'retainers';
  NEED_SLUG[LEADERSHIP_NEED] = 'leadership';

  var REFUND_URL = 'https://www.bluechip-people-strategies.com/refund';
  var REFUND_REF = 'See our Refund Policy, section 1: ' + REFUND_URL;

  // The guarantee, as one answer (Infy batch 3, "Your safety net"): automatic, a finding and not a result.
  var GUARANTEE_ANSWER = "Your safety net: if your AI plan can't show at least 3 net hours a week in total across the people who do that workflow, your full fee comes back automatically within 10 business days of your findings call. No forms, no hoops. It's a promise about what your AI plan finds, not about what happens afterwards, because the hours you actually get back depend on your team putting your AI plan in place. Net means the hours saved each week, minus the time it takes each week to check the AI's work and keep the tools running. The people who do the work means everyone who regularly does that workflow, agreed with you before we start. The 3 hours are their total, not 3 hours each. You get a copy of the hours tally that scores your AI plan. If you think we've scored it wrong, tell us within 30 days of your findings call and we'll go through it together. That review can only change the result in your favour.";
  // "What you get for C$795", in box order.
  var INCLUDED_ANSWER = "A discovery session, a written AI plan, a starter kit, a findings and setup call, and a check-in about 30 days later.";
  var SETUP_ANSWER = "On the findings and setup call, one or two of the people who do the work set up the first step with us, in a tool you already allow. If none fits yet, the call ends with the IT request written and ready to send. Rolling the change out to the rest of the team, software and licences, and anything your IT team installs are not included.";
  var RETAINER_CREDIT = "If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice. Conditions are in our Refund Policy, section 1.";

  // Approved fixed answers. Update alongside the service pages when offers change. `slug` is
  // used by the topic-preselect API/hash param (window.BlueChipChat.open, #chat?topic=).
  var KNOWLEDGE = [
    { slug: 'ai-handoff-plan', title: 'The AI Handoff Plan', need: PLAN_NEED, url: 'https://check.bluechip-people-strategies.com/ai-handoff-plan', link: 'Read the full AI Handoff Plan details', answers: [
      ['What does the AI Handoff Plan cost?', "C$795 per organization, no tax added. Asking here doesn't book anything or take payment."],
      ['What is included?', INCLUDED_ANSWER],
      ['How does the three-hour guarantee work?', GUARANTEE_ANSWER],
      ['Do you set the tools up for us?', SETUP_ANSWER],
      ['When will I receive my AI plan?', "Within five business days of having what it needs. The 45-minute findings and setup call then walks you through it."],
      ['Can I cancel, or get a refund?', "Payment, refunds and cancellation are covered in section 1 of our Refund Policy, so they're written down in one place. " + REFUND_REF],
      ['Do I have to buy a retainer?', "No. You can keep your AI plan and put it in place yourself or with another provider, or ask us about ongoing help. " + RETAINER_CREDIT]
    ] },
    { slug: 'public-sector', title: 'The AI Handoff Plan for municipalities and public bodies', need: PUBLIC_NEED, url: 'https://check.bluechip-people-strategies.com/ai-handoff-plan/public-sector', link: 'Read the public sector page', answers: [
      ['What does it cover?', "Name one workflow your staff repeat. You get a written plan showing a realistic way to use AI to give the people who do it back at least 3 net hours a week between them. Then, on the findings call, one or two of them set up the first step with us, because a process nobody uses is just a document."],
      ['What does it cost, and how do we pay?', "C$795, with no tax added. We book the discovery session once your purchase order is issued, and you pay the invoice on your normal payment terms. If an invoice is still unpaid after its terms, we hold the remaining deliverables until it's paid. " + REFUND_REF],
      ['Does AI replace CAO judgment or council governance?', "AI doesn't replace CAO judgment, council governance, or your privacy and records requirements. Your AI plan looks for time that can go back to council priorities, not positions to cut, and what you do with any time it frees up stays your decision."],
      ['What is included?', INCLUDED_ANSWER],
      ['How does the three-hour guarantee work?', GUARANTEE_ANSWER],
      ['How are tools approved?', "Before the findings and setup call, you confirm by email which tools your organization has approved, through your procurement or IT team. We set up the first step only in those."],
      ['Do I have to buy a retainer?', "No. You can keep your AI plan and put it in place yourself or with another provider, or ask us about ongoing help. " + RETAINER_CREDIT]
    ] },
    { slug: 'free-check', title: 'AI Pulse', need: PULSE_NEED, url: 'https://check.bluechip-people-strategies.com/ai-opportunity-check', link: 'Open the free AI Pulse', answers: [
      ['What does AI Pulse give me?', "Twelve quick questions about your recurring work, about four minutes in all. You'll get a starting range of the hours in play, and the areas where we'd start looking, before deciding whether you want the AI Handoff Plan."],
      ['Do I need to give my email?', 'No email or contact details are required for AI Pulse. Its answers stay in your browser tab until you close it, unless you choose to email your results to yourself at the end. Please do not enter confidential information.'],
      ['Does AI Pulse prove I will save three hours?', "No. It's a starting estimate from your own answers and published studies, not a plan and not a confirmation of the guarantee. The AI Handoff Plan checks your actual work to see where you really land."]
    ] },
    { slug: 'retainers', title: 'Practical AI and/or Embedded HR Retainers', need: RETAINER_NEED, url: 'https://www.bluechip-people-strategies.com/embedded-hr-retainers', link: 'Explore Practical AI and/or Embedded HR Retainers', answers: [
      ['Can I retain BlueChip for AI alone?', 'Yes. AI alone, HR alone, or both, scoped to what you need.'],
      ['What does embedded HR cover?', 'Senior advice on people decisions: hiring, structure, performance, pay and leadership.'],
      ['How are tools and sensitive information handled?', 'Only in tools you approve. Please keep personal and confidential details out of this chat.'],
      ['How much is ongoing advisory?', "Priced to the scope you need. Tell us what's going on and we'll suggest a starting point."]
    ] },
    { slug: 'leadership', title: 'Leadership development', need: LEADERSHIP_NEED, url: 'https://www.bluechip-people-strategies.com/leadership', link: 'Explore leadership development', answers: [
      ['What sizes are there?', "From a half-day team session to a Leadership Cohort, set to the length that suits your leaders. We'll suggest a size after a short conversation."],
      ['Can we start small?', 'Yes. Start with a half-day session or a short assessment.'],
      ['Are assessments confidential?', 'Yes. Individual reports go to the person, and how results are used is agreed up front.']
    ] },
    { slug: 'other', title: 'Other BlueChip services', need: 'Other BlueChip services', url: 'https://www.bluechip-people-strategies.com/services', link: 'Explore BlueChip services', answers: [
      ['What is a governance evaluation?', 'An independent evaluation of your CAO or executive director, done with them, not to them.'],
      ['What about workplace investigations?', "Fair and documented, and independent where it counts. If we're your HR partner, complaints about senior leaders go to an independent investigator we'll refer you to."],
      ['What is org architecture?', 'Structure and roles that fit the work: a clear read first, then design if you need it.'],
      ['What if my question is not listed?', "Not listed? Ask here and we'll reply personally. Please leave out names and confidential details."]
    ] }
  ];

  // Opening bubbles, one short set per topic. The AI Handoff Plan leads with capacity across the
  // people who do the work, then the deal, then whose it is (Thomas, 2026-10-08).
  var PLAN_BUBBLES = [
    "An hour a week each doesn't sound like much until you count the people. The AI Handoff Plan takes one workflow your team repeats and looks for the steps AI could take on for everyone who does it. It's C$795, with no tax added.",
    "Here's the deal. If your AI plan can't show at least 3 net hours a week in total across the people who do that workflow, your full fee comes back automatically within 10 business days of your findings call. No forms, no hoops.",
    'Your AI plan is yours to put in place, on your own or with our help.'
  ];
  var PUBLIC_BUBBLES = [
    "An hour a week each doesn't sound like much until you count the people. Name one workflow your staff repeat, and the AI Handoff Plan looks for the steps AI could take on for everyone who does it. It's C$795, with no tax added.",
    "Here's the deal. If your AI plan can't show at least 3 net hours a week in total across the people who do that workflow, your full fee comes back automatically within 10 business days of your findings call. No forms, no hoops.",
    "AI doesn't replace CAO judgment, council governance, or your privacy and records requirements. Your AI plan looks for time that can go back to council priorities, not positions to cut."
  ];
  var RETAINER_BUBBLES = [
    'Practical AI, embedded HR or both, scoped to what you need.',
    'You can also start with the AI Handoff Plan. If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice.'
  ];
  var OTHER_BUBBLES = [
    "Tell us what's going on and we'll point you to the right next step."
  ];
  var LEADERSHIP_BUBBLES = [
    "From a half-day team session to a multi-month cohort, sized to you. Tell us what's prompting it and we'll suggest a size."
  ];
  var FREE_CHECK_BUBBLES = [
    'Twelve quick questions about your recurring work, about four minutes in all. AI Pulse gives you a starting range of hours, with no email required. It is not the AI Handoff Plan, and it does not confirm the guarantee.'
  ];

  // ---- styles ----
  var css = '' +
    // Launcher + greeting (2026-09-25, punch list item 22): a lacquered navy orb with a gold rim,
    // a soft specular cap and a slow ripple ring; the greeting is a frosted glass card with a
    // gold edge light and a pointed corner toward the orb, that springs in and floats. Motion is off under
    // prefers-reduced-motion (see the media query below).
    '.bcw-launch{position:fixed;right:20px;bottom:20px;z-index:99998;width:60px;height:60px;padding:0;border-radius:999px;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'background:radial-gradient(120% 100% at 30% 18%,#2d4b7a 0%,#15294b 46%,' + NAVY + ' 100%);' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -4px 8px rgba(0,0,0,.45),0 0 0 1.5px rgba(201,162,75,.85),0 0 0 5px rgba(201,162,75,.14),0 16px 30px -12px rgba(11,26,51,.65),0 6px 12px rgba(11,26,51,.22);' +
      'transition:transform .3s cubic-bezier(.34,1.4,.5,1),box-shadow .3s ease}' +
    '.bcw-launch::before{content:"";position:absolute;inset:3px;border-radius:999px;background:radial-gradient(60% 42% at 50% 14%,rgba(255,255,255,.22),rgba(255,255,255,0) 72%);pointer-events:none}' +
    '.bcw-launch::after{content:"";position:absolute;inset:-5px;border-radius:999px;border:1.5px solid rgba(201,162,75,.6);opacity:0;pointer-events:none;animation:bcwRing 4.5s ease-out 2s infinite}' +
    '.bcw-launch:hover,.bcw-launch:focus-visible{transform:translateY(-2px) scale(1.04);box-shadow:inset 0 1px 0 rgba(255,255,255,.36),inset 0 -4px 8px rgba(0,0,0,.4),0 0 0 1.5px ' + GOLD + ',0 0 0 6px rgba(201,162,75,.24),0 22px 36px -12px rgba(11,26,51,.7),0 0 26px -4px rgba(201,162,75,.55)}' +
    '.bcw-launch:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:5px}' +
    '.bcw-launch:active{transform:translateY(0) scale(.96);transition-duration:.08s}' +
    '.bcw-launch svg{position:relative;width:26px;height:26px;fill:' + CREAM + ';filter:drop-shadow(0 2px 2px rgba(0,0,0,.35));transition:transform .3s cubic-bezier(.34,1.4,.5,1),fill .2s ease}' +
    '.bcw-launch:hover svg,.bcw-launch:focus-visible svg{fill:#F0D99A;transform:rotate(-6deg) scale(1.05)}' +
    '@keyframes bcwRing{0%{opacity:0;transform:scale(.92)}12%{opacity:.8}60%,100%{opacity:0;transform:scale(1.28)}}' +
    '.bcw-greet{position:fixed;right:92px;bottom:26px;z-index:99998;max-width:236px;box-sizing:border-box;color:' + TEXT + ';' +
      'background:linear-gradient(180deg,#fff 0%,rgba(252,249,243,.98) 55%,rgba(247,241,231,.97) 100%);-webkit-backdrop-filter:blur(12px) saturate(1.3);backdrop-filter:blur(12px) saturate(1.3);' +
      'border:1px solid rgba(255,255,255,.75);border-radius:16px;border-bottom-right-radius:5px;' +
      'box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(11,26,51,.06),0 2px 4px rgba(11,26,51,.08),0 14px 26px -10px rgba(11,26,51,.3),0 32px 54px -26px rgba(11,26,51,.45);' +
      'padding:13px 16px 13px 20px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.45;cursor:pointer;' +
      'transform-origin:100% 100%;animation:bcwGreetIn .7s cubic-bezier(.34,1.4,.5,1) .4s both,bcwFloat 6s ease-in-out 1.4s infinite;transition:box-shadow .25s ease}' +
    '.bcw-greet::before{content:"";position:absolute;left:9px;top:13px;bottom:13px;width:3px;border-radius:3px;background:linear-gradient(180deg,#F0D99A,' + GOLD + ');box-shadow:0 0 8px rgba(201,162,75,.55)}' +
    '.bcw-greet:hover,.bcw-greet:focus-visible{box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(201,162,75,.35),0 2px 4px rgba(11,26,51,.08),0 18px 30px -10px rgba(11,26,51,.34),0 38px 60px -26px rgba(11,26,51,.5)}' +
    '.bcw-greet:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:3px}' +
    '@keyframes bcwGreetIn{0%{opacity:0;transform:translateY(10px) scale(.9)}100%{opacity:1;transform:none}}' +
    '@keyframes bcwFloat{0%,100%{translate:0 0}50%{translate:0 -4px}}' +
    '.bcw-greet b{display:block;font-weight:600;color:' + NAVY + '}' +
    '.bcw-greet small{color:#5B6675}' +
    '.bcw-panel{position:fixed;right:20px;bottom:92px;z-index:99999;width:360px;max-width:calc(100vw - 32px);background:#fff;border:1px solid ' + CREAM + ';border-radius:16px;box-shadow:inset 0 1px 0 #fff,0 2px 6px rgba(11,26,51,.1),0 18px 34px -14px rgba(11,26,51,.35),0 40px 70px -30px rgba(11,26,51,.45);overflow:hidden;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}' +
    '.bcw-panel.bcw-open{opacity:1;transform:translateY(0);pointer-events:auto}' +
    '.bcw-header{background:' + NAVY + ';color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}' +
    '#bcwPanel .bcw-header h3{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:20px;line-height:1.2;letter-spacing:normal;margin:0;color:#fff!important}' +
    '.bcw-close{background:none;border:0;color:#fff;font-family:inherit;font-size:22px;line-height:1;cursor:pointer;padding:0 4px}' +
    '.bcw-body{padding:12px 14px;max-height:340px;overflow-y:auto}' +
    '.bcw-msg{font-size:15px;line-height:1.5;margin:0 0 12px;max-width:88%;padding:10px 14px;border-radius:14px}' +
    '.bcw-msg-bot{background:' + CREAM + ';color:' + TEXT + ';border-bottom-left-radius:4px}' +
    '.bcw-msg-user{background:' + NAVY + ';color:#fff;margin-left:auto;border-bottom-right-radius:4px}' +
    '.bcw-typing{display:flex;gap:4px;align-items:center;width:fit-content;margin:0 0 12px;padding:12px 14px;border-radius:14px;border-bottom-left-radius:4px;background:' + CREAM + '}' +
    '.bcw-typing span{width:6px;height:6px;border-radius:50%;background:#8b8b8b;animation:bcwBounce 1s infinite ease-in-out}' +
    '.bcw-typing span:nth-child(2){animation-delay:.15s}.bcw-typing span:nth-child(3){animation-delay:.3s}' +
    '@keyframes bcwBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}' +
    '.bcw-foot{border-top:1px solid ' + CREAM + ';padding:9px 12px;max-height:32dvh;overflow-y:auto}' +
    '.bcw-panel{max-height:calc(100dvh - 110px);display:flex;flex-direction:column}.bcw-body{min-height:0;flex:1 1 auto}.bcw-header{flex-shrink:0}.bcw-foot{flex-shrink:0;box-sizing:border-box}.bcw-choice{box-sizing:border-box}.bcw-choice:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:2px}' +
    '.bcw-row{display:flex;gap:8px}' +
    '.bcw-panel{color-scheme:light}' +
    '.bcw-input{flex:1;font-family:inherit;font-size:16px;color:' + NAVY + ' !important;-webkit-text-fill-color:' + NAVY + ';background:#fff !important;padding:11px 12px;border:1.5px solid rgba(11,26,51,.35) !important;border-radius:10px;outline:none;box-sizing:border-box}' +
    '.bcw-input::placeholder{color:#6b7686 !important;-webkit-text-fill-color:#6b7686;opacity:1}' +
    '.bcw-input:focus{border-color:' + GOLD + ';box-shadow:0 0 0 3px rgba(201,162,75,.25)}' +
    '.bcw-send{background:' + NAVY + ';color:#fff;border:1.5px solid ' + NAVY + ';border-radius:999px;padding:10px 20px;font-family:inherit;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s ease,color .2s ease,transform .1s ease}' +
    '.bcw-send:hover:not(:disabled){background:' + GOLD + ';border-color:' + GOLD + ';color:' + NAVY + ';transform:translateY(-1px)}' +
    '.bcw-send:disabled{background:#e4e0d8;border-color:#d8d3c8;color:#8a8578;opacity:1;cursor:not-allowed}' +
    // Topic chips: clearly visible (navy border on bone, gold on hover/focus), 44px min height, small arrow.
    '.bcw-choice{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;margin:0 0 6px;padding:11px 12px;min-height:44px;font-family:inherit;font-weight:600;font-size:13.5px;line-height:1.35;letter-spacing:normal;color:' + NAVY + ';background:#f5efe6;border:1.5px solid rgba(11,26,51,.35);border-radius:10px;cursor:pointer;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease;box-sizing:border-box}' +
    '.bcw-choice::after{content:"\\2192";flex:none;color:' + GOLD + ';font-weight:700}' +
    '.bcw-choice:hover,.bcw-choice:focus-visible{border-color:' + GOLD + ';background:#faf3e3}' +
    '.bcw-choice:focus-visible{outline:2px solid ' + GOLD + ';outline-offset:2px;box-shadow:0 0 0 3px rgba(201,162,75,.25)}' +
    '.bcw-choice.bcw-skip{margin-top:18px}' +
    '.bcw-consent{display:flex;gap:9px;align-items:flex-start;margin:10px 2px 4px;font-size:13px;line-height:1.4;color:' + TEXT + '}' +
    '.bcw-consent input{margin-top:2px;width:16px;height:16px;accent-color:' + NAVY + ';flex:0 0 auto}' +
    '.bcw-fine{margin:6px 2px 0;font-size:11px;line-height:1.4;color:#5B6675}' +
    '.bcw-note{margin:8px 2px 0;font-size:12px;line-height:1.4;color:#5B6675;font-style:italic}' +
    '.bcw-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.bcw-done{text-align:center;padding:22px 18px;color:' + TEXT + ';font-size:14px;line-height:1.5}' +
    '.bcw-done svg{width:34px;height:34px;fill:' + GOLD + ';margin-bottom:8px}' +
    '@media (prefers-reduced-motion:reduce){.bcw-panel,.bcw-launch,.bcw-launch svg,.bcw-send,.bcw-greet{transition:none}.bcw-typing span{animation:none;opacity:1}.bcw-greet{animation:none}.bcw-launch::after{animation:none;display:none}.bcw-launch:hover,.bcw-launch:focus-visible,.bcw-launch:active,.bcw-launch:hover svg{transform:none}}' +
    '.bcw-greet small{font-size:12px}' +
    '@media (max-width:480px){.bcw-panel{right:8px;left:8px;bottom:84px;width:auto;max-width:none}.bcw-greet{display:none}.bcw-choice{min-height:44px}}';

  // Chat funnel analytics (Oct 9, 2026): steps and topic labels only, never names, numbers, emails or message text.
  // On the main site the header code mirrors bc_* gtag events to PostHog; anywhere else, send to PostHog directly.
  function track(name, props) {
    try {
      var p = props || {}; p.page_path = location.pathname;
      if (typeof window.gtag === 'function') window.gtag('event', name, p);
      if (!(window.gtag && window.gtag.__bcMirror) && window.posthog && window.posthog.capture) window.posthog.capture(name, p);
    } catch (e) { /* analytics never breaks the chat */ }
  }

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
  var data = { name: '', need: '', contact: '', email: '', heard: '' };
  // The lead is never held hostage by the optional question: while it shows, leadState is
  // 'pending', and closing the chat or leaving the page sends the lead without the answer.
  var leadState = 'idle';   // idle | pending | sending | sent
  var pendingTrap = '';
  var typingGeneration = 0; // bumped to cancel any in-flight typing sequence

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch { return false; }
  }

  function build() {
    launch = el('button', { 'class': 'bcw-launch', id: 'bcwLaunch', 'aria-label': 'Chat with Chip', 'aria-haspopup': 'dialog' },
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>');

    greet = el('div', { 'class': 'bcw-greet', role: 'button', tabindex: '0', 'aria-label': 'Chat with Chip' },
      "<b>A people decision or a practical AI question?</b><small>Tell us where you need help. We will point you to the next step.</small>");

    panel = el('div', { 'class': 'bcw-panel', id: 'bcwPanel', role: 'dialog', 'aria-modal': 'false', 'aria-label': "Let's chat", 'aria-hidden': 'true' });
    var header = el('div', { 'class': 'bcw-header' }, '<h3>Let’s chat</h3>');
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

    launch.addEventListener('click', function () { toggle(); });
    greet.addEventListener('click', function () { open(); });
    greet.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    closeBtn.addEventListener('click', function () { close(); });
    window.addEventListener('pagehide', flushPendingLead);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('bcw-open')) close(); });

    // Any link/button marked for the chat opens it instead of navigating.
    // Hook: <a href="#chat">, <a href="#chat?topic=...">, or any element with [data-bcw-open]
    // (which may also carry [data-bcw-topic]).
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var trigger = e.target.closest('a[href^="#chat"], [data-bcw-open]');
      if (!trigger) return;
      e.preventDefault();
      var topic = trigger.getAttribute('data-bcw-topic') || topicFromHash(trigger.getAttribute('href') || '');
      open(topic ? { topic: topic } : undefined);
    });
    window.openBlueChipChat = open;   // programmatic open, e.g. onclick="openBlueChipChat()"
    window.BlueChipChat = { open: open, close: close }; // window.BlueChipChat.open({ topic: 'ai-handoff-plan' })
  }

  function topicFromHash(href) {
    var m = /[?&]topic=([^&]+)/.exec(href || '');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function topicBySlug(slug) {
    if (!slug) return null;
    for (var i = 0; i < KNOWLEDGE.length; i++) if (KNOWLEDGE[i].slug === slug) return KNOWLEDGE[i];
    return null;
  }

  function addMsg(text, who) {
    var p = el('p', { 'class': 'bcw-msg ' + (who === 'user' ? 'bcw-msg-user' : 'bcw-msg-bot') });
    p.textContent = text;
    bodyEl.appendChild(p);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return p;
  }

  // Reveals `messages` (an array of bot bubble strings) one at a time, each behind its own
  // typing indicator, with a delay that scales with message length (600ms + 25ms/char, clamped
  // 900-2600ms; reduced motion: a flat 400ms, no dot animation). `after` runs once the last
  // bubble has landed -- callers use it to reveal chips/fields only then. Cancellable: bumping
  // typingGeneration (on close, or whenever a new render*() starts) stops any queued step from
  // doing anything further, so closing the panel or clicking a chip early never lets a stale
  // bubble or its chips appear later.
  function sayBotSequence(messages, after) {
    var myGen = typingGeneration;
    var reduced = reducedMotion();
    var i = 0;
    function step() {
      if (myGen !== typingGeneration) return;
      if (i >= messages.length) { if (after) after(); return; }
      var text = messages[i++];
      var indicator = el('div', { 'class': 'bcw-typing', 'aria-hidden': 'true' }, '<span></span><span></span><span></span>');
      bodyEl.appendChild(indicator);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      var delay = reduced ? 400 : Math.max(900, Math.min(2600, 600 + text.length * 25));
      setTimeout(function () {
        if (myGen !== typingGeneration) return;
        indicator.remove();
        addMsg(text, 'bot');
        setTimeout(step, 50);
      }, delay);
    }
    setTimeout(step, 500); // "after the user sends something, wait about 500ms before the first indicator"
  }

  function toggle() { panel.classList.contains('bcw-open') ? close() : open(); }

  function open(opts) {
    if (greet) greet.style.display = 'none';
    panel.classList.add('bcw-open');
    panel.setAttribute('aria-hidden', 'false');
    var topic = opts && opts.topic ? topicBySlug(opts.topic) : null;
    track('bc_chat_panel_open', { topic: topic ? topic.title : '', resumed: started });
    if (!started) {
      started = true;
      renderName(topic ? function () { renderPreselected(topic); } : undefined);
    } else if (leadState === 'pending' && !topic && !footEl.querySelector('button')) {
      renderHeard(pendingTrap);   // closed before the question finished appearing, and the send did not go through
    } else if (topic) {
      // Already mid-conversation and asked to jump to a topic: cancel whatever was queued and
      // go straight there (skips re-asking for a name if we already have one).
      typingGeneration++;
      footEl.innerHTML = '';
      if (data.name) renderPreselected(topic); else renderName(function () { renderPreselected(topic); });
    }
  }
  function close() {
    flushPendingLead();
    typingGeneration++; // cancel any queued typing sequence so nothing lands after close
    panel.classList.remove('bcw-open');
    panel.setAttribute('aria-hidden', 'true');
    launch.focus();
  }

  // ---- step 1: name ----
  function renderName(onNext) {
    typingGeneration++;
    footEl.innerHTML = '';
    sayBotSequence(["Hi, I'm Chip, BlueChip's assistant. Whatever you're dealing with, you're in the right place. What should I call you?"], function () {
      var row = el('div', { 'class': 'bcw-row' });
      var input = el('input', { 'class': 'bcw-input', type: 'text', 'aria-label': 'Your name', placeholder: 'Your name' });
      var send = el('button', { 'class': 'bcw-send', type: 'button' }, 'Send');
      row.appendChild(input); row.appendChild(send);
      footEl.appendChild(row);
      if (SHOW_BROWSE) choiceButton('Browse questions and answers', renderTopics);
      input.focus();
      function go() {
        var v = input.value.trim();
        if (!v) return;
        data.name = v; addMsg(v, 'user'); track('bc_chat_name'); if (typeof onNext === 'function') onNext(); else renderChoices();
      }
      send.addEventListener('click', go);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    });
  }

  function choiceButton(label, action) {
    var b = el('button', { 'class': 'bcw-choice', type: 'button' });
    var span = document.createElement('span');
    span.textContent = label;
    b.appendChild(span);
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
    typingGeneration++;
    footEl.innerHTML = '';
    sayBotSequence(['Browse common questions about BlueChip. No contact details needed.'], function () {
      KNOWLEDGE.forEach(function (topic) {
        choiceButton(topic.title, function () { track('bc_chat_browse_topic', { topic: topic.title }); renderQuestions(topic); });
      });
      choiceButton('Ask BlueChip a different question', function () {
        data.need = 'General service inquiry';
        if (data.name) renderContact(); else renderName(renderContact);
      });
      focusChoices();
    });
  }

  function renderQuestions(topic) {
    typingGeneration++;
    footEl.innerHTML = '';
    topic.answers.forEach(function (answer) {
      choiceButton(answer[0], function () {
        typingGeneration++;
        track('bc_chat_question', { topic: topic.title, question: answer[0] });
        addMsg(answer[0], 'user');
        sayBotSequence([answer[1]], function () {
          renderQuestions(topic);
        });
      });
    });
    var resource = el('a', { 'class': 'bcw-choice', href: topic.url });
    var resSpan = document.createElement('span'); resSpan.textContent = topic.link;
    resource.appendChild(resSpan);
    footEl.appendChild(resource);
    choiceButton('Ask BlueChip about this', function () {
      data.need = topic.need;
      track('bc_chat_ask', { topic: topic.need });
      if (data.name) renderContact(); else renderName(renderContact);
    });
    choiceButton('All topics', renderTopics);
    focusChoices();
  }

  // ---- step 2: choice ----
  function renderChoices() {
    typingGeneration++;
    footEl.innerHTML = '';
    sayBotSequence(['Thanks, ' + data.name + '. What’s on your plate?'], function () {
      CHOICES.forEach(function (c) {
        choiceButton(c, function () {
          data.need = CHOICE_NEED[c] || c; addMsg(c, 'user'); track('bc_chat_topic', { topic: data.need });
          if (NEED_SLUG[data.need]) renderOffering();
          else renderContact();
        });
      });
      if (SHOW_BROWSE) choiceButton('Browse questions and answers', renderTopics);
      focusChoices();
    });
  }

  // A visitor who arrived pre-selected onto a topic (plan-page CTA, or #chat?topic=...) skips
  // the topic chooser and goes straight into that topic's normal answer flow.
  function renderPreselected(topic) {
    typingGeneration++;
    data.need = topic.need;
    track('bc_chat_topic', { topic: data.need, preselected: true });
    footEl.innerHTML = '';
    sayBotSequence(['Thanks, ' + data.name + '. You’re looking at ' + topic.title + '. What would you like to know, or shall I tell you how it works?'], function () {
      renderOffering(topic);
    });
  }

  function offeringBubbles(topic) {
    if (!topic) return PLAN_BUBBLES.slice();
    if (topic.slug === 'ai-handoff-plan') return PLAN_BUBBLES.slice();
    if (topic.slug === 'public-sector') return PUBLIC_BUBBLES.slice();
    if (topic.slug === 'retainers') return RETAINER_BUBBLES.slice();
    if (topic.slug === 'free-check') return FREE_CHECK_BUBBLES.slice();
    if (topic.slug === 'leadership') return LEADERSHIP_BUBBLES.slice();
    if (topic.slug === 'other') return OTHER_BUBBLES.slice();
    return PLAN_BUBBLES.slice();
  }

  function renderOffering(topic) {
    typingGeneration++;
    var t = topic || topicBySlug(NEED_SLUG[data.need] || 'retainers');
    footEl.innerHTML = '';
    if (t.slug === 'free-check') {
      sayBotSequence(offeringBubbles(t), function () {
        var checkLink = el('a', { 'class': 'bcw-choice', href: 'https://check.bluechip-people-strategies.com/ai-opportunity-check' });
        var checkSpan = document.createElement('span'); checkSpan.textContent = 'Start the free AI Pulse';
        checkLink.appendChild(checkSpan);
        footEl.appendChild(checkLink);
        if (SHOW_BROWSE) choiceButton('Browse questions and answers', renderTopics);
        focusChoices();
      });
      return;
    }
    sayBotSequence(offeringBubbles(t), function () {
      var next = el('button', { 'class': 'bcw-choice', type: 'button' });
      var nextSpan = document.createElement('span'); nextSpan.textContent = 'Discuss this with BlueChip';
      next.appendChild(nextSpan);
      next.addEventListener('click', renderContact);
      var back = el('button', { 'class': 'bcw-choice', type: 'button' });
      var backSpan = document.createElement('span'); backSpan.textContent = 'Choose a different service';
      back.appendChild(backSpan);
      back.addEventListener('click', renderChoices);
      footEl.appendChild(next); footEl.appendChild(back);
      if (SHOW_BROWSE) choiceButton('Browse questions and answers', renderTopics);
      focusChoices();
    });
  }

  // ---- step 3: contact + consent ----
  function renderContact() {
    typingGeneration++;
    track('bc_chat_form', { topic: data.need || '' });
    footEl.innerHTML = '';
    sayBotSequence(["What's the best number and email for BlueChip to reach you about this? We usually reply within a few hours on business days. This sends an inquiry. It doesn't book anything or charge you. Please keep employee and client details out of this chat."], function () {
      var input = el('input', { 'class': 'bcw-input', type: 'tel', 'aria-label': 'Your phone number', placeholder: 'Canadian phone number', style: 'width:100%' });
      var emailInput = el('input', { 'class': 'bcw-input', type: 'email', 'aria-label': 'Your email', placeholder: 'Email', autocomplete: 'email', style: 'width:100%;margin-top:8px' });
      var hp = el('input', { 'class': 'bcw-hp', type: 'text', name: 'bc_hp_trap', tabindex: '-1', 'aria-hidden': 'true', autocomplete: 'off' });   // not "company": browsers autofill that and flagged real visitors as bots
      var consentWrap = el('label', { 'class': 'bcw-consent' });
      var cb = el('input', { type: 'checkbox' });
      var cbText = document.createElement('span');
      cbText.textContent = "Yes, it's okay to text me at this number about my inquiry. I can reply STOP anytime.";
      consentWrap.appendChild(cb); consentWrap.appendChild(cbText);
      var fine = el('div', { 'class': 'bcw-fine' });
      fine.textContent = "We text Canadian numbers only. Outside Canada? We'll reply by email. BlueChip People Strategies, Edmonton, Alberta. We won't share your number or message you about anything unrelated to the opt-in box above. A real person reads each message. We usually reply within a few hours on business days.";
      var send = el('button', { 'class': 'bcw-send', type: 'button', disabled: 'disabled', style: 'margin-top:12px;width:100%' }, 'Send');

      footEl.appendChild(input);
      footEl.appendChild(emailInput);
      footEl.appendChild(hp);
      footEl.appendChild(consentWrap);
      footEl.appendChild(fine);
      footEl.appendChild(send);
      input.focus();

      function refresh() { send.disabled = !(input.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()) && cb.checked); }   // phone, email and consent all required
      input.addEventListener('input', refresh);
      emailInput.addEventListener('input', refresh);
      cb.addEventListener('change', refresh);

      function go() {
        if (send.disabled) return;
        data.contact = input.value.trim();
        data.email = emailInput.value.trim();
        // One optional question comes before the inquiry goes out; the send itself happens there.
        renderHeard(hp.value);
      }
      send.addEventListener('click', go);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    });
  }

  // ---- step 4: how did you hear about us (optional) ----
  // Shown after the details and before the inquiry is sent; choosing an option, or Skip, sends it.
  // Only say "Got it" once the server has recorded the inquiry; otherwise keep the choices and
  // say so (a silent failure here used to lose the lead while showing a confirmation).
  function renderHeard(trapValue) {
    typingGeneration++;
    footEl.innerHTML = '';
    leadState = 'pending';
    pendingTrap = trapValue || '';
    sayBotSequence(['One last thing: how did you hear about us? (optional)'], function () {
      var buttons = [];
      var problem = el('div', { 'class': 'bcw-fine', role: 'alert' });
      function pick(slug, label) {
        if (leadState !== 'pending') return;
        leadState = 'sending';
        problem.textContent = '';
        for (var i = 0; i < buttons.length; i++) buttons[i].disabled = true;
        data.heard = slug;
        if (label) addMsg(label, 'user');
        submitLead(trapValue).then(finish, function () {
          leadState = 'pending';
          for (var j = 0; j < buttons.length; j++) buttons[j].disabled = false;
          problem.textContent = "Sorry, that didn't go through. Please try again, or email thomas@bluechip-people-strategies.com.";
          focusChoices();
        });
      }
      footEl.appendChild(problem);   // first, so a failure message is not scrolled out of sight
      HEARD_OPTIONS.forEach(function (o) {
        buttons.push(choiceButton(o[0], function () { pick(o[1], o[0]); }));
      });
      var skip = choiceButton('Skip', function () { pick('', ''); });
      skip.classList.add('bcw-skip');
      buttons.push(skip);
      focusChoices();
    });
  }

  // Close or page-leave while the question shows: send the lead now, without an answer.
  function flushPendingLead() {
    if (leadState !== 'pending') return;
    leadState = 'sending';
    data.heard = '';
    submitLead(pendingTrap, true).then(finish, function () { leadState = 'pending'; });
  }

  function pageLabel() {
    var p = (location.pathname || '/').replace(/\/$/, '');
    if (p === '') return 'homepage chat';
    return p.replace(/^\//, '').replace(/\//g, ' ') + ' chat';
  }

  // Resolves when the server recorded the inquiry; rejects on a network error or a non-2xx reply.
  function submitLead(companyHp, keepalive) {
    try {
      var payload = {
        name: data.name, need: data.need, contact: data.contact, email: data.email,
        consent: true, source: pageLabel(), bc_hp_trap: companyHp || '',
        attribution: window.BlueChipAttribution.get()
      };
      if (data.heard) payload.heard_about = data.heard;
      var opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
      if (keepalive) opts.keepalive = true;   // lets the request finish while the page unloads
      return fetch(LEAD_ENDPOINT, opts).then(function (r) { if (!r.ok) throw new Error('lead ' + r.status); });
    } catch (err) { return Promise.reject(err); }
  }

  // Counts a sent lead in GA4 and PostHog. Topic label only: no name, email, phone or message text.
  function trackLead() {
    try {
      var props = { lead_source: 'chat', topic: data.need };
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', props);
      if (window.posthog && window.posthog.capture) window.posthog.capture('generate_lead', props);
    } catch (e) { /* analytics must never break the chat */ }
  }

  function finish() {
    if (leadState === 'sent') return;   // fire the lead event once
    leadState = 'sent';
    trackLead();
    typingGeneration++;
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
    if (location.hash.indexOf('#chat') === 0) {
      var topic = topicFromHash(location.hash);
      open(topic ? { topic: topic } : undefined);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
