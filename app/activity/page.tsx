import Link from "next/link";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { leads, jobs } = await readStore();
  const tokens = leads.reduce((n, l) => n + (l.tokens ?? 0), 0);
  const cost = leads.reduce((n, l) => n + (l.costUsd ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="lime text-xs uppercase tracking-[0.18em]">Audit</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Activity</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#222] p-4">
          <p className="label">Leads</p>
          <p className="text-2xl">{leads.length}</p>
        </div>
        <div className="rounded-2xl border border-[#222] p-4">
          <p className="label">Tokens</p>
          <p className="text-2xl">{tokens}</p>
        </div>
        <div className="rounded-2xl border border-[#222] p-4">
          <p className="label">Model cost</p>
          <p className="text-2xl">${cost.toFixed(4)}</p>
        </div>
      </div>
      <section>
        <p className="label mb-3">Jobs</p>
        {jobs.length === 0 ? (
          <p className="text-[#8a8a80]">No send jobs yet. Approve a draft.</p>
        ) : (
          <ul className="divide-y divide-[#1c1c1c] rounded-2xl border border-[#1c1c1c]">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="text-[#f4f4f0]">{job.type} · {job.status}</p>
                  <p className="text-[#8a8a80]">{job.detail}</p>
                </div>
                <Link className="text-[#d4ff00]" href={`/inbox/${job.leadId}`}>Lead</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
