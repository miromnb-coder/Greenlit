import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-[#1c1c1c]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d4ff00]" />
          Greenlit
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-[#b5b5ab]">
          <Link href="/inbox">Inbox</Link>
          <Link href="/flow">Flow</Link>
          <Link href="/playbook">Playbook</Link>
          <Link href="/import">Import</Link>
          <Link href="/connections">Connect</Link>
          <Link href="/activity">Activity</Link>
        </nav>
      </div>
    </header>
  );
}
