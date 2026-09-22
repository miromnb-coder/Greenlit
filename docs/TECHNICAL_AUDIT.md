# Technical audit — 2026-09-22

## What works

- Supabase Auth derives an organization for signed-in users, tenant columns exist on the primary operational tables, and RLS is enabled in the supplied schema/migration.
- Gmail OAuth uses an HTTP-only state cookie and encrypts the stored Gmail credential envelope with AES-256-GCM.
- The lead status transition helper, basic human approval gate, Gmail send, reply ingestion, CRM failure isolation, and an activity view are implemented.

## Gaps and production blockers

- `lib/store.ts` still provides a file-backed fallback and persists remote state by reading and writing complete aggregates. This is not safe for concurrent production writes; lead, message, job, event, and connection mutations must move to scoped SQL/RPC operations before production launch.
- The current job runner executes in the Next.js request lifecycle rather than in a durable worker. It has no persisted attempt count, retry schedule, lease, or crash recovery. A send can therefore be uncertain if the process stops after Gmail accepts it and before Greenlit records the provider message ID.
- `leads.events` and `leads.thread` are JSON arrays rather than immutable audit/event records for the main UI flow. The `messages` table exists but is not yet the sole conversation source of truth.
- Webhook authentication uses a single shared secret and a configured organization rather than per-connection signed webhook verification. HubSpot credentials are also stored as plain text in the current connection row.
- Research output is schema-normalized but does not yet contain source URLs, confidence per claim, or a factual retrieval layer. The application must not present it as verified research.

## UX gaps

- Onboarding is not yet a guided organization → Gmail → playbook → first-import path.
- Inbox views are usable but do not surface a consolidated priority queue for approvals, replies, meetings, research readiness, and failed jobs.

## Change delivered in this iteration

- CSV imports now use a bounded RFC-4180-style parser, validate the supported header aliases, reject malformed rows, detect duplicate email addresses already in the workspace or file, and report skipped rows to the user.
- Manual lead creation now shares the same server-side field and email validation as webhook and CSV ingestion.
- CI now runs linting, strict type checking, unit tests, and a production build. The Google-hosted runtime font was replaced with a system font stack so an otherwise valid production build does not depend on a network font download.

## Next implementation priority

1. Replace aggregate store mutations with organization-scoped Postgres operations and append-only `events`/`actions` records.
2. Create a durable, leased jobs table/worker with idempotency, attempts, exponential backoff, and an outbound-message ledger before retrying Gmail sends.
3. Move reply deduplication to `messages`, then add signed provider webhook handling and unsubscribe-safe state transitions.
