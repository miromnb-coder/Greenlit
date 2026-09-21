import Link from "next/link";

export default function Home() {
  return (
    <div className="py-16">
      <p className="lime mb-4 text-xs uppercase tracking-[0.2em]">Week 1 · lead engine</p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Nothing reaches a customer until you greenlight it.
      </h1>
      <p className="mt-5 max-w-xl text-[#9a9a90]">
        A new lead is researched and drafted. You approve the email. Then it can leave
        the building. This build is the inbox, the playbook, and the ingest lane.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/inbox" className="btn btn-primary">Open inbox</Link>
        <Link href="/playbook" className="btn btn-ghost">Edit playbook</Link>
      </div>
    </div>
  );
}
