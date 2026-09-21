import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/store";
import { replay, whyStuck } from "@/lib/flow";
import { Status } from "@/components/Status";
import { LeadActions } from "./ui";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { leads } = await readStore();
  const lead = leads.find((l) => l.id === id);
  if (!lead) notFound();
  const why = whyStuck(lead);
  const history = replay(lead);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <div>
        <Link href="/inbox" className="text-sm text-[#6b6b66]">← Inbox</Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{lead.name}</h1>
            <p className="text-[#6b6b66]">
              {lead.email}
              {lead.company ? ` · ${lead.company}` : ""}
              {lead.title ? ` · ${lead.title}` : ""}
              {lead.intent ? ` · ${lead.intent}` : ""}
            </p>
          </div>
          <Status value={lead.status} />
        </div>

        <section className="mt-6 rounded-2xl border border-[#e6e6e2] bg-[#f4f4f2] p-4">
          <p className="label">Why this stopped</p>
          <p>{why.title}</p>
          <p className="mt-1 text-[#6b6b66]">{why.detail}</p>
          <p className="mt-2 text-sm text-[#6b6b66]">{why.next}</p>
        </section>

        {lead.message && (
          <section className="mt-4 rounded-2xl border border-[#e6e6e2] p-4">
            <p className="label">Form note</p>
            <p className="whitespace-pre-wrap">{lead.message}</p>
          </section>
        )}

        {lead.thread?.length > 0 && (
          <section className="mt-4 space-y-3 rounded-2xl border border-[#e6e6e2] p-4">
            <p className="label">Thread</p>
            {lead.thread.map((m) => (
              <div key={m.at + m.direction} className="text-sm">
                <p className="text-[#6b6b66]">{m.direction === "in" ? "Them" : "Us"} · {new Date(m.at).toLocaleString()}</p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </section>
        )}

        {lead.research && (
          <section className="mt-4 rounded-2xl border border-[#e6e6e2] p-4">
            <p className="label">Research</p>
            <p>
              {lead.research.companyGuess} · score {lead.research.score}
              {lead.research.disqualified ? " · disqualified" : ""}
            </p>
            <p className="mt-2 text-[#6b6b66]">{lead.research.likelyNeed}</p>
          </section>
        )}
        <LeadActions lead={lead} />
      </div>
      <aside className="space-y-3 text-sm text-[#6b6b66]">
        <p className="label">Replay</p>
        {history.map((e) => (
          <div key={e.at + e.type} className="border-b border-[#e6e6e2] pb-2">
            <p className="text-[#111]">{e.type} <span className="text-[#6b6b66]">· {e.actor}</span></p>
            <p>{e.detail}</p>
            <p className="text-xs">{new Date(e.at).toLocaleString()}</p>
          </div>
        ))}
      </aside>
    </div>
  );
}
