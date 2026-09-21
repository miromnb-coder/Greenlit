"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const LINKS = [
  ["/inbox", "Inbox"],
  ["/flow", "Flow"],
  ["/playbook", "Playbook"],
  ["/import", "Import"],
  ["/connections", "Connect"],
  ["/activity", "Activity"],
] as const;

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (path === "/signin" || path === "/signup") return null;

  async function signOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      await createBrowserSupabase().auth.signOut();
    }
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#e6e6e2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center" aria-label="Greenlit home">
          <img src="/IMG_5126.png" alt="Greenlit" className="h-12 w-auto max-w-[70vw] object-contain object-left md:h-14" />
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[#444] md:flex">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-black">{label}</Link>
          ))}
          <Link href="/signin" className="hover:text-black">Account</Link>
          <button type="button" onClick={signOut} className="hover:text-black">Sign out</button>
        </nav>
        <button className="btn btn-ghost shrink-0 px-3 py-1 text-sm md:hidden" type="button" onClick={() => setOpen((v) => !v)}>
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
          <Link href="/signin" className="rounded-xl px-2 py-2" onClick={() => setOpen(false)}>Account</Link>
          <button type="button" className="rounded-xl px-2 py-2 text-left" onClick={signOut}>Sign out</button>
        </nav>
      )}
    </header>
  );
}
