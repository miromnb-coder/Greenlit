import Link from "next/link";

const STEPS = [
  ["01", "Research", "A lead comes in. Greenlit reads the note against the playbook."],
  ["02", "Draft", "A first email is written. Nothing leaves yet."],
  ["03", "Greenlight", "You approve. Then Gmail and the CRM may move."],
];

export default function Home() {
  return (
    <div className="pb-10 pt-10 md:pt-16">
      <h1 className="max-w-2xl text-[2.15rem] font-semibold leading-[1.05] tracking-tight md:text-5xl">
        Nothing reaches a customer until you greenlight it.
      </h1>
      <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#6b6b66]">
        Research, first email, your approval, then send. The model writes. The code owns state. You press the button.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/inbox" className="btn btn-primary">Open inbox</Link>
        <Link href="/flow" className="btn btn-ghost">See flow</Link>
      </div>
      <ol className="mt-14 grid gap-3 md:grid-cols-3">
        {STEPS.map(([n, title, copy]) => (
          <li key={n} className="rounded-2xl border border-[#e6e6e2] bg-[#f4f4f2] p-4">
            <p className="text-xs tracking-[0.16em] text-[#6b6b66]">{n}</p>
            <p className="mt-2 font-medium">{title}</p>
            <p className="mt-1 text-sm text-[#6b6b66]">{copy}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
