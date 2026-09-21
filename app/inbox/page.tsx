import Link from "next/link";
import { readStore } from "@/lib/store";
import { seedDemoLeads } from "@/lib/actions";
import { Status } from "@/components/Status";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { leads } = await readStore();
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="lime text-xs uppercase tracking-[0.18em]">Queue</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Inbox</h1>
        </div>
        <form action={seedDemoLeads}>
          <button className="btn btn-ghost" type="submit">Load demo leads</button>
        </form>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-[#222] p-8 text-[#8a8a80]">
          No leads yet. Import a CSV, POST the webhook, or load demo leads.
        </div>
      ) : (
        <ul className="divide-y divide-[#1c1c1c] rounded-2xl border border-[#1c1c1c]">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link href={`/inbox/${lead.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-[#0e0e0e]">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {lead.name}{" "}
                    <span className="text-[#7a7a72]">{lead.company && `· ${lead.company}`}</span>
                  </p>
                  <p className="truncate text-sm text-[#8a8a80]">{lead.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {lead.research && <span className="text-xs text-[#8a8a80]">{lead.research.score}</span>}
                  <Status value={lead.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
