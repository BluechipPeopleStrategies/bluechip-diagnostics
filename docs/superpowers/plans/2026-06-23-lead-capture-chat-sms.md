# Lead-Capture Chat Widget → OpenPhone SMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a brand-matched guided lead-capture chat widget to the BlueChip website that texts each lead to Thomas's cell via OpenPhone and logs it to Notion.

**Architecture:** A self-contained chat widget injected into Squarespace's global footer POSTs leads to a new Vercel serverless function (`api/lead.js`) in the `bluechip-diagnostics` repo. The function sends a real SMS through the OpenPhone API and writes a backup row to the Notion contacts DB. All secrets are Vercel env vars; the widget holds none.

**Tech Stack:** Vanilla JS/CSS widget (no build), Vercel Node serverless function (ESM), Vitest for tests, OpenPhone REST API, Notion REST API.

## Global Constraints

- Two repos: serverless code in `C:\Users\mtsli\bluechip-diagnostics\`, widget in `C:\Users\mtsli\bluechip-website\embed\code-inject-footer.html`.
- No new npm dependencies (use global `fetch`, already used in `api/contact.js`).
- ESM only (`package.json` has `"type": "module"`).
- Brand tokens (verbatim): navy `#0a2540`, gold `#c9a961`, white `#ffffff`, cream `#e8e5df`, text `#2c2c2c`; serif `'Cormorant Garamond', Georgia, serif`; sans `'Montserrat', sans-serif`.
- Button language: pill `border-radius:999px`, navy fill → gold hover with navy text, uppercase Montserrat 12px, `letter-spacing:0.1em`, `translateY(-1px)` hover lift.
- No em dashes in any user-facing copy. No color-only UI states (pair with icon/text).
- CORS allowlist (verbatim, reuse from `api/contact.js`): `https://bluechip-people-strategies.com`, `https://www.bluechip-people-strategies.com`.
- Destination cell: `+15877130585` (env `LEAD_NOTIFY_PHONE`, default to this).
- All widget CSS namespaced under `.bcw-`. All env access is gated: missing vars → that channel returns false, function still returns 200.

---

## File Structure

- Create `bluechip-diagnostics/api/_lib/lead-helpers.js` — pure functions: `sanitizeLead`, `validateLead`, `isHoneypot`, `formatLeadSms`. Testable, no I/O.
- Create `bluechip-diagnostics/api/lead.js` — thin handler: CORS, method guard, calls helpers, sends OpenPhone SMS + Notion row.
- Create `bluechip-diagnostics/tests/lead-helpers.test.js` — unit tests for the pure helpers.
- Create `bluechip-diagnostics/tests/lead-handler.test.js` — handler test with mocked `fetch` + req/res.
- Modify `bluechip-website/embed/code-inject-footer.html` — append the chat widget (HTML + scoped CSS + JS).
- Modify `bluechip-diagnostics/README.md` — document the new endpoint + env vars.

---

### Task 1: Pure lead helpers (sanitize, validate, honeypot, SMS format)

**Files:**
- Create: `bluechip-diagnostics/api/_lib/lead-helpers.js`
- Test: `bluechip-diagnostics/tests/lead-helpers.test.js`

**Interfaces:**
- Produces:
  - `isHoneypot(body) -> boolean` (true if `body.company` is a non-empty string)
  - `sanitizeLead(body) -> { name, need, contact, source }` (trimmed + length-capped: name 120, need 1500, contact 200, source 100; missing → '')
  - `validateLead(clean) -> { ok: boolean, error?: string }` (requires name, need, contact non-empty)
  - `formatLeadSms(clean) -> string` (the SMS body)

- [ ] **Step 1: Write the failing tests**

```javascript
// bluechip-diagnostics/tests/lead-helpers.test.js
import { describe, it, expect } from 'vitest';
import { isHoneypot, sanitizeLead, validateLead, formatLeadSms } from '../api/_lib/lead-helpers.js';

describe('isHoneypot', () => {
  it('is true when company is filled', () => {
    expect(isHoneypot({ company: 'Acme' })).toBe(true);
  });
  it('is false when company is empty or missing', () => {
    expect(isHoneypot({ company: '' })).toBe(false);
    expect(isHoneypot({})).toBe(false);
  });
});

describe('sanitizeLead', () => {
  it('trims and defaults missing fields to empty string', () => {
    const out = sanitizeLead({ name: '  Jane  ', need: 'help', contact: 'jane@x.ca' });
    expect(out).toEqual({ name: 'Jane', need: 'help', contact: 'jane@x.ca', source: '' });
  });
  it('caps field lengths', () => {
    const out = sanitizeLead({ name: 'a'.repeat(200), need: 'b'.repeat(2000), contact: 'c'.repeat(300), source: 'd'.repeat(200) });
    expect(out.name.length).toBe(120);
    expect(out.need.length).toBe(1500);
    expect(out.contact.length).toBe(200);
    expect(out.source.length).toBe(100);
  });
});

describe('validateLead', () => {
  it('ok when all required present', () => {
    expect(validateLead({ name: 'Jane', need: 'help', contact: 'x@y.ca' })).toEqual({ ok: true });
  });
  it('fails when a required field is empty', () => {
    expect(validateLead({ name: '', need: 'help', contact: 'x@y.ca' })).toEqual({ ok: false, error: 'missing_required_fields' });
  });
});

describe('formatLeadSms', () => {
  it('renders the lead with source', () => {
    const msg = formatLeadSms({ name: 'Jane Doe', need: 'Termination help', contact: 'jane@x.ca', source: 'homepage chat' });
    expect(msg).toContain('New BlueChip lead');
    expect(msg).toContain('Name: Jane Doe');
    expect(msg).toContain('Need: Termination help');
    expect(msg).toContain('Contact: jane@x.ca');
    expect(msg).toContain('(from homepage chat)');
  });
  it('omits the source line when source is empty', () => {
    const msg = formatLeadSms({ name: 'Jane', need: 'help', contact: 'x@y.ca', source: '' });
    expect(msg).not.toContain('(from');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /c/Users/mtsli/bluechip-diagnostics && npx vitest run tests/lead-helpers.test.js`
Expected: FAIL — cannot resolve `../api/_lib/lead-helpers.js`.

- [ ] **Step 3: Write the implementation**

```javascript
// bluechip-diagnostics/api/_lib/lead-helpers.js

const CAPS = { name: 120, need: 1500, contact: 200, source: 100 };

export function isHoneypot(body) {
  return typeof body?.company === 'string' && body.company.trim().length > 0;
}

function clean(value, cap) {
  return (typeof value === 'string' ? value : '').trim().slice(0, cap);
}

export function sanitizeLead(body = {}) {
  return {
    name: clean(body.name, CAPS.name),
    need: clean(body.need, CAPS.need),
    contact: clean(body.contact, CAPS.contact),
    source: clean(body.source, CAPS.source),
  };
}

export function validateLead({ name, need, contact }) {
  if (!name || !need || !contact) {
    return { ok: false, error: 'missing_required_fields' };
  }
  return { ok: true };
}

export function formatLeadSms({ name, need, contact, source }) {
  const lines = [
    'New BlueChip lead',
    `Name: ${name}`,
    `Need: ${need}`,
    `Contact: ${contact}`,
  ];
  if (source) lines.push(`(from ${source})`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /c/Users/mtsli/bluechip-diagnostics && npx vitest run tests/lead-helpers.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/mtsli/bluechip-diagnostics
git add api/_lib/lead-helpers.js tests/lead-helpers.test.js
git commit -m "feat(lead): pure helpers for lead sanitize/validate/sms format"
```

---

### Task 2: Serverless handler `api/lead.js` (OpenPhone SMS + Notion)

**Files:**
- Create: `bluechip-diagnostics/api/lead.js`
- Test: `bluechip-diagnostics/tests/lead-handler.test.js`

**Interfaces:**
- Consumes: `isHoneypot`, `sanitizeLead`, `validateLead`, `formatLeadSms` from `./_lib/lead-helpers.js`.
- Produces: default export `handler(req, res)`; named export `sendOpenPhoneSms({ to, content }) -> Promise<boolean>` and `writeNotionLead(clean, submittedAt) -> Promise<boolean>` for testing.
- Env vars: `OPENPHONE_API_KEY`, `OPENPHONE_FROM`, `LEAD_NOTIFY_PHONE` (default `+15877130585`), `NOTION_API_KEY`, `NOTION_CONTACT_DATABASE_ID`.

- [ ] **Step 1: Write the failing test**

```javascript
// bluechip-diagnostics/tests/lead-handler.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/lead.js';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

describe('lead handler', () => {
  beforeEach(() => {
    process.env.OPENPHONE_API_KEY = 'op_test';
    process.env.OPENPHONE_FROM = '+15875550000';
    process.env.LEAD_NOTIFY_PHONE = '+15877130585';
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_CONTACT_DATABASE_ID;
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('rejects non-POST with 405', async () => {
    const req = { method: 'GET', headers: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 200 ok on honeypot without calling fetch', async () => {
    const req = { method: 'POST', headers: {}, body: { name: 'x', need: 'y', contact: 'z', company: 'bot' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields missing', async () => {
    const req = { method: 'POST', headers: {}, body: { name: '', need: '', contact: '' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('sends SMS via OpenPhone and returns smsSent true', async () => {
    const req = { method: 'POST', headers: {}, body: { name: 'Jane', need: 'help', contact: 'j@x.ca', source: 'homepage chat' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.smsSent).toBe(true);
    const call = global.fetch.mock.calls.find(c => String(c[0]).includes('openphone'));
    expect(call).toBeTruthy();
    const payload = JSON.parse(call[1].body);
    expect(payload.to).toEqual(['+15877130585']);
    expect(payload.from).toBe('+15875550000');
    expect(payload.content).toContain('Name: Jane');
    expect(call[1].headers.Authorization).toBe('op_test');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/mtsli/bluechip-diagnostics && npx vitest run tests/lead-handler.test.js`
Expected: FAIL — cannot resolve `../api/lead.js`.

- [ ] **Step 3: Write the implementation**

```javascript
// bluechip-diagnostics/api/lead.js
import { isHoneypot, sanitizeLead, validateLead, formatLeadSms } from './_lib/lead-helpers.js';

const ALLOWED_ORIGINS = [
  'https://bluechip-people-strategies.com',
  'https://www.bluechip-people-strategies.com',
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export async function sendOpenPhoneSms({ to, content }) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const from = process.env.OPENPHONE_FROM;
  if (!apiKey || !from || !to) {
    console.warn('lead: OpenPhone not configured');
    return false;
  }
  try {
    const r = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], content }),
    });
    if (!r.ok) {
      console.error('lead: OpenPhone send failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lead: OpenPhone send error', err);
    return false;
  }
}

export async function writeNotionLead(clean, submittedAt) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_CONTACT_DATABASE_ID;
  if (!apiKey || !databaseId) {
    console.warn('lead: Notion contact DB not configured');
    return false;
  }
  try {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: clean.name } }] },
          Inquiry: { rich_text: [{ text: { content: `${clean.need}\nContact: ${clean.contact}` } }] },
          Source: { rich_text: [{ text: { content: clean.source || 'chat widget' } }] },
          'Submitted At': { date: { start: submittedAt } },
          Status: { select: { name: 'New' } },
        },
      }),
    });
    if (!r.ok) {
      console.error('lead: Notion write failed', r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('lead: Notion write error', err);
    return false;
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = req.body || {};

  if (isHoneypot(body)) {
    console.warn('lead: honeypot triggered');
    return res.status(200).json({ ok: true });
  }

  const clean = sanitizeLead(body);
  const valid = validateLead(clean);
  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  const submittedAt = new Date().toISOString();
  const to = process.env.LEAD_NOTIFY_PHONE || '+15877130585';

  const smsSent = await sendOpenPhoneSms({ to, content: formatLeadSms(clean) });
  const notionWritten = await writeNotionLead(clean, submittedAt);

  return res.status(200).json({ ok: true, smsSent, notionWritten });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/mtsli/bluechip-diagnostics && npx vitest run tests/lead-handler.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite + lint**

Run: `cd /c/Users/mtsli/bluechip-diagnostics && npm run test:run && npm run lint`
Expected: all tests pass, no new lint errors.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/mtsli/bluechip-diagnostics
git add api/lead.js tests/lead-handler.test.js
git commit -m "feat(lead): serverless handler sends OpenPhone SMS + Notion backup"
```

---

### Task 3: Brand-matched chat widget in the footer injection

**Files:**
- Modify: `bluechip-website/embed/code-inject-footer.html` (append widget block at end of file)

**Interfaces:**
- Consumes: POSTs `{ name, need, contact, source, company }` to the `LEAD_ENDPOINT` constant (set to the Vercel deploy origin + `/api/lead`).
- Produces: a sitewide floating chat widget.

- [ ] **Step 1: Append the widget**

Append the following to the end of `bluechip-website/embed/code-inject-footer.html`. Replace `LEAD_ENDPOINT` only if the Vercel domain differs from the placeholder; Thomas confirms the domain at deploy time.

```html
<!-- ===== BlueChip lead-capture chat widget ===== -->
<style>
  .bcw-launch {
    position: fixed; right: 20px; bottom: 20px; z-index: 99998;
    width: 60px; height: 60px; border-radius: 999px;
    background: #0a2540; border: 1.5px solid #0a2540; cursor: pointer;
    box-shadow: 0 8px 24px rgba(10,37,64,.18);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s ease, transform .1s ease;
  }
  .bcw-launch:hover { background: #c9a961; border-color: #c9a961; transform: translateY(-1px); }
  .bcw-launch svg { width: 26px; height: 26px; fill: #ffffff; transition: fill .2s ease; }
  .bcw-launch:hover svg { fill: #0a2540; }
  .bcw-panel {
    position: fixed; right: 20px; bottom: 92px; z-index: 99999;
    width: 360px; max-width: calc(100vw - 32px);
    background: #ffffff; border: 1px solid #e8e5df; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(10,37,64,.18); overflow: hidden;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    opacity: 0; transform: translateY(12px); pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
  }
  .bcw-panel.bcw-open { opacity: 1; transform: translateY(0); pointer-events: auto; }
  .bcw-header {
    background: #0a2540; color: #fff; padding: 16px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .bcw-header h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 22px; margin: 0; }
  .bcw-close { background: none; border: 0; color: #fff; font-size: 22px; line-height: 1; cursor: pointer; padding: 0 4px; }
  .bcw-body { padding: 16px 18px; max-height: 320px; overflow-y: auto; }
  .bcw-msg { font-size: 15px; line-height: 1.5; margin: 0 0 12px; max-width: 85%; padding: 10px 14px; border-radius: 14px; }
  .bcw-msg-bot { background: #e8e5df; color: #2c2c2c; border-bottom-left-radius: 4px; }
  .bcw-msg-user { background: #0a2540; color: #fff; margin-left: auto; border-bottom-right-radius: 4px; }
  .bcw-form { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid #e8e5df; }
  .bcw-input {
    flex: 1; font-family: inherit; font-size: 15px; color: #2c2c2c;
    padding: 10px 12px; border: 1px solid #e8e5df; border-radius: 10px; outline: none;
  }
  .bcw-input:focus { border-color: #c9a961; box-shadow: 0 0 0 3px rgba(201,169,97,.25); }
  .bcw-send {
    background: #0a2540; color: #fff; border: 1.5px solid #0a2540; border-radius: 999px;
    padding: 10px 20px; font-family: inherit; font-weight: 600; font-size: 12px;
    letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
    transition: background .2s ease, color .2s ease, transform .1s ease;
  }
  .bcw-send:hover { background: #c9a961; border-color: #c9a961; color: #0a2540; transform: translateY(-1px); }
  .bcw-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .bcw-done { text-align: center; padding: 24px 18px; color: #2c2c2c; }
  .bcw-done svg { width: 34px; height: 34px; fill: #c9a961; margin-bottom: 8px; }
  @media (prefers-reduced-motion: reduce) {
    .bcw-panel, .bcw-launch, .bcw-send { transition: none; }
  }
  @media (max-width: 480px) {
    .bcw-panel { right: 8px; left: 8px; bottom: 84px; width: auto; max-width: none; }
  }
</style>

<button class="bcw-launch" id="bcwLaunch" aria-label="Open chat" aria-haspopup="dialog">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>
</button>

<div class="bcw-panel" id="bcwPanel" role="dialog" aria-modal="false" aria-labelledby="bcwTitle" aria-hidden="true">
  <div class="bcw-header">
    <h3 id="bcwTitle">Let's talk</h3>
    <button class="bcw-close" id="bcwClose" aria-label="Close chat">&times;</button>
  </div>
  <div class="bcw-body" id="bcwBody" aria-live="polite"></div>
  <form class="bcw-form" id="bcwForm" autocomplete="off">
    <input class="bcw-hp" type="text" name="company" tabindex="-1" aria-hidden="true" autocomplete="off">
    <input class="bcw-input" id="bcwInput" type="text" aria-label="Your message" required>
    <button class="bcw-send" type="submit">Send</button>
  </form>
</div>

<script>
(function () {
  var LEAD_ENDPOINT = 'https://bluechip-diagnostics.vercel.app/api/lead';
  var launch = document.getElementById('bcwLaunch');
  var panel = document.getElementById('bcwPanel');
  var closeBtn = document.getElementById('bcwClose');
  var body = document.getElementById('bcwBody');
  var form = document.getElementById('bcwForm');
  var input = document.getElementById('bcwInput');
  var hp = form.querySelector('input[name="company"]');

  var steps = [
    { key: 'name', prompt: "Hi, I'm BlueChip's assistant. What's your name?" },
    { key: 'need', prompt: 'Good to meet you. What do you need help with?' },
    { key: 'contact', prompt: "What's the best number or email to reach you?" }
  ];
  var idx = 0;
  var data = { name: '', need: '', contact: '' };
  var started = false;

  function addMsg(text, who) {
    var p = document.createElement('p');
    p.className = 'bcw-msg ' + (who === 'user' ? 'bcw-msg-user' : 'bcw-msg-bot');
    p.textContent = text;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  function open() {
    panel.classList.add('bcw-open');
    panel.setAttribute('aria-hidden', 'false');
    if (!started) { started = true; addMsg(steps[0].prompt, 'bot'); }
    input.focus();
  }
  function close() {
    panel.classList.remove('bcw-open');
    panel.setAttribute('aria-hidden', 'true');
    launch.focus();
  }

  launch.addEventListener('click', function () {
    panel.classList.contains('bcw-open') ? close() : open();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('bcw-open')) close();
  });

  function pageLabel() {
    var p = (location.pathname || '/').replace(/\/$/, '');
    if (p === '' ) return 'homepage chat';
    return p.replace(/^\//, '').replace(/\//g, ' ') + ' chat';
  }

  function submitLead() {
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name, need: data.need, contact: data.contact,
        source: pageLabel(), company: hp.value
      })
    }).catch(function () { /* lead still shown as received; failures logged server-side */ });
  }

  function finish() {
    form.style.display = 'none';
    var done = document.createElement('div');
    done.className = 'bcw-done';
    done.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>' +
      '<div>Thanks, Thomas will reach out shortly.</div>';
    body.appendChild(done);
    body.scrollTop = body.scrollHeight;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = input.value.trim();
    if (!val) return;
    addMsg(val, 'user');
    data[steps[idx].key] = val;
    input.value = '';
    idx++;
    if (idx < steps.length) {
      addMsg(steps[idx].prompt, 'bot');
    } else {
      submitLead();
      finish();
    }
  });
})();
</script>
<!-- ===== end chat widget ===== -->
```

- [ ] **Step 2: Lint-check the HTML embed for unclosed tags**

Run: `cd /c/Users/mtsli/bluechip-website && node scripts/check-links.mjs 2>/dev/null || echo "no link check applies to footer"`
Expected: no errors (this file has no internal links; command is a sanity run).

- [ ] **Step 3: Visual smoke test locally**

Open `bluechip-website/preview.html` in a browser (or paste the widget into any local HTML file that loads Montserrat + Cormorant Garamond). Confirm: bubble bottom-right in navy, hovers gold; panel opens with serif "Let's talk" header; 3-step flow runs; confirmation shows gold check + text. Network tab shows a POST attempt to `LEAD_ENDPOINT` (will CORS-fail locally; that is expected until deployed).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/mtsli/bluechip-website
git add embed/code-inject-footer.html
git commit -m "feat: brand-matched lead-capture chat widget in footer injection"
```

---

### Task 4: Env vars, docs, and end-to-end verification

**Files:**
- Modify: `bluechip-diagnostics/README.md` (document endpoint + env vars)

- [ ] **Step 1: Document the endpoint and env vars**

Add a section to `bluechip-diagnostics/README.md`:

```markdown
## Lead chat widget (`/api/lead`)

The BlueChip site footer widget POSTs `{ name, need, contact, source, company }`
to `/api/lead`. The handler texts the lead to Thomas via OpenPhone and writes a
Notion backup row. Required Vercel env vars:

- `OPENPHONE_API_KEY` — OpenPhone API key (Settings > API).
- `OPENPHONE_FROM` — OpenPhone number to send from, E.164 (e.g. `+1587...`).
- `LEAD_NOTIFY_PHONE` — destination cell, E.164 (default `+15877130585`).
- `NOTION_API_KEY`, `NOTION_CONTACT_DATABASE_ID` — reused from the contact form.

Widget endpoint constant lives in `bluechip-website/embed/code-inject-footer.html`
(`LEAD_ENDPOINT`); it must match this deploy's origin.
```

- [ ] **Step 2: Commit the docs**

```bash
cd /c/Users/mtsli/bluechip-diagnostics
git add README.md
git commit -m "docs: document /api/lead endpoint and env vars"
```

- [ ] **Step 3: Set Vercel env vars (Thomas)**

In the Vercel `bluechip-diagnostics` project → Settings → Environment Variables, add `OPENPHONE_API_KEY`, `OPENPHONE_FROM`, and (if not default) `LEAD_NOTIFY_PHONE`. Redeploy.

- [ ] **Step 4: Paste the widget into Squarespace (Thomas)**

Copy the contents of `embed/code-inject-footer.html` into Squarespace → Settings → Advanced → Code Injection → Footer. Save. Confirm `LEAD_ENDPOINT` matches the live Vercel origin.

- [ ] **Step 5: End-to-end test (Thomas)**

On the live site, open the chat bubble, complete the 3 steps with a test lead. Confirm within ~1 minute: a real SMS arrives at 587-713-0585 with the lead, and a new row appears in the Notion contacts DB. If no SMS: check Vercel function logs for `lead: OpenPhone send failed` and verify the API key + `from` number.

---

## Notes for the implementer

- Do NOT push. Thomas confirms pushes manually (global rule). Commits are local.
- The two repos are committed independently; do not stage across them.
- `bluechip-diagnostics` deploys from `main` on Vercel; do not commit to `main` without Thomas's say (auto-deploy). Work on a feature branch if the repo is on `main`.
- DEVIATION FROM SPEC: the spec listed a best-effort in-memory per-IP rate-limit. It is intentionally omitted because Vercel serverless instances are ephemeral and per-instance counters do not reliably throttle. The honeypot is the real spam defense; if abuse appears later, add a durable limiter (e.g. Upstash) as a follow-up. SMS cost is $0 within the OpenPhone plan, so the risk is annoyance, not spend.
