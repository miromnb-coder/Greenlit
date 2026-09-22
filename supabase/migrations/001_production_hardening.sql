-- Apply to an existing Greenlit Supabase project.
create extension if not exists pgcrypto;
create table if not exists organizations (id uuid primary key default gen_random_uuid(), name text not null default 'Greenlit workspace', created_at timestamptz not null default now());
create table if not exists organization_members (organization_id uuid not null references organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'member' check (role in ('owner','admin','member')), created_at timestamptz not null default now(), primary key (organization_id, user_id));
create table if not exists org_playbooks (organization_id uuid primary key references organizations(id) on delete cascade, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists org_connections (organization_id uuid primary key references organizations(id) on delete cascade, gmail jsonb, hubspot_token text not null default '', updated_at timestamptz not null default now());
alter table leads add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table leads add column if not exists gmail_thread_id text;
alter table jobs add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table jobs add column if not exists idempotency_key text;
create table if not exists messages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, lead_id uuid not null references leads(id) on delete cascade, provider text not null, provider_message_id text not null, provider_thread_id text, direction text not null, body text not null default '', subject text not null default '', received_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (organization_id, provider, provider_message_id));

do $$ declare migration_org uuid; begin
  select id into migration_org from organizations order by created_at limit 1;
  if migration_org is null then insert into organizations(name) values ('Migrated Greenlit workspace') returning id into migration_org; end if;
  update leads set organization_id = migration_org where organization_id is null;
  update jobs set organization_id = migration_org where organization_id is null;
  insert into org_playbooks(organization_id, data) select migration_org, data from playbook where id = 'default' on conflict (organization_id) do nothing;
  insert into org_connections(organization_id, gmail, hubspot_token) select migration_org, gmail, hubspot_token from connections where id = 'default' on conflict (organization_id) do nothing;
end $$;

alter table leads alter column organization_id set not null;
alter table jobs alter column organization_id set not null;
create index if not exists leads_org_created_idx on leads(organization_id, created_at desc);
create index if not exists jobs_org_created_idx on jobs(organization_id, created_at desc);
create unique index if not exists jobs_org_idempotency_idx on jobs(organization_id, idempotency_key) where idempotency_key is not null;
create index if not exists messages_org_lead_idx on messages(organization_id, lead_id, received_at desc);

alter table organizations enable row level security; alter table organization_members enable row level security; alter table org_playbooks enable row level security; alter table org_connections enable row level security; alter table leads enable row level security; alter table jobs enable row level security; alter table messages enable row level security;
create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from organization_members where organization_id = target_org and user_id = auth.uid()); $$;
do $$ begin create policy org_member_read on organizations for select using (public.is_org_member(id)); exception when duplicate_object then null; end $$;
do $$ begin create policy org_members_read on organization_members for select using (user_id = auth.uid() or public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy playbook_member_all on org_playbooks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy connections_member_all on org_connections for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy leads_member_all on leads for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy jobs_member_all on jobs for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy messages_member_all on messages for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id)); exception when duplicate_object then null; end $$;
