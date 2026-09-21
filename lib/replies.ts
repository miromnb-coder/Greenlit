"use server";

import { revalidatePath } from "next/cache";
import { addEvent, mutateStore, readStore } from "./store";
import { assertTransition } from "./state";
import { classifyReply, draftAfterReply } from "./closer";
import { fetchRepliesFrom } from "./gmail";
import { bookGoogleEvent } from "./calendar";
import type { Lead } from "./types";

function refresh() {
  revalidatePath("/inbox");
  revalidatePath("/activity");
}

export async function ingestReply(leadId: string, text: string, gmailId?: string) {
  const incoming = text.trim();
  if (!incoming) return;
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    lead.thread = lead.thread ?? [];
    if (gmailId && lead.thread.some((m) => m.gmailId === gmailId)) return;
    lead.thread.push({ at: new Date().toISOString(), direction: "in", body: incoming, gmailId });
    if (lead.status === "sent" || lead.status === "approved") {
      assertTransition(lead.status === "approved" ? "sent" : lead.status, "replied");
      if (lead.status === "sent") lead.status = "replied";
    } else if (lead.status === "sent") {
      lead.status = "replied";
    } else if (["sent", "approved"].includes(lead.status)) {
      lead.status = "replied";
    } else if (lead.status === "sent") {
      lead.status = "replied";
    }
    if (lead.status === "sent") lead.status = "replied";
    addEvent(lead, "replied", incoming.slice(0, 180));
    const intent = classifyReply(incoming);
    lead.intent = intent;
    const next = draftAfterReply(lead, s.playbook, intent, incoming);
    lead.draft = next.draft;
    lead.slots = next.slots;
    if (next.needsHuman) {
      lead.status = "needs_human";
      addEvent(lead, "needs_human", next.draft.reason);
    } else {
      lead.status = "waiting_approval";
      addEvent(lead, "draft", `Follow-up (${intent})`);
    }
  });
  refresh();
  revalidatePath(`/inbox/${leadId}`);
}

export async function simulateReply(leadId: string, text: string) {
  await ingestReply(leadId, text);
}

export async function pollGmailReplies() {
  const { leads, connections } = await readStore();
  if (!connections.gmail) throw new Error("Connect Gmail first");
  let found = 0;
  for (const lead of leads.filter((l) => ["sent", "replied", "waiting_approval"].includes(l.status))) {
    const messages = await fetchRepliesFrom(lead.email);
    for (const msg of messages) {
      const known = (lead.thread ?? []).some((m) => m.gmailId === msg.id);
      if (known || !msg.body) continue;
      await ingestReply(lead.id, msg.body, msg.id);
      found += 1;
    }
  }
  refresh();
  return { found };
}

export async function bookSlot(leadId: string, startsAt: string) {
  const store = await readStore();
  const lead = store.leads.find((l) => l.id === leadId);
  if (!lead) throw new Error("Lead not found");
  const slot = (lead.slots ?? []).find((s) => s.startsAt === startsAt);
  if (!slot) throw new Error("Slot not found");
  let hangout = "";
  try {
    const ev = await bookGoogleEvent({
      title: `${store.playbook.companyName} / ${lead.company || lead.name}`,
      description: lead.draft?.body || store.playbook.offer,
      attendee: lead.email,
      slot,
    });
    hangout = ev.hangoutLink;
  } catch {
    hangout = store.playbook.calendarLink || "";
  }
  await mutateStore((s) => {
    const current = s.leads.find((l) => l.id === leadId);
    if (!current) return;
    current.slots = (current.slots ?? []).map((x) =>
      x.startsAt === startsAt ? { ...x, status: "booked", hangoutLink: hangout || x.hangoutLink } : x,
    );
    addEvent(current, "booked", hangout ? `Meeting booked ${slot.label} ${hangout}` : `Marked booked ${slot.label} (add Google Calendar scope)`);
  });
  refresh();
  revalidatePath(`/inbox/${leadId}`);
}

export async function markOutcome(leadId: string, status: "won" | "lost") {
  await mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");
    lead.status = status;
    addEvent(lead, status, status === "won" ? "Closed won" : "Closed lost");
  });
  refresh();
  revalidatePath(`/inbox/${leadId}`);
}
