import type { Lead, LeadStatus } from "./types";

export const PIPELINE: LeadStatus[] = [
  "new",
  "researching",
  "waiting_approval",
  "approved",
  "sent",
  "replied",
  "won",
];

export function whyStuck(lead: Lead): { title: string; detail: string; next: string } {
  const last = lead.events[0];
  switch (lead.status) {
    case "new":
      return { title: "Waiting on research", detail: "Lead is in. Nobody has run research + draft.", next: "Open the lead and press Research + draft." };
    case "researching":
      return { title: "Research interrupted", detail: last?.detail || "Draft did not finish.", next: "Run research again." };
    case "waiting_approval":
      return { title: "Waiting on a human", detail: lead.draft?.reason || "A draft exists. Nothing has been greenlit.", next: "Edit if needed, then Greenlight send." };
    case "approved":
      return { title: "Send did not finish", detail: last?.detail || "Approved, but Gmail/CRM job is still open.", next: "Check /activity and /connections." };
    case "sent":
      return { title: "No reply yet", detail: "Outbound is recorded. Closer is idle until they write back.", next: "Check Gmail or simulate a reply." };
    case "replied":
      return { title: "Reply sitting", detail: lead.intent ? `Intent: ${lead.intent}` : "Reply arrived.", next: "Draft the follow-up and greenlight it." };
    case "needs_human":
      return { title: "Parked for a person", detail: last?.detail || lead.draft?.reason || "Flagged by playbook or tone.", next: "Read the thread, then send or close." };
    case "rejected":
      return { title: "Closed — rejected", detail: last?.detail || "Human rejected the draft.", next: "Nothing. This path ended." };
    case "lost":
      return { title: "Closed — lost", detail: last?.detail || "Marked lost.", next: "Nothing." };
    case "won":
      return { title: "Closed — won", detail: last?.detail || "Marked won.", next: "Nothing." };
    default:
      return { title: lead.status, detail: last?.detail || "", next: "Open the lead." };
  }
}

export function replay(lead: Lead) {
  return [...lead.events].reverse().map((event) => {
    const actor =
      event.type === "approved" || event.type === "edit" || event.type === "rejected" || event.type === "won" || event.type === "lost"
        ? "human"
        : event.type === "created" || event.type === "replied"
          ? "outside"
          : "machine";
    return { ...event, actor };
  });
}

export function companyNodes(leads: Lead[]) {
  const map = new Map<string, { name: string; leads: number; statuses: LeadStatus[] }>();
  for (const lead of leads) {
    const name = lead.company || lead.email.split("@")[1] || "Unknown";
    const row = map.get(name) ?? { name, leads: 0, statuses: [] };
    row.leads += 1;
    row.statuses.push(lead.status);
    map.set(name, row);
  }
  return [...map.values()].sort((a, b) => b.leads - a.leads);
}
