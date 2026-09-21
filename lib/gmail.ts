import { mutateStore } from "./store";
import type { GmailConnection } from "./types";

function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${appUrl()}/api/google/callback`,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...body,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.access_token) throw new Error(data.error || "Google token failed");
  return data;
}

export async function exchangeGoogleCode(code: string): Promise<GmailConnection> {
  const data = await tokenRequest({
    code,
    grant_type: "authorization_code",
    redirect_uri: `${appUrl()}/api/google/callback`,
  });
  const profile = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { authorization: `Bearer ${data.access_token}` },
  });
  const user = (await profile.json()) as { email?: string };
  return {
    email: user.email || "gmail",
    accessToken: data.access_token!,
    refreshToken: data.refresh_token || "",
    expiry: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function accessToken(): Promise<{ token: string; email: string }> {
  const store = await mutateStore(async (s) => s.connections.gmail);
  if (!store) throw new Error("Gmail is not connected");
  if (Date.now() < store.expiry - 30_000) {
    return { token: store.accessToken, email: store.email };
  }
  if (!store.refreshToken) throw new Error("Gmail needs reconnecting");
  const data = await tokenRequest({
    refresh_token: store.refreshToken,
    grant_type: "refresh_token",
  });
  await mutateStore((s) => {
    if (!s.connections.gmail) return;
    s.connections.gmail.accessToken = data.access_token!;
    s.connections.gmail.expiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  });
  return { token: data.access_token!, email: store.email };
}

function rawMessage(from: string, to: string, subject: string, body: string) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

export async function sendGmail(input: { to: string; subject: string; body: string }) {
  const { token, email } = await accessToken();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage(email, input.to, input.subject, input.body) }),
  });
  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) throw new Error(data.error?.message || "Gmail send failed");
  return { id: data.id, from: email };
}
