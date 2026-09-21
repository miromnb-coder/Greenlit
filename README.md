# Greenlit

Nothing reaches a customer until you greenlight it.

Week 1 of the lead engine: playbook, inbox, ingest, research + draft, human approval.

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

- `/playbook` — what the model may say
- `/inbox` — queue
- `/import` — manual lead or CSV
- `POST /api/leads` — webhook header `x-greenlit-secret`

`ANTHROPIC_API_KEY` is optional. Without it, drafts use a deterministic stub.
Approve in week 1 marks the lead sent locally. Gmail OAuth is weeks 3–4.

## Docs

- [BUILD.md](./BUILD.md)
- [PLAN.md](./PLAN.md)
- [docs/interview-script.md](./docs/interview-script.md)
