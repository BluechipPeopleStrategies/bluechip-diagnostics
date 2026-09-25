#!/usr/bin/env node
// Layout audit: loads each page in headless Chrome at phone and desktop widths and checks
// what the browser ACTUALLY applied (computed styles), not what the source CSS says.
//
// Checks:
//   overflow  - the page scrolls sideways at this width (lists the elements poking out)
//   min-font  - visible text rendered below config.minFontPx
//   font      - text whose first font-family is not one of config.fonts, or a brand font that
//               never loaded (so the page silently fell back to a system font)
//   override  - an element's OWN class rule sets a property (margin, display, font-size...) but a
//               broad rule that does not target that class wins the cascade anyway, e.g.
//               `.bc-page p { margin: 0 0 20px }` beating `.ai-slider-tooltip { margin-top: 10px }`.
//               This is the bug class that recurred five times on 2026-09-24.
//
// Known findings live in baseline.json so the gate fails only on NEW problems. Update it with
// --update-baseline after deciding an item is acceptable, never to make a failing run pass
// without looking.
//
// Zero dependencies: Node 22+ global fetch/WebSocket, raw Chrome DevTools Protocol.
// Chrome's --window-size flag is ignored in this environment, so the viewport is set with
// Emulation.setDeviceMetricsOverride before navigating.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Chrome + CDP

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH.');
  return found;
}

export async function launchChrome() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const userDir = mkdtempSync(join(tmpdir(), 'layout-audit-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${userDir}`,
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*', 'about:blank',
  ], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/json/version`)).ok) break; } catch { /* not up yet */ }
    await sleep(100);
  }
  return {
    async newPage() {
      // PUT, not GET: newer Chrome builds answer a GET here with plain text.
      const target = await (await fetch(`${base}/json/new?about:blank`, { method: 'PUT' })).json();
      return openSession(target.webSocketDebuggerUrl, async () => {
        await fetch(`${base}/json/close/${target.id}`).catch(() => {});
      });
    },
    async close() {
      proc.kill();
      await sleep(300);
      try { rmSync(userDir, { recursive: true, force: true }); } catch { /* Windows file locks */ }
    },
  };
}

function openSession(wsUrl, onClose) {
  return new Promise((resolveSession, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const waiters = [];
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && pending.has(data.id)) {
        const { res, rej } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) rej(new Error(`${data.error.message} (${data.error.code})`));
        else res(data.result);
      } else if (data.method) {
        for (const w of [...waiters]) {
          if (w.method === data.method) { waiters.splice(waiters.indexOf(w), 1); w.res(data.params); }
        }
      }
    };
    ws.onerror = reject;
    ws.onopen = () => resolveSession({
      send(method, params = {}) {
        const id = nextId++;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej }));
      },
      waitFor(method, timeoutMs = 20000) {
        return new Promise((res, rej) => {
          const w = { method, res };
          waiters.push(w);
          setTimeout(() => {
            const i = waiters.indexOf(w);
            if (i >= 0) { waiters.splice(i, 1); rej(new Error(`timeout waiting for ${method}`)); }
          }, timeoutMs);
        });
      },
      async close() { ws.close(); await onClose(); },
    });
  });
}

// ---------------------------------------------------------------- in-page checks

// Runs inside the page. Marks every visible element that has a class with data-la-i so the CDP
// side can fetch matched rules for exactly those nodes, in the same document order.
const PAGE_SCRIPT = (minFontPx, fonts) => `(() => {
  const vw = document.documentElement.clientWidth;
  const docScrollWidth = document.documentElement.scrollWidth;
  const out = { vw, docScrollWidth, overflow: [], smallText: [], offFont: [], fontsMissing: [], marked: [] };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0;
  };
  const label = (el) => {
    const bits = [];
    for (let n = el, depth = 0; n && n !== document.body && depth < 3; n = n.parentElement, depth++) {
      const cls = [...n.classList].filter((c) => !c.startsWith('data-')).slice(0, 2).map((c) => '.' + c).join('');
      bits.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + cls);
    }
    return bits.join(' > ');
  };
  const clippedX = (el) => {
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(n).overflowX)) return true;
    }
    return false;
  };
  const primaryFamily = (ff) => ff.split(',')[0].trim().replace(/^["']|["']$/g, '');
  const allowed = ${JSON.stringify(fonts)};
  const used = new Set();
  let i = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'svg', 'path'].includes(el.tagName) || el.closest('svg')) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (docScrollWidth > vw + 1) {
      const r = el.getBoundingClientRect();
      const parentOver = el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 1;
      if (r.right > vw + 1 && !parentOver && !clippedX(el)) out.overflow.push({ sel: label(el), right: Math.round(r.right) });
    }
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      const fs = parseFloat(cs.fontSize);
      if (fs < ${minFontPx}) out.smallText.push({ sel: label(el), px: fs, text: el.textContent.trim().slice(0, 40) });
      const fam = primaryFamily(cs.fontFamily);
      used.add(cs.fontStyle + ' ' + cs.fontWeight + ' 16px "' + fam + '"');
      if (!allowed.includes(fam)) out.offFont.push({ sel: label(el), family: fam });
    }
    if (el.classList.length) {
      el.setAttribute('data-la-i', String(i++));
      out.marked.push({ sel: label(el), classes: [...el.classList] });
    }
  }
  // Fonts load lazily and per weight/style, so check exactly the faces this page renders text in.
  for (const face of used) {
    const fam = face.match(/"(.*)"$/)[1];
    if (allowed.includes(fam) && !document.fonts.check(face)) out.fontsMissing.push(face);
  }
  return out;
})()`;

// ---------------------------------------------------------------- cascade-override check

const lastCompound = (selector) => selector.trim().split(/\s*[>+~]\s*|\s+/).pop();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetsOwnClass = (selector, classes) => {
  const lc = lastCompound(selector);
  return classes.some((c) => new RegExp(`\\.${escapeRe(c)}(?![\\w-])`).test(lc));
};

// Declarations a rule sets for the watched properties, shorthands expanded to longhands.
function declarations(style, watched) {
  const out = new Map();
  for (const p of style.cssProperties || []) {
    if (p.disabled || p.parsedOk === false) continue;
    const entries = p.longhandProperties?.length ? p.longhandProperties : [p];
    for (const e of entries) {
      if (watched.includes(e.name)) {
        out.set(e.name, { value: e.value.replace(/\s*!important\s*$/, ''), important: Boolean(p.important || e.important) });
      }
    }
  }
  return out;
}

// matchedCSSRules arrive in increasing cascade precedence (DevTools reverses them for display).
export function findOverrides(matched, classes, watched) {
  const inline = matched.inlineStyle ? declarations(matched.inlineStyle, watched) : new Map();
  const rules = (matched.matchedCSSRules || [])
    .filter((m) => m.rule.origin !== 'user-agent')
    .map((m) => {
      const selector = m.rule.selectorList.selectors[m.matchingSelectors[0]]?.text
        ?? m.rule.selectorList.text;
      return { selector, own: targetsOwnClass(selector, classes), decls: declarations(m.rule.style, watched) };
    });
  const found = [];
  for (const prop of watched) {
    if (inline.has(prop)) continue;
    const setting = rules.filter((r) => r.decls.has(prop));
    if (!setting.length) continue;
    const important = setting.filter((r) => r.decls.get(prop).important);
    const winner = (important.length ? important : setting).at(-1);
    if (winner.own) continue;
    const losingOwn = setting.filter((r) => r.own && r.decls.get(prop).value !== winner.decls.get(prop).value).at(-1);
    if (losingOwn) {
      found.push({
        property: prop,
        ownRule: losingOwn.selector, ownValue: losingOwn.decls.get(prop).value,
        winnerRule: winner.selector, winnerValue: winner.decls.get(prop).value,
      });
    }
  }
  return found;
}

// ---------------------------------------------------------------- one page at one width

export async function auditPage(browser, url, viewport, config) {
  const page = await browser.newPage();
  try {
    await page.send('Page.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: Boolean(viewport.mobile),
    });
    const loaded = page.waitFor('Page.loadEventFired');
    loaded.catch(() => {}); // a failed navigation must not surface later as a stray timeout
    const nav = await page.send('Page.navigate', { url });
    if (nav.errorText) throw new Error(`could not load ${url}: ${nav.errorText}`);
    await loaded;
    await page.send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 700)))',
      awaitPromise: true,
    });
    const res = await page.send('Runtime.evaluate', {
      expression: PAGE_SCRIPT(config.minFontPx, config.fonts), returnByValue: true,
    });
    if (res.exceptionDetails) throw new Error(`page script failed: ${res.exceptionDetails.text}`);
    const pageData = res.result.value;

    await page.send('DOM.enable');
    await page.send('CSS.enable');
    const { root } = await page.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await page.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-la-i]' });
    const overrides = [];
    if (nodeIds.length === pageData.marked.length) {
      for (let i = 0; i < nodeIds.length; i++) {
        const matched = await page.send('CSS.getMatchedStylesForNode', { nodeId: nodeIds[i] });
        for (const o of findOverrides(matched, pageData.marked[i].classes, config.watchedProperties)) {
          overrides.push({ sel: pageData.marked[i].sel, ...o });
        }
      }
    } else {
      throw new Error(`node count mismatch (${nodeIds.length} vs ${pageData.marked.length}); page changed mid-audit`);
    }

    const findings = [];
    const add = (check, sel, detail, extraKey = '') => findings.push({ check, sel, detail, key: `${check}|${sel}|${extraKey}` });
    if (pageData.docScrollWidth > pageData.vw + 1) {
      add('overflow', 'document', `page is ${pageData.docScrollWidth}px wide on a ${pageData.vw}px screen`);
      for (const o of pageData.overflow.slice(0, 8)) add('overflow', o.sel, `right edge at ${o.right}px`);
    }
    for (const s of pageData.smallText) add('min-font', s.sel, `${s.px}px text: "${s.text}"`);
    for (const f of pageData.offFont) add('font', f.sel, `renders in "${f.family}"`, f.family);
    for (const f of pageData.fontsMissing) add('font', 'document', `brand font face ${f} never loaded`, f);
    for (const o of overrides) {
      add('override', o.sel,
        `${o.property}: own rule "${o.ownRule}" sets ${o.ownValue}, but "${o.winnerRule}" wins with ${o.winnerValue}`,
        `${o.property}|${o.winnerRule}`);
    }
    // One element can match the same finding several times (e.g. repeated list items).
    return [...new Map(findings.map((f) => [f.key, f])).values()];
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------- static server for dist/

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

export function serveDist(distDir) {
  const dir = resolve(distDir);
  return new Promise((res) => {
    const server = createServer((req, reply) => {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = join(dir, path);
      if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
        file = join(dir, 'index.html'); // SPA fallback, same as the Vercel rewrite
      }
      reply.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      reply.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => res(server));
  });
}

// ---------------------------------------------------------------- CLI

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const config = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
  const baselinePath = join(HERE, 'baseline.json');
  const routes = opt('--routes')?.split(',') ?? config.routes;

  let server;
  let base = opt('--base');
  if (!base) {
    const dist = resolve(opt('--dist') ?? 'dist');
    if (!existsSync(join(dist, 'index.html'))) throw new Error(`no build at ${dist}; run vite build first`);
    server = await serveDist(dist);
    base = `http://127.0.0.1:${server.address().port}`;
  }

  const browser = await launchChrome();
  const all = [];
  try {
    for (const route of routes) {
      for (const vp of config.viewports) {
        const found = await auditPage(browser, base + route, vp, config);
        for (const f of found) all.push({ route, viewport: vp.name, ...f, key: `${route}|${vp.name}|${f.key}` });
      }
    }
  } finally {
    await browser.close();
    server?.close();
  }

  if (args.includes('--update-baseline')) {
    writeFileSync(baselinePath, JSON.stringify(all.map((f) => f.key).sort(), null, 2) + '\n');
    console.log(`baseline updated: ${all.length} known findings recorded in ${baselinePath}`);
    return;
  }

  const known = new Set(existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : []);
  const fresh = all.filter((f) => !known.has(f.key));
  const gone = [...known].filter((k) => !all.some((f) => f.key === k));
  const report = { base, routes, total: all.length, new: fresh, resolvedSinceBaseline: gone, all };
  const out = opt('--json');
  if (out) writeFileSync(out, JSON.stringify(report, null, 2));

  console.log(`layout audit: ${routes.length} routes x ${config.viewports.length} widths, ` +
    `${all.length} findings, ${known.size} in baseline, ${fresh.length} NEW`);
  for (const f of fresh) console.log(`  NEW  [${f.check}] ${f.route} @${f.viewport}  ${f.sel}\n       ${f.detail}`);
  if (gone.length) console.log(`  ${gone.length} baseline item(s) no longer occur; run with --update-baseline to drop them.`);
  process.exitCode = fresh.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`layout audit failed: ${e.message}`); process.exitCode = 2; });
}
