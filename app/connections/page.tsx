import { readStore } from "@/lib/store";
import { disconnectGmail, saveHubspotToken } from "@/lib/actions";
import { googleConfigured } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const q = await searchParams;
  const { connections } = await readStore();
  const ready = googleConfigured();

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <p className="lime text-xs uppercase tracking-[0.18em]">Week 3-4</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-2 text-[#8a8a80]">Mail and CRM leave this machine only after a human greenlights a draft.</p>
      </div>
      {q.ok === "gmail" && <p className="text-[#9dffb0]">Gmail connected.</p>}
      {q.error && <p className="text-[#ff8a8a]">Could not connect ({q.error}). Check GOOGLE_CLIENT_ID and APP_URL.</p>}

      <section className="rounded-2xl border border-[#222] p-5">
        <p className="label">Gmail</p>
        {connections.gmail ? (
          <div className="flex items-center justify-between gap-3">
            <p>Sending as {connections.gmail.email}</p>
            <form action={disconnectGmail}>
              <button className="btn btn-ghost" type="submit">Disconnect</button>
            </form>
          </div>
        ) : ready ? (
          <a className="btn btn-primary" href="/api/google/start">Connect Gmail</a>
        ) : (
          <p className="text-sm text-[#8a8a80]">
            Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and APP_URL to .env.local.
            Redirect URI: <code className="text-[#d4ff00]">{`${process.env.APP_URL || "http://localhost:3000"}/api/google/callback`}</code>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[#222] p-5">
        <p className="label">HubSpot</p>
        <p className="mb-3 text-sm text-[#8a8a80]">Private app token with contacts and notes write access.</p>
        <form action={saveHubspotToken} className="space-y-3">
          <input
            className="field"
            name="hubspotToken"
            type="password"
            placeholder={connections.hubspotToken ? "Token saved — paste to replace" : "pat-..."}
          />
          <button className="btn btn-primary" type="submit">Save token</button>
        </form>
        {connections.hubspotToken && <p className="mt-3 text-sm text-[#9dffb0]">HubSpot token on file.</p>}
      </section>
    </div>
  );
}
