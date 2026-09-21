"use client";

import Link from "next/link";
import { useState } from "react";
import { Mark } from "./Mark";

const LINKS = [
  ["/inbox", "Inbox"],
  ["/flow", "Flow"],
  ["/playbook", "Playbook"],
  ["/import", "Import"],
  ["/connections", "Connect"],
  ["/activity", "Activity"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-[#1c1c1c] bg-[#070707]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <Mark />
          Greenlit
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[#b5b5ab] md:flex">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-[#d4ff00]">{label}</Link>
          ))}
        </nav>
        <button className="btn btn-ghost px-3 py-1 text-sm md:hidden" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-[#1c1c1c] px-5 py-3 md:hidden">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-xl px-2 py-2 text-[#d8d8ce]" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
