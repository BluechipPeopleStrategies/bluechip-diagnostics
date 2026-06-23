# BlueChip Diagnostics

React + Vite app hosting BlueChip's four free diagnostics: Org Pulse, Decision Quality Index, the Workplace Read, the Supervisor Blind Spot.

Embedded into `bluechip-people-strategies.com` via iframe — visitors stay on the BlueChip domain.

## Stack

- React 19, Vite, react-router-dom
- Plain JavaScript (no TypeScript)
- Vitest for tests
- Formspree for email opt-ins (no backend)
- Deployed on Vercel

## Local dev

```bash
npm install
cp .env.example .env.local       # then fill in the Formspree endpoint
npm run dev                       # http://localhost:5173
```

## Tests

```bash
npm run test:run
```

## Spec + plan

Lives in the `bluechip-website` repo:

- Spec: `docs/superpowers/specs/2026-05-11-diagnostics-app-design.md`
- Plan: `docs/superpowers/plans/2026-05-11-diagnostics-app.md`

## Authoring standards

See `docs/authoring-standards.md` for the voice rules and quality bar that govern question content.

## Routes

- `/` — index, lists the four diagnostics
- `/org-pulse`, `/dqi`, `/workplace-read`, `/supervisor-blind-spot` — individual quizzes
- `/<slug>/result/<encoded>` — shareable result view

## Deploy

Vercel-connected to the `main` branch of this repo. Env var `VITE_FORMSPREE_DIAGNOSTICS_ENDPOINT` is set in Vercel project settings.

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
