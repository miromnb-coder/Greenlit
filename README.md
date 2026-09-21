# Greenlit

Nothing reaches a customer until you greenlight it.

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Path | Purpose |
| --- | --- |
| `/playbook` | Rules the model may use |
| `/inbox` | Queue + filters |
| `/import` | Manual / CSV |
| `/connections` | Gmail + HubSpot |
| `/activity` | Jobs and token cost |
| `POST /api/leads` | New lead webhook |
| `POST /api/replies` | Inbound reply webhook |

## Loop

1. Lead in → research + draft
2. Human greenlights → Gmail send + HubSpot note
3. Reply in (Gmail poll, webhook, or simulate) → classify
4. Follow-up draft or meeting slots → greenlight again
5. Book writes a Calendar event when Google is connected

Anger, legal tone, or playbook flags go to **Needs human**.

Reconnect Gmail after pulling this commit so `gmail.readonly` and `calendar.events` are granted.
