import { addEvent, mutateStore } from "./store";
import { assertTransition } from "./state";
import { sendGmail } from "./gmail";
import { upsertHubspot } from "./hubspot";
import type { Job, Lead } from "./types";

function id() {
  return crypto.randomUUID();
}

export async function enqueueSend(leadId: string) {
  const job: Job = {
    id: id(),
    type: "send_and_crm",
    leadId,
    status: "queued",
    detail: "Waiting to send",
    createdAt: new Date().toISOString(),
  };
  await mutateStore((s) => {
    s.jobs.unshift(job);
  });
  return runJob(job.id);
}

export async function runJob(jobId: string) {
  const snapshot = await mutateStore((s) => {
    const job = s.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    job.status = "running";
    job.detail = "Sending";
    const lead = s.leads.find((l) => l.id === job.leadId);
    return { jobId, leadId: job.leadId, lead, connections: s.connections };
  });

  const lead = snapshot.lead as Lead | undefined;
  try {
    if (!lead?.draft) throw new Error("No draft to send");

    let gmailId = "";
    let sentHow = "local mark only — connect Gmail on /connections";
    if (snapshot.connections.gmail) {
      const sent = await sendGmail({
        to: lead.email,
        subject: lead.draft.subject,
        body: lead.draft.body,
      });
      gmailId = sent.id;
      sentHow = `Gmail ${sent.id} from ${sent.from}`;
    }

    let hubspotId = "";
    if (snapshot.connections.hubspotToken) {
      const hs = await upsertHubspot(snapshot.connections.hubspotToken, lead);
      hubspotId = hs.contactId;
    }

    await mutateStore((s) => {
      const job = s.jobs.find((j) => j.id === jobId);
      const current = s.leads.find((l) => l.id === snapshot.leadId);
      if (!job || !current) return;
      if (current.status === "approved") {
        assertTransition("approved", "sent");
        current.status = "sent";
      }
      if (gmailId) current.gmailId = gmailId;
      if (hubspotId) current.hubspotContactId = hubspotId;
      addEvent(current, "sent", sentHow);
      if (hubspotId) addEvent(current, "crm", `HubSpot contact ${hubspotId}`);
      else if (!s.connections.hubspotToken) addEvent(current, "crm", "HubSpot not connected");
      job.status = "done";
      job.detail = sentHow;
      job.finishedAt = new Date().toISOString();
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    await mutateStore((s) => {
      const job = s.jobs.find((j) => j.id === jobId);
      const current = s.leads.find((l) => l.id === snapshot.leadId);
      if (job) {
        job.status = "failed";
        job.detail = message;
        job.finishedAt = new Date().toISOString();
      }
      if (current) addEvent(current, "send_failed", message);
    });
    throw err;
  }
}
