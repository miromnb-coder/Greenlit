-- Run once in Supabase → SQL Editor.

create table if not exists playbook (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb
);

create table if not exists connections (
  id text primary key default 'default',
  gmail jsonb,
  hubspot_token text not null default ''
);

create table if not exists leads (
  id uuid primary key,
  created_at timestamptz not null default now(),
  source text not null,
  name text not null,
  email text not null,
  company text not null default '',
  title text not null default '',
  message text not null default '',
  status text not null,
  research jsonb,
  draft jsonb,
  events jsonb not null default '[]'::jsonb,
  thread jsonb not null default '[]'::jsonb,
  intent text,
  slots jsonb not null default '[]'::jsonb,
  tokens int not null default 0,
  cost_usd numeric not null default 0,
  gmail_id text,
  hubspot_contact_id text
);

create table if not exists jobs (
  id uuid primary key,
  type text not null,
  lead_id uuid,
  status text not null,
  detail text not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

insert into playbook (id, data) values ('default', '{}'::jsonb) on conflict (id) do nothing;
insert into connections (id) values ('default') on conflict (id) do nothing;

alter table playbook enable row level security;
alter table connections enable row level security;
alter table leads enable row level security;
alter table jobs enable row level security;
