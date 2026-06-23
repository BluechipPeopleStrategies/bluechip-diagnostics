# BlueChip Lead-Capture Chat Widget → OpenPhone SMS

Date: 2026-06-23
Status: Approved design (pending spec review)

## Goal

Add a guided lead-capture chat widget to the BlueChip website that, on
completion, sends the lead to Thomas's cell (587-713-0585) as a **real SMS**
via the existing OpenPhone account (no extra cost), and logs the lead to the
Notion contacts DB as a backup. Widget shows **sitewide**.

## Non-goals

- No AI / LLM conversation. The bot is a fixed 3-step guided form styled as chat.
- No new hosting. Reuses the existing Vercel deploy (`bluechip-diagnostics`).
- No secrets in the page. All API keys live in Vercel env vars.

## Architecture

Three pieces, all in existing repos:

1. **Widget (front-end)** — self-contained HTML/CSS/JS in
   `bluechip-website/embed/code-inject-footer.html`. Pasted once into
   Squarespace → Settings → Advanced → Code Injection → Footer. No build step,
   no external dependencies. Renders a floating chat bubble bottom-right.

2. **Serverless bridge** — new `bluechip-diagnostics/api/lead.js` on the
   existing Vercel deploy. Mirrors `api/contact.js`: CORS allowlist, honeypot,
   env-var gating, graceful failure. Receives the POST, sends the SMS, writes
   Notion.

3. **Delivery** — `api/lead.js` calls the OpenPhone API to send an SMS
   **from** the OpenPhone business number **to** the cell. Plus a Notion row.

```
Visitor (Squarespace page)
   └─ chat widget (footer injection)
        └─ POST https://<vercel-domain>/api/lead   {name, need, contact, source, company}
             ├─ OpenPhone API  → SMS to 587-713-0585
             └─ Notion API     → contacts DB row (backup)
```

## Chat flow (guided, fixed script)

1. Open bubble → "Hi, I'm BlueChip's assistant. What's your name?"
2. "What do you need help with?" (free text)
3. "What's the best number or email to reach you?"
4. Confirmation: "Thanks — Thomas will reach out shortly."

On step 3 submit, POST the payload. The `company` field is a hidden honeypot
(bots fill it; humans don't). Steps are client-side state; no partial sends.

### Payload

```json
{
  "name": "Jane Doe",
  "need": "Need help with a termination",
  "contact": "jane@acme.ca",
  "source": "homepage chat",
  "company": ""
}
```

## SMS format

```
New BlueChip lead 🔵
Name: Jane Doe
Need: Need help with a termination
Contact: jane@acme.ca
(from <source>)
```

## api/lead.js behavior

- Methods: `OPTIONS` (204), `POST` (handle), else 405.
- CORS: reuse the `ALLOWED_ORIGINS` allowlist from `contact.js`
  (`bluechip-people-strategies.com` + `www`).
- Honeypot: if `company` is non-empty, return `200 {ok:true}` without sending.
- Validation: require `name`, `need`, `contact`. Trim + length-cap each field
  (name 120, need 1500, contact 200) before use.
- Rate-limit: lightweight in-memory per-IP throttle (e.g. max 5 / 10 min) to
  blunt spam bursts. Best-effort only (serverless instances are ephemeral);
  honeypot is the primary defense.
- Send SMS via OpenPhone, then write Notion. Each is independent and
  env-gated; failure of one does not block the other.
- Return `200 {ok:true, smsSent, notionWritten}`.

### OpenPhone send

```
POST https://api.openphone.com/v1/messages
Authorization: <OPENPHONE_API_KEY>        # raw key, not "Bearer"
Content-Type: application/json

{ "from": "<OPENPHONE_FROM>", "to": ["+15877130585"], "content": "<message>" }
```

### Notion write

Reuse the `writeNotionContactRow` shape from `contact.js` against
`NOTION_CONTACT_DATABASE_ID` (Name = name, Inquiry = need, Email-or-phone =
contact stored in Inquiry/Source text since `contact` may be a phone, Source =
source, Status = New, Submitted At = now).

## Environment variables (Vercel)

| Var | Purpose | Source |
|-----|---------|--------|
| `OPENPHONE_API_KEY` | Auth for OpenPhone API | OpenPhone → Settings → API |
| `OPENPHONE_FROM` | OpenPhone number to send from (E.164, e.g. `+1...`) | OpenPhone number |
| `LEAD_NOTIFY_PHONE` | Destination cell (default `+15877130585`) | known |
| `NOTION_API_KEY` | Notion auth | existing |
| `NOTION_CONTACT_DATABASE_ID` | Contacts DB | existing |

All gated: if OpenPhone vars are missing, `smsSent=false` and the function
still returns 200 (and still writes Notion). Nothing crashes.

## Widget scope

- **Sitewide.** Injected in the global footer; appears on every page.
- `source` defaults to the page path label (e.g. "homepage chat",
  "services chat") so texts say where the lead came from.

## Security / cost

- No secrets in the browser; the page only knows the Vercel `/api/lead` URL.
- Honeypot + rate-limit guard against spam.
- SMS cost: $0 extra (within existing OpenPhone plan). Notion: free.

## Testing

- Unit: `api/lead.js` — honeypot path, missing-field 400, happy path with
  OpenPhone + Notion fetch mocked, env-missing graceful path. Mirror the
  existing `tests/` style for the api handlers.
- Manual: paste widget into a Squarespace test page (or open
  `bluechip-website/preview.html` locally), submit, confirm a real text
  arrives and a Notion row appears.

## Open items for Thomas

1. Generate an OpenPhone API key and confirm the OpenPhone "from" number.
2. Confirm the live site origin(s) are exactly the two in `ALLOWED_ORIGINS`.
