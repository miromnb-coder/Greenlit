# Greenlit plan

Last updated: 2026-09-21
Repo: https://github.com/miromnb-coder/Greenlit

## Principle

The model writes. Code owns state. A human releases the message.

Do not start with an operating system. Start with one job that a paying customer already pays a person to do: handle the new website lead.

```
form / webhook
    → lead (new)
    → research
    → draft
    → waiting_approval
    → sent
    → replied
    → qualify
    → offer_or_booking
    → won | lost | needs_human
```

Claude proposes `research_lead`, `propose_email`, `propose_crm_update`, `flag_human`.
Send and CRM write happen only after an explicit approve action in our code.

## Layers (build in this order)

1. **Lead Engine** — the paid product
2. **Agent runtime** — visible steps, retries, replay (AgentOS seed)
3. **Company graph** — questions over runs + CRM + calendar (BusinessBrain seed)

## Stack for MVP

| Layer | Choice |
| --- | --- |
| App | Next.js + TypeScript + Tailwind |
| Auth / orgs | Clerk or Supabase Auth |
| Database | Postgres (Supabase or Neon) |
| Jobs | Inngest or Trigger.dev |
| Model | Claude Sonnet default, Opus only for hard research |
| Agent loop | Anthropic Messages API + our tools (not a free-form OS agent) |
| Email | Gmail / Outlook OAuth; Resend as fallback |
| Calendar | Google Calendar / Microsoft |
| CRM | HubSpot + Pipedrive first; light in-app pipeline as fallback |
| Billing | Stripe |
| Observability | Langfuse or Helicone + Sentry |
| Host | Vercel + a worker for long runs |

Token cost target: under 15% of MRR. Cap `max_turns`. Do not browse the whole internet for every lead.

## Data model (keep small)

- `organizations`, `users`, `connections`
- `playbooks` — voice, ICP, prices, forbidden claims, FAQ, language
- `leads` — source, company, person, score, status
- `runs` — one agent run per lead per stage
- `actions` — proposed / approved / rejected / executed
- `messages` — thread with the lead
- `events` — immutable audit (who, what, when, why, tokens, cost)

The playbook is the product. Without it the model invents prices.

## Three agents only

1. **Researcher** — JSON brief, no send
2. **Drafter** — first email + reason + next goal
3. **Closer-lite** — classify a reply, draft next message or booking

Orchestration is code, not a fourth free-roaming agent.

## 12 weeks

### Weeks 1–2 — manual machine

- Auth + org
- Playbook form
- Lead in: webhook + CSV + one HubSpot form
- Inbox UI
- Claude: research + draft
- Human can still send from Gmail if OAuth is not ready
- 1–2 known companies, free

Gate: 20 real leads processed. At least 7/10 drafts usable with light edits.

### Weeks 3–5 — real loop

- Gmail/Outlook OAuth send
- State machine + Inngest
- Approval queue (mobile-usable)
- HubSpot contact + note + deal stage
- Audit log + cost per lead

Gate: first paying customer at €490/mo.

### Weeks 6–8 — replies and booking

- Inbound reply webhook
- Closer-lite
- Calendar booking
- `needs_human` queue
- Dashboard: leads, time-to-approve, reply rate, meetings booked

Gate: 3–5 paying customers.

### Weeks 9–12 — runtime seed

- Visible workflow graph generated from the playbook
- Customer can disable a step or add a rule
- Run replay: “why did this lead go to needs_human?”
- Still no LinkedIn, no phone, no cold outbound

Gate: product feels like a system, not a chat box. Price €990/mo when meetings appear.

## Go-to-market this month

Do this before writing the app shell.

1. Grab a domain you can actually buy (`greenlit.app`, `trygreenlit.com`, or `greenlit.ai` if it exits redemption). `greenlit.com` is taken. Film/YouTube products already use Greenlit — different category, same Google fight.
2. Hold 10 conversations with owners of 5–40 person B2B service firms. Script: `docs/interview-script.md`.
3. If 3/10 say yes to a 20-lead trial, build weeks 1–2. If 0/10, change the sentence, not the stack.
4. First sales motion is founder-led. Automate acquisition only after 10 customers exist — on this same engine.

Interview one-liner:

> When a lead hits your site, Greenlit researches it, writes the first email, and books a time. You only approve the send. Will you run 20 leads through it?

## Brand

- Name: Greenlit
- Line: Nothing reaches a customer until you greenlight it.
- Mark: two interlocking circle+arc figures, acid lime on black; black-on-white lockup for documents
- Do not ship more logo variants until a domain and 10 interviews exist

Name risk: `greenlit.io` / GetGreenlit (film OS), `usegreenlit.com` (YouTube/podcast production hub), pending GREENLIT marks in USPTO classes 9/42 for entertainment SaaS. File EUIPO + USPTO class 42 for *sales lead handling* before a public launch. A lawyer, not a landing-page hop.

## Out of scope until year-two evidence

- General “goal → any process” builder
- Cold outbound / AI SDR blasting
- Voice agents
- Reading the company’s entire inbox as an AI CEO
- Training a custom model
- 20 integrations
- Multi-agent swarms that talk to each other freely

## Definition of done for MVP

A stranger can:

1. Create an org and paste a playbook
2. Connect Gmail
3. Drop 10 leads in
4. Approve drafts from a phone
5. See sends in Gmail and notes in HubSpot
6. Pay Stripe

If that path is broken, do not add agents.
