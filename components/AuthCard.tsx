"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13.2 24 13.2c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.4 7.4l6.1 5.2C37.3 38.4 44 33.5 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function AuthCard({ mode }: { mode: "signup" | "signin" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/inbox";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(mode === "signin");
  const [error, setError] = useState(params.get("error") ? "Could not complete sign in." : "");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const signup = mode === "signup";

  async function emailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }
    setPending(true);
    const supabase = createBrowserSupabase();
    const result = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (signup && result.data.session === null) {
      setNotice("Check your email to confirm the account, then sign in.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function google() {
    setError("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Google sign-in needs Supabase Auth keys first.");
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) setError(err.message);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-1">
      <Link href="/" className="mb-8 flex justify-center">
        <img src="/IMG_5126.png" alt="Greenlit" className="h-10 w-auto" />
      </Link>
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        {signup ? "Create an account" : "Sign in"}
      </h1>

      <button type="button" onClick={google} className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-[#d7d7d2] bg-white py-3 text-sm font-medium">
        <GoogleMark />
        {signup ? "Sign up with Google" : "Continue with Google"}
      </button>
      {signup && (
        <p className="mt-3 text-center text-xs leading-relaxed text-[#6b6b66]">
          By clicking “Sign up with Google” I agree to the Terms of Service and Privacy Policy.
        </p>
      )}

      <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-wide text-[#b0b0aa]">
        <span className="h-px flex-1 bg-[#e6e6e2]" />
        or
        <span className="h-px flex-1 bg-[#e6e6e2]" />
      </div>

      <form onSubmit={emailAuth} className="space-y-4">
        <label className="block">
          <span className="label">Email</span>
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input className="field" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} />
        </label>
        {signup && (
          <label className="flex items-start gap-2 text-sm text-[#444]">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
        )}
        {error && <p className="text-sm text-[#9a3b3b]">{error}</p>}
        {notice && <p className="text-sm text-[#444]">{notice}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={pending || !agreed}>
          {pending ? "Please wait" : signup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6b6b66]">
        {signup ? (
          <>
            Already registered? <Link href="/signin" className="underline">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup" className="underline">Create an account</Link>
          </>
        )}
      </p>
    </div>
  );
}
