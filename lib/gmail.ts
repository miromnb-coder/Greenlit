import { mutateStore, readStore } from "./store";
import type { GmailConnection } from "./types";

function appUrl() { return process.env.APP_URL || "http://localhost:3000"; }
export function googleConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); }

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${appUrl()}/api/google/callback`, response_type: "code", access_type: "offline", prompt: "consent", state,
    scope: ["https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/calendar.events","https://www.googleapis.com/auth/userinfo.email"].join(" "),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", ...body }) });
  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || "Google token failed");
  return data;
}

export async function exchangeGoogleCode(code: string): Promise<GmailConnection> {
  const data = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: `${appUrl()}/api/google/callback` });
  const profile = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { authorization: `Bearer ${data.access_token}` } });
  const user = (await profile.json()) as { email?: string };
  return { email: user.email || "gmail", accessToken: data.access_token!, refreshToken: data.refresh_token || "", expiry: Date.now() + (data.expires_in ?? 3600) * 1000 };
}

export async function googleAccess(): Promise<{ token: string; email: string }> {
  const current = (await readStore()).connections.gmail;
  if (!current) throw new Error("Gmail is not connected");
  if (Date.now() < current.expiry - 30_000) return { token: current.accessToken, email: current.email };
  if (!current.refreshToken) throw new Error("Gmail needs reconnecting");
  const data = await tokenRequest({ refresh_token: current.refreshToken, grant_type: "refresh_token" });
  await mutateStore((s) => { if (s.connections.gmail) { s.connections.gmail.accessToken = data.access_token!; s.connections.gmail.expiry = Date.now() + (data.expires_in ?? 3600) * 1000; } });
  return { token: data.access_token!, email: current.email };
}

function rawMessage(from: string, to: string, subject: string, body: string) {
  return Buffer.from([`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", body].join("\r\n")).toString("base64url");
}

export async function sendGmail(input: { to: string; subject: string; body: string; threadId?: string }) {
  const { token, email } = await googleAccess();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ raw: rawMessage(email, input.to, input.subject, input.body), ...(input.threadId ? { threadId: input.threadId } : {}) }) });
  const data = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } };
  if (!res.ok || !data.id) throw new Error(data.error?.message || "Gmail send failed");
  return { id: data.id, threadId: data.threadId || input.threadId || "", from: email };
}

function decodePart(part: { body?: { data?: string } }): string {
  if (!part.body?.data) return "";
  return Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export async function fetchRepliesFrom(email: string, threadId?: string) {
  const { token } = await googleAccess();
  const q = encodeURIComponent(threadId ? `threadId:${threadId}` : `from:${email} newer_than:14d`);
  const list = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${q}`, { headers: { authorization: `Bearer ${token}` } });
  const data = (await list.json()) as { messages?: { id: string; threadId?: string }[] };
  if (!list.ok) throw new Error("Gmail list failed");
  const out: { id: string; threadId: string; body: string }[] = [];
  for (const row of data.messages ?? []) {
    const msg = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${row.id}?format=full`, { headers: { authorization: `Bearer ${token}` } });
    const full = (await msg.json()) as { id: string; threadId?: string; snippet?: string; payload?: { body?: { data?: string }; parts?: { mimeType?: string; body?: { data?: string } }[] } };
    const textPart = full.payload?.parts?.find((p) => p.mimeType === "text/plain") ?? full.payload;
    const body = textPart ? decodePart(textPart) : full.snippet || "";
    out.push({ id: full.id, threadId: full.threadId || row.threadId || "", body: body.trim() || full.snippet || "" });
  }
  return out;
}
