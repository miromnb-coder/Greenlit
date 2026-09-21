import Link from "next/link";
import { readStore } from "@/lib/store";
import { PIPELINE, companyNodes, whyStuck } from "@/lib/flow";
import { Status } from "@/components/Status";

export const dynamic = "force-dynamic";

export default async function FlowPage() {
  const { leads, jobs } = await readStore();
  const open = leads.filter((l) => !["won", "lost", "rejected"].includes(l.status));
  const stuck = open.map((lead) => ({ lead, why: whyStuck(lead) }));
  const firms = companyNodes(leads);
  const cost = leads.reduce((n, l) => n + (l.costUsd ?? 0), 0);
  const sent = leads.filter((l) => ["sent", "replied", "won"].includes(l.status)).length;
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <div className="space-y-10">
      <div>
        <p className="lime text-xs uppercase tracking-[0.18em]">Weeks 7–8</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Flow</h1>
        <p className="mt-2 text-[#8a8a80]">Why a lead stopped, and what already happened. No new channels.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Open", String(open.length)],
          ["Sent", String(sent)],
          ["Won", String(won)],
          ["Model $", `$${cost.toFixed(4)}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#222] p-4">
            <p className="label">{label}</p>
            <p className="text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <p className="label mb-3">Pipeline</p>
        <div className="flex flex-wrap gap-2">
          {PIPELINE.map((step) => {
            const n = leads.filter((l) => l.status === step).length;
            return (
              <Link key={step} href={`/inbox?status=${step}`} className="rounded-2xl border border-[#222] px-3 py-2 text-sm">
                <span className="text-[#8a8a80]">{step.replaceAll("_", " ")}</span>
                <span className="ml-2 text-[#d4ff00]">{n}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <p className="label mb-3">Stuck</p>
        {stuck.length === 0 ? (
          <p className="text-[#8a8a80]">Nothing open. Import a lead.</p>
        ) : (
          <ul className="divide-y divide-[#1c1c1c] rounded-2xl border border-[#1c1c1c]">
            {stuck.map(({ lead, why }) => (
              <li key={lead.id}>
                <Link href={`/inbox/${lead.id}`} className="block px-4 py-4 hover:bg-[#0e0e0e]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{lead.name} <span className="text-[#7a7a72]">{lead.company}</span></p>
                    <Status value={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#d4ff00]">{why.title}</p>
                  <p className="text-sm text-[#8a8a80]">{why.detail} {why.next}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="label mb-3">Companies</p>
        {firms.length === 0 ? (
          <p className="text-[#8a8a80]">No firms yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {firms.map((firm) => (
              <li key={firm.name} className="rounded-2xl border border-[#222] px-4 py-3">
                <p>{firm.name}</p>
                <p className="text-sm text-[#8a8a80]">{firm.leads} lead{firm.leads === 1 ? "" : "s"} · {firm.statuses.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-[#8a8a80]">{jobs.filter((j) => j.status === "failed").length} failed jobs on <Link href="/activity" className="text-[#d4ff00]">Activity</Link>.</p>
    </div>
  );
}
