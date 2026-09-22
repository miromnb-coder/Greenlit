# Production hardening

The production path is organization-scoped and human-approved.

## Required environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_ENCRYPTION_KEY` — base64-encoded 32-byte key
- `WEBHOOK_SECRET` — long random secret; there is no development fallback
- `GREENLIT_WEBHOOK_ORG_ID` — explicit organization that owns unauthenticated inbound webhooks
- `APP_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Gmail
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for optional LLM enrichment

## Database

For a new database, run `supabase/schema.sql`.

For an existing Greenlit database, run `supabase/migrations/001_production_hardening.sql` before deploying this branch. The migration keeps legacy tables for rollback/reference and moves application reads to organization-scoped tables.

After migration, inspect the created `Migrated Greenlit workspace` and add the intended first signed-in user to `organization_members`. Set that organization's UUID as `GREENLIT_WEBHOOK_ORG_ID` if it should receive form/webhook leads.

## Security model

- Every signed-in user gets an organization membership on first authenticated request.
- Server-side data access filters by the authenticated organization.
- Supabase RLS is enabled on organization-scoped tables.
- Unauthenticated webhooks have an explicit organization binding and a secret; they do not fall back to a signed-in session.
- OAuth state is generated per connection attempt and validated on callback.
- Gmail credentials are encrypted at rest with AES-256-GCM.
- Webhooks require `WEBHOOK_SECRET`.

## Send pipeline

Approval creates an idempotent `send_and_crm` job. Next's request lifecycle runs the job after the approval response. Gmail success is persisted before CRM synchronization, so a CRM failure cannot cause a second Gmail send. Re-running a completed job is a no-op.

## Reply pipeline

The Gmail `threadId` is persisted on the lead and each thread message. Polling uses the known thread when available and de-duplicates by Gmail message ID.

## CI

Pull requests and pushes to `main` run lint, TypeScript typechecking, and a production build through `.github/workflows/ci.yml`.
