import { promises as fs } from "fs";
import path from "path";
import type { Connections, Lead, Playbook, Store } from "./types";
import { readRemote, supabaseConfigured, writeRemote } from "./supabase";

const FILE = process.env.VERCEL
  ? path.join("/tmp", "greenlit-store.json")
  : path.join(process.cwd(), "data", "store.json");

export const defaultPlaybook: Playbook = {
  companyName: "Greenlit",
  offer: "Inbound lead handling: research, first email, approval, CRM note.",
  notSelling: "Cold outbound, phone agents, generic chatbots.",
  icpFirm: "B2B service firms",
  icpSize: "5-40 people",
  icpRole: "Founder, sales lead, managing partner",
  disqualify: "Students, job seekers, vendors pitching us",
  language: "en",
  tone: "direct, calm, specific",
  exampleSentences: "You asked about inbound lead handling. I read the note you left on the form.\nHappy to show the approval queue on a 20-minute call.\nIf this is not a fit I will say so in the first reply.",
  priceRange: "EUR 490-1990 / month",
  forbiddenClaims: "Guaranteed pipeline. Replaces the sales team. Sends without approval.",
  firstEmailGoal: "Confirm the request and offer a short call.",
  qualifyingQuestions: "How many website leads per week?\nWho answers them today?\nWhich CRM do you open daily?",
  meetingRule: "Offer a time only after they confirm they own inbound.",
  calendarLink: "",
  flagHumanWhen: "Pricing negotiation, legal, anger, or unclear fit.",
  senderName: "Alex",
  senderTitle: "Founder",
  companyUrl: "https://github.com/miromnb-coder/Greenlit",
};

export const defaultConnections: Connections = { gmail: null, hubspotToken: "" };
const empty: Store = { playbook: defaultPlaybook, leads: [], connections: defaultConnections, jobs: [] };

let memory: Store = empty;

function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    thread: lead.thread ?? [],
    slots: lead.slots ?? [],
    intent: lead.intent ?? null,
    tokens: lead.tokens ?? 0,
    costUsd: lead.costUsd ?? 0,
  };
}

function hydrate(parsed: Partial<Store>): Store {
  return {
    playbook: { ...defaultPlaybook, ...parsed.playbook },
    leads: (parsed.leads ?? []).map(normalizeLead),
    connections: { ...defaultConnections, ...parsed.connections },
    jobs: parsed.jobs ?? [],
  };
}

async function ensure() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.access(FILE);
  } catch {
    try {
      await fs.writeFile(FILE, JSON.stringify(empty, null, 2));
    } catch {
      /* ignore */
    }
  }
}

export async function readStore(): Promise<Store> {
  if (supabaseConfigured()) {
    try {
      memory = hydrate(await readRemote());
      return memory;
    } catch {
      return memory ?? empty;
    }
  }
  try {
    await ensure();
    const raw = await fs.readFile(FILE, "utf8");
    memory = hydrate(JSON.parse(raw) as Partial<Store>);
    return memory;
  } catch {
    return memory ?? empty;
  }
}

export async function writeStore(store: Store) {
  memory = store;
  if (supabaseConfigured()) {
    await writeRemote(store);
    return;
  }
  try {
    await ensure();
    await fs.writeFile(FILE, JSON.stringify(store, null, 2));
  } catch {
    /* memory only */
  }
}

export async function mutateStore<T>(fn: (store: Store) => T | Promise<T>) {
  const store = await readStore();
  const result = await fn(store);
  await writeStore(store);
  return result;
}

export function addEvent(lead: Lead, type: string, detail: string, extra?: { tokens?: number; costUsd?: number }) {
  lead.events.unshift({ at: new Date().toISOString(), type, detail, ...extra });
}
