# Greenlit

Nothing reaches a customer until you greenlight it.

Week 1: playbook, inbox, ingest, research + draft, approval.
Week 3-4: Gmail send after approve, HubSpot note, job log, model cost.

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

| Path | Purpose |
| --- | --- |
| `/playbook` | What the model may say |
| `/inbox` | Queue |
| `/import` | Manual / CSV |
| `/connections` | Gmail OAuth + HubSpot token |
| `/activity` | Jobs and token cost |
| `POST /api/leads` | Webhook (`x-greenlit-secret`) |

## Gmail

Create an OAuth client in Google Cloud. Scope `gmail.send`. Redirect:

`http://localhost:3000/api/google/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`.

Without Gmail, approve still records a local send so the queue can be tested.

## HubSpot

Paste a private app token on `/connections`. On approve, Greenlit upserts the contact and writes a note.

`ANTHROPIC_API_KEY` is optional. Cost is $0 when the stub writer runs.
