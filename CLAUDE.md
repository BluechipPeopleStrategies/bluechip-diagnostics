# bluechip-diagnostics

The BlueChip diagnostics site (free AI check, The AI Handoff Plan, the quiz pages). Vercel
deploys from `main`. Business rules and copy gates live in the BlueChip repo
(`C:\Users\mtsli\BlueChip\CLAUDE.md`); this file covers only what is specific to this code.

## Before calling any change done or opening a PR

1. `npm run test:run`. Lint is not a clean gate yet: `main` carries 75 pre-existing ESLint errors
   (68 are `no-undef` in `api/`, whose Node globals the config never declares). Add no new ones.
2. `npm run audit:layout`. It must report **0 NEW**. It renders every route at 390px and 1440px
   and fails on sideways scroll, text under 12px, off-brand or unloaded fonts, and a
   component's own CSS rule losing to a broad rule such as `.bc-page p` or `.ai-term span`.
   Details, limits and the baseline rules: `scripts/layout-audit/` and the BlueChip
   `layout-audit` skill. Put the audit's summary line in the PR description.
3. Pages that need clicks to reach (quiz results, the plan result) are not covered by the audit
   yet. Check the elements you changed there with `getComputedStyle` over CDP.

## CSS gotcha that keeps recurring

Broad rules like `.bc-page p { margin: 0 0 20px }` (one class plus one element) outrank a bare
`.new-class { ... }`. Write component overrides with two classes, `.parent .new-class`.
