import type { Connections, Job, Lead, Playbook, Store } from "./types";

export function supabaseConfigured() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
  );
}

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hftyyvnzmqctndukwvdo.supabase.co").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return { url, key };
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return [] as T;
  return (await res.json()) as T;
}

type LeadRow = {
  id: string; created_at: string; source: Lead["source"]; name: string; email: string;
  company: string; title: string; message: string; status: Lead["status"];
  research: Lead["research"]; draft: Lead["draft"]; events: Lead["events"];
  thread: Lead["thread"]; intent: Lead["intent"]; slots: Lead["slots"];
  tokens: number; cost_usd: number; gmail_id: string | null; hubspot_contact_id: string | null;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    name: row.name,
    email: row.email,
    company: row.company ?? "",
    title: row.title ?? "",
    message: row.message ?? "",
    status: row.status,
    research: row.research,
    draft: row.draft,
    events: row.events ?? [],
    thread: row.thread ?? [],
    intent: row.intent ?? null,
    slots: row.slots ?? [],
    tokens: Number(row.tokens ?? 0),
    costUsd: Number(row.cost_usd ?? 0),
    gmailId: row.gmail_id ?? undefined,
    hubspotContactId: row.hubspot_contact_id ?? undefined,
  };
}

function fromLead(lead: Lead): LeadRow {
  return {
    id: lead.id,
    created_at: lead.createdAt,
    source: lead.source,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    message: lead.message,
    status: lead.status,
    research: lead.research,
    draft: lead.draft,
    events: lead.events ?? [],
    thread: lead.thread ?? [],
    intent: lead.intent,
    slots: lead.slots ?? [],
    tokens: lead.tokens ?? 0,
    cost_usd: lead.costUsd ?? 0,
    gmail_id: lead.gmailId ?? null,
    hubspot_contact_id: lead.hubspotContactId ?? null,
  };
}

export async function readRemote(): Promise<Partial<Store>> {
  const [books, conns, leads, jobs] = await Promise.all([
    rest<{ id: string; data: Playbook }[]>("playbook?id=eq.default"),
    rest<{ id: string; gmail: Connections["gmail"]; hubspot_token: string }[]>("connections?id=eq.default"),
    rest<LeadRow[]>("leads?order=created_at.desc"),
    rest<Job[]>("jobs?order=created_at.desc"),
  ]);
  return {
    playbook: books[0]?.data,
    connections: conns[0]
      ? { gmail: conns[0].gmail ?? null, hubspotToken: conns[0].hubspot_token ?? "" }
      : undefined,
    leads: (leads ?? []).map(toLead),
    jobs: jobs ?? [],
  };
}

export async function writeRemote(store: Store) {
  await rest("playbook?id=eq.default", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: "default", data: store.playbook }),
  });
  await rest("connections?id=eq.default", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: "default",
      gmail: store.connections.gmail,
      hubspot_token: store.connections.hubspotToken,
    }),
  });

  const existing = await rest<{ id: string }[]>("leads?select=id");
  const keep = new Set(store.leads.map((l) => l.id));
  const drop = existing.map((r) => r.id).filter((id) => !keep.has(id));
  if (drop.length) {
    await rest(`leads?id=in.(${drop.join(",")})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  }
  if (store.leads.length) {
    await rest("leads", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(store.leads.map(fromLead)),
    });
  }

  const jobRows = await rest<{ id: string }[]>("jobs?select=id");
  const keepJobs = new Set(store.jobs.map((j) => j.id));
  const dropJobs = jobRows.map((r) => r.id).filter((id) => !keepJobs.has(id));
  if (dropJobs.length) {
    await rest(`jobs?id=in.(${dropJobs.join(",")})`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  }
  if (store.jobs.length) {
    await rest("jobs", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(store.jobs),
    });
  }
}
