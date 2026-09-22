import { addEvent, mutateStore } from "./store";
import { assertTransition } from "./state";
import { sendGmail } from "./gmail";
import { upsertHubspot } from "./hubspot";
import type { Job, Lead } from "./types";

function id() { return crypto.randomUUID(); }
function idempotencyKey(lead: Lead) { return `send:${lead.id}:${lead.draft?.subject ?? ""}:${lead.draft?.body ?? ""}`; }

export async function enqueueSend(leadId: string) {
  return mutateStore((s) => {
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead?.draft) throw new Error("No draft to send");
    const key = idempotencyKey(lead);
    const existing = s.jobs.find((j) => j.idempotencyKey === key && j.type === "send_and_crm");
    if (existing) return existing;
    const job: Job = { id: id(), type: "send_and_crm", leadId, status: "queued", detail: "Queued for send", createdAt: new Date().toISOString(), idempotencyKey: key };
    s.jobs.unshift(job);
    return job;
  });
}

export async function runJob(jobId: string) {
  const snapshot = await mutateStore((s) => {
    const job = s.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    if (job.status === "done") return { jobId, leadId: job.leadId, lead: s.leads.find((l) => l.id === job.leadId), connections: s.connections, alreadyDone: true };
    job.status = "running"; job.detail = "Sending";
    return { jobId, leadId: job.leadId, lead: s.leads.find((l) => l.id === job.leadId), connections: s.connections, alreadyDone: false };
  });
  if (snapshot.alreadyDone) return;
  const lead = snapshot.lead as Lead | undefined;
  try {
    if (!lead?.draft) throw new Error("No draft to send");
    if (!snapshot.connections.gmail) throw new Error("Gmail must be connected before an approved lead can be sent");

    const sent = await sendGmail({ to: lead.email, subject: lead.draft.subject, body: lead.draft.body, threadId: lead.gmailThreadId });

    // Persist the provider send result before touching CRM. A later CRM failure must never resend Gmail.
    await mutateStore((s) => {
      const current = s.leads.find((l) => l.id === snapshot.leadId);
      if (!current) return;
      if (current.status === "approved") { assertTransition("approved", "sent"); current.status = "sent"; }
      current.gmailId = sent.id; current.gmailThreadId = sent.threadId || current.gmailThreadId;
      current.thread.unshift({ at: new Date().toISOString(), direction: "out", body: current.draft?.body ?? "", gmailId: sent.id, threadId: sent.threadId });
      addEvent(current, "sent", `Gmail ${sent.id} from ${sent.from}`);
    });

    let hubspotId = ""; let crmError = "";
    if (snapshot.connections.hubspotToken) {
      try { const hs = await upsertHubspot(snapshot.connections.hubspotToken, lead); hubspotId = hs.contactId; } catch (error) { crmError = error instanceof Error ? error.message : "HubSpot sync failed"; }
    }
    await mutateStore((s) => {
      const job = s.jobs.find((j) => j.id === jobId); const current = s.leads.find((l) => l.id === snapshot.leadId); if (!job || !current) return;
      if (hubspotId) { current.hubspotContactId = hubspotId; addEvent(current, "crm", `HubSpot contact ${hubspotId}`); }
      else if (!s.connections.hubspotToken) addEvent(current, "crm", "HubSpot not connected");
      else if (crmError) addEvent(current, "crm_failed", crmError);
      job.status = "done"; job.detail = crmError ? `Gmail sent; HubSpot sync failed: ${crmError}` : `Gmail sent${hubspotId ? "; HubSpot synced" : ""}`; job.finishedAt = new Date().toISOString();
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    await mutateStore((s) => { const job = s.jobs.find((j) => j.id === jobId); const current = s.leads.find((l) => l.id === snapshot.leadId); if (job) { job.status = "failed"; job.detail = message; job.finishedAt = new Date().toISOString(); } if (current) addEvent(current, "send_failed", message); });
    throw err;
  }
}
