"use client";

import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { approveLead, flagHuman, prepareLead, rejectLead, saveDraft } from "@/lib/actions";
import { bookSlot, markOutcome, simulateReply } from "@/lib/replies";

export function LeadActions({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState(lead.draft?.subject ?? "");
  const [body, setBody] = useState(lead.draft?.body ?? "");
  const [reply, setReply] = useState("Thursday 10:00 works. Let us book a call.");

  return (
    <div className="mt-6 space-y-6">
      {["new", "researching"].includes(lead.status) && (
        <button className="btn btn-primary" disabled={pending} onClick={() => start(() => prepareLead(lead.id))}>
          {pending ? "Working…" : "Research + draft"}
        </button>
      )}

      {["sent", "replied", "waiting_approval", "needs_human"].includes(lead.status) && (
        <form className="space-y-2" action={() => start(() => simulateReply(lead.id, reply))}>
          <p className="label">Simulate their reply</p>
          <textarea className="field min-h-24" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn btn-ghost" type="submit" disabled={pending}>Classify + draft follow-up</button>
        </form>
      )}

      {lead.slots?.length > 0 && (
        <div className="space-y-2">
          <p className="label">Times</p>
          {lead.slots.map((slot) => (
            <div key={slot.startsAt} className="flex items-center justify-between gap-3 rounded-xl border border-[#222] px-3 py-2">
              <p>{slot.label} {slot.status === "booked" ? "· booked" : ""}</p>
              {slot.status === "proposed" && (
                <button className="btn btn-primary" type="button" disabled={pending} onClick={() => start(() => bookSlot(lead.id, slot.startsAt))}>
                  Book
                </button>
              )}
            </div>
          ))}
        </div>
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
            {lead.status === "needs_human" && (
              <button className="btn btn-primary" type="button" disabled={pending} onClick={() => start(async () => { await saveDraft(lead.id, subject, body); await approveLead(lead.id); })}>
                Human takes it — send anyway
              </button>
            )}
            <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => start(() => markOutcome(lead.id, "won"))}>Won</button>
            <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => start(() => markOutcome(lead.id, "lost"))}>Lost</button>
          </div>
        </form>
      )}
    </div>
  );
}
