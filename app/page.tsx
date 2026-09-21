import Link from "next/link";
import { Mark } from "@/components/Mark";

const STEPS = [
  ["01", "Research", "A lead comes in. Greenlit reads the note against the playbook."],
  ["02", "Draft", "A first email is written. Nothing leaves yet."],
  ["03", "Greenlight", "You approve. Then Gmail and the CRM may move."],
];

export default function Home() {
  return (
    <div className="pb-10 pt-8 md:pt-16">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#2a2a2a] bg-[#101010]">
          <Mark size={26} />
        </span>
        <p className="text-sm text-[#8a8a80]">Inbound lead engine</p>
      </div>
      <h1 className="max-w-2xl text-[2.15rem] font-semibold leading-[1.05] tracking-tight md:text-5xl">
        Nothing reaches a customer until you greenlight it.
      </h1>
      <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#9a9a90]">
        Research, first email, your approval, then send. The model writes. The code owns state. You press the button.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/inbox" className="btn btn-primary">Open inbox</Link>
        <Link href="/flow" className="btn btn-ghost">See flow</Link>
      </div>
      <ol className="mt-14 grid gap-3 md:grid-cols-3">
        {STEPS.map(([n, title, copy]) => (
          <li key={n} className="rounded-2xl border border-[#222] bg-[#101010] p-4">
            <p className="text-xs tracking-[0.16em] text-[#d4ff00]">{n}</p>
            <p className="mt-2 font-medium">{title}</p>
            <p className="mt-1 text-sm text-[#8a8a80]">{copy}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
