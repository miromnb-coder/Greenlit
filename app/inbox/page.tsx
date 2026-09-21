import Link from "next/link";
import { readStore } from "@/lib/store";
import { seedDemoLeads } from "@/lib/actions";
import { pollGmailReplies } from "@/lib/replies";
import { Status } from "@/components/Status";
import type { LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "waiting_approval", label: "Approve" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
  { key: "needs_human", label: "Needs human" },
];

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { leads } = await readStore();
  const visible = status && status !== "all" ? leads.filter((l) => l.status === (status as LeadStatus)) : leads;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lime text-xs uppercase tracking-[0.18em]">Queue</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Inbox</h1>
        </div>
        <div className="flex gap-2">
          <form action={pollGmailReplies}>
            <button className="btn btn-ghost" type="submit">Check Gmail</button>
          </form>
          <form action={seedDemoLeads}>
            <button className="btn btn-ghost" type="submit">Load demo leads</button>
          </form>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/inbox" : `/inbox?status=${f.key}`}
            className={`rounded-full border px-3 py-1 ${status === f.key || (!status && f.key === "all") ? "border-[#d4ff00] text-[#d4ff00]" : "border-[#333] text-[#8a8a80]"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-[#222] p-8 text-[#8a8a80]">Nothing in this queue.</div>
      ) : (
        <ul className="divide-y divide-[#1c1c1c] rounded-2xl border border-[#1c1c1c]">
          {visible.map((lead) => (
            <li key={lead.id}>
              <Link href={`/inbox/${lead.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-[#0e0e0e]">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {lead.name} <span className="text-[#7a7a72]">{lead.company && `· ${lead.company}`}</span>
                  </p>
                  <p className="truncate text-sm text-[#8a8a80]">
                    {lead.email}{lead.intent ? ` · ${lead.intent}` : ""}
                  </p>
                </div>
                <Status value={lead.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
