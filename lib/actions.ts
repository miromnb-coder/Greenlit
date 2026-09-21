"use server";

import { revalidatePath } from "next/cache";
import { addEvent, defaultPlaybook, mutateStore } from "./store";
import { assertTransition } from "./state";
import { runResearchAndDraft } from "./research";
import { enqueueSend } from "./jobs";
import type { Lead, Playbook } from "./types";

function id() {
  return crypto.randomUUID();
}
function now() {
  return new Date().toISOString();
}

export async function savePlaybook(form: FormData) {
  const patch = Object.fromEntries(form.entries()) as Record<string, string>;
  await mutateStore((s) => {
    s.playbook = { ...defaultPlaybook, ...s.playbook, ...patch } as Playbook;
  });
  revalidatePath("/playbook");
}

export async function saveHubspotToken(form: FormData) {
  const token = String(form.get("hubspotToken") ?? "").trim();
  await mutateStore((s) => {
    s.connections.hubspotToken = token;
  });
  revalidatePath("/connections");
}

export async function disconnectGmail() {
  await mutateStore((s) => {
    s.connections.gmail = null;
  });
  revalidatePath("/connections");
}

export async function createLead(input: {
  name: string; email: string; company?: string; title?: string; message?: string; source?: Lead["source"];
}) {
  const lead: Lead = {
    id: id(),
    createdAt: now(),
    source: input.source ?? "manual",
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: (input.company ?? "").trim(),
    title: (input.title ?? "").trim(),
    message: (input.message ?? "").trim(),
    status: "new",
    research: null,
    draft: null,
    events: [{ at: now(), type: "created", detail: `Source: ${input.source ?? "manual"}` }],
    tokens: 0,
    costUsd: 0,
  };
  await mutateStore((s) => {
    s.leads.unshift(lead);
  });
  revalidatePath("/inbox");
  return lead;
}

export async function importCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { imported: 0 };
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h === name || h.includes(name));
  let imported = 0;
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const email = cols[idx("email")] ?? "";
    const name = cols[idx("name")] ?? email.split("@")[0] ?? "Unknown";
    if (!email.includes("@")) continue;
    await createLead({
      name,
      email,
      company: cols[idx("company")] ?? "",
      title: cols[idx("title")] ?? cols[idx("role")] ?? "",
      message: cols[idx("message")] ?? cols[idx("note")] ?? "",
      source: "csv",
    });
    imported += 1;
  }
  return { imported };
}

export async function prepareLead(leadId: string) {
  await mutateStore(async (s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "new") {
      assertTransition(lead.status, "researching");
      lead.status = "researching";
      addEvent(lead, "status", "researching");
    }
    const { research, draft, usage } = await runResearchAndDraft(lead, s.playbook);
    lead.research = research;
    lead.draft = draft;
    lead.tokens = (lead.tokens ?? 0) + usage.tokens;
    lead.costUsd = Number(((lead.costUsd ?? 0) + usage.costUsd).toFixed(6));
    assertTransition("researching", "waiting_approval");
    lead.status = "waiting_approval";
    addEvent(
      lead,
      "draft",
      research.disqualified ? "Drafted a polite close" : `Score ${research.score} via ${usage.model}`,
      { tokens: usage.tokens, costUsd: usage.costUsd },
    );
  });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${leadId}`);
  revalidatePath("/activity");
}

export async function saveDraft(leadId: string, subject: string, body: string) {
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    lead.draft = { subject, body, reason: lead.draft?.reason ?? "Edited by human" };
    addEvent(lead, "edit", "Human edited the draft");
  });
  revalidatePath(`/inbox/${leadId}`);
}

export async function approveLead(leadId: string) {
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    assertTransition(lead.status, "approved");
    lead.status = "approved";
    addEvent(lead, "approved", "Human greenlit the send");
  });
  try {
    await enqueueSend(leadId);
  } catch {
    // job record already holds the error
  }
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${leadId}`);
  revalidatePath("/activity");
}

export async function rejectLead(leadId: string, reason: string) {
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    assertTransition(lead.status, "rejected");
    lead.status = "rejected";
    addEvent(lead, "rejected", reason || "Rejected");
  });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${leadId}`);
}

export async function flagHuman(leadId: string, reason: string) {
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    lead.status = "needs_human";
    addEvent(lead, "needs_human", reason || "Flagged");
  });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${leadId}`);
}

export async function seedDemoLeads() {
  const samples = [
    { name: "Maria Kallio", email: "maria@northlane.fi", company: "Northlane", title: "Managing partner", message: "We get 15 form leads a week and they sit until Friday. Can you handle first replies?" },
    { name: "Tom Hughes", email: "tom@brightform.io", company: "Brightform", title: "Head of growth", message: "Looking at tools that draft HubSpot follow-ups. We sell onboarding to mid-market ops teams." },
    { name: "Jonas", email: "jonas@gmail.com", company: "", title: "Student", message: "Do you have internship positions this summer?" },
  ];
  for (const row of samples) await createLead({ ...row, source: "manual" });
}
