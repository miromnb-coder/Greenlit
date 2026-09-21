"use client";

import Link from "next/link";
import { useState } from "react";

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
    <header className="sticky top-0 z-20 border-b border-[#e6e6e2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center" aria-label="Greenlit home">
          <img src="/IMG_5126.PNG" alt="Greenlit" className="h-8 w-auto md:h-9" />
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[#444] md:flex">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-black">{label}</Link>
          ))}
        </nav>
        <button className="btn btn-ghost px-3 py-1 text-sm md:hidden" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-[#e6e6e2] px-5 py-3 md:hidden">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-xl px-2 py-2" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
