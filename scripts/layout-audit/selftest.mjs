// Self-test for the layout audit against fixture pages that reproduce the real 2026-09-24 bugs.
// Run: node --test scripts/layout-audit/selftest.mjs   (named so vitest does not collect it)
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { auditPage, launchChrome } from './audit.mjs';

const config = {
  minFontPx: 12,
  fonts: ['Arial'],
  watchedProperties: ['display', 'font-size', 'margin-top', 'margin-bottom'],
};
const phone = { name: 'phone', width: 390, height: 844, mobile: true };
const page = (css, body) => 'data:text/html,' + encodeURIComponent(
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:Arial;font-size:16px}${css}</style></head>` +
  `<body><div class="bc-page">${body}</div></body></html>`);

let browser;
before(async () => { browser = await launchChrome(); });
after(async () => { await browser.close(); });

test('flags a broad container rule beating the element\'s own class rule', async () => {
  const f = await auditPage(browser, page(
    '.bc-page p { margin: 0 0 20px } .ai-slider-tooltip { margin-top: 10px }',
    '<p class="ai-slider-tooltip">tooltip</p>'), phone, config);
  const o = f.filter((x) => x.check === 'override');
  assert.equal(o.length, 1);
  assert.match(o[0].detail, /margin-top: own rule "\.ai-slider-tooltip" sets 10px, but "\.bc-page p" wins with 0px/);
});

test('flags the .ai-term span display:block trap on a nested span', async () => {
  const f = await auditPage(browser, page(
    '.ai-term span { display: block; font-size: 12.5px } .ai-term-currency { display: inline; font-size: 16px }',
    '<div class="ai-term"><strong><span class="ai-term-currency">C$</span></strong></div>'), phone, config);
  const props = f.filter((x) => x.check === 'override').map((x) => x.detail.split(':')[0]).sort();
  assert.deepEqual(props, ['display', 'font-size']);
});

test('does not flag a two-class override that wins as intended', async () => {
  const f = await auditPage(browser, page(
    '.bc-page p { margin: 0 0 20px } .bc-page .tip { margin-top: 10px }',
    '<p class="tip">ok</p>'), phone, config);
  assert.equal(f.filter((x) => x.check === 'override').length, 0);
});

test('an !important own rule is not reported as overridden', async () => {
  const f = await auditPage(browser, page(
    '.bc-page p { margin: 0 0 20px } .tip { margin-top: 10px !important }',
    '<p class="tip">ok</p>'), phone, config);
  assert.equal(f.filter((x) => x.check === 'override').length, 0);
});

test('flags sideways scroll, tiny text and an off-brand font', async () => {
  const f = await auditPage(browser, page(
    '.wide { width: 600px } .tiny { font-size: 10px } .serif { font-family: Georgia }',
    '<div class="wide">wide</div><p class="tiny">fine print</p><p class="serif">serif</p>'), phone, config);
  const checks = new Set(f.map((x) => x.check));
  assert.ok(checks.has('overflow'), 'overflow');
  assert.ok(checks.has('min-font'), 'min-font');
  assert.ok(f.some((x) => x.check === 'font' && /Georgia/.test(x.detail)), 'font');
});

test('a clean page produces no findings', async () => {
  const f = await auditPage(browser, page(
    '.card { padding: 16px } .card p { margin: 0 }',
    '<div class="card"><p class="lede">All good.</p></div>'), phone, config);
  assert.deepEqual(f, []);
});
