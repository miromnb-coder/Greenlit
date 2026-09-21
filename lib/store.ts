import { promises as fs } from "fs";
import path from "path";
import type { Lead, Playbook, Store } from "./types";

const FILE = path.join(process.cwd(), "data", "store.json");

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

const empty: Store = { playbook: defaultPlaybook, leads: [] };

async function ensure() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify(empty, null, 2));
  }
}

export async function readStore(): Promise<Store> {
  await ensure();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Store;
    return { playbook: { ...defaultPlaybook, ...parsed.playbook }, leads: parsed.leads ?? [] };
  } catch {
    return empty;
  }
}

export async function writeStore(store: Store) {
  await ensure();
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export async function mutateStore<T>(fn: (store: Store) => T | Promise<T>) {
  const store = await readStore();
  const result = await fn(store);
  await writeStore(store);
  return result;
}

export function addEvent(lead: Lead, type: string, detail: string) {
  lead.events.unshift({ at: new Date().toISOString(), type, detail });
}
