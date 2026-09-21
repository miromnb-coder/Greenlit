"use client";

import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { approveLead, flagHuman, prepareLead, rejectLead, saveDraft } from "@/lib/actions";

export function LeadActions({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState(lead.draft?.subject ?? "");
  const [body, setBody] = useState(lead.draft?.body ?? "");

  return (
    <div className="mt-6 space-y-4">
      {["new", "researching"].includes(lead.status) && (
        <button className="btn btn-primary" disabled={pending} onClick={() => start(() => prepareLead(lead.id))}>
          {pending ? "Working…" : "Research + draft"}
        </button>
      )}
      {lead.draft && (
        <form className="space-y-3" action={() => start(async () => { await saveDraft(lead.id, subject, body); })}>
          <p className="label">Draft</p>
          {lead.draft.reason && <p className="text-sm text-[#8a8a80]">{lead.draft.reason}</p>}
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="field min-h-56" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="submit" disabled={pending}>Save edits</button>
            {lead.status === "waiting_approval" && (
              <>
                <button className="btn btn-primary" type="button" disabled={pending} onClick={() => start(async () => { await saveDraft(lead.id, subject, body); await approveLead(lead.id); })}>Greenlight send</button>
                <button className="btn btn-danger" type="button" disabled={pending} onClick={() => start(() => rejectLead(lead.id, "Rejected from inbox"))}>Reject</button>
                <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => start(() => flagHuman(lead.id, "Needs a person"))}>Needs human</button>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
