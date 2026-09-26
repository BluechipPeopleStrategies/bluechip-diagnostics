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

## Follow-up emails and the Cal.com webhook (`/api/cal-webhook`)

A scored diagnostic schedules a 24h nudge in Resend (`scheduled_at`). When the lead books
a Clarity Call, Cal.com's `BOOKING_CREATED` webhook pages through Resend's List Emails
endpoint (last 50 hours) and cancels every still-scheduled BlueChip follow-up addressed to
the booker's email (`api/_lib/followups.js`). A `BOOKING_CANCELLED` whose booking notes carry
`Diagnostic: <id>` (prefilled by every BlueChip booking link) schedules a +48h follow-up,
unless one is already pending. No Notion, no stored ids. Needs `RESEND_API_KEY`,
`BLUECHIP_FROM_EMAIL`, `CAL_BOOKING_URL`, and `CAL_WEBHOOK_SECRET` (set it: without it the
webhook accepts unsigned requests).

## Lead chat widget (`/api/lead`)

The BlueChip site footer widget POSTs `{ name, need, contact, source, company }`
to `/api/lead`. The handler texts the lead to Thomas via OpenPhone and emails him a
copy (with a Lead-Data block that the local Obsidian capture job files; Notion is
legacy and no longer written). Required Vercel env vars:

- `OPENPHONE_API_KEY` — OpenPhone API key (Settings > API).
- `OPENPHONE_FROM` — OpenPhone number to send from, E.164 (e.g. `+1587...`).
- `LEAD_NOTIFY_PHONE` — destination cell, E.164 (default `+15877130585`).
- `RESEND_API_KEY`, `BLUECHIP_FROM_EMAIL`, `BLUECHIP_NOTIFY_EMAIL` — the email copy.

Widget endpoint constant lives in `bluechip-website/embed/code-inject-footer.html`
(`LEAD_ENDPOINT`); it must match this deploy's origin.
