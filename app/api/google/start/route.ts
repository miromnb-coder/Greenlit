import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/gmail";
import { getAuthContext } from "@/lib/auth";

export async function GET(req: Request) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/connections?error=google-env", process.env.APP_URL || "http://localhost:3000"));
  try {
    await getAuthContext();
    const state = crypto.randomUUID();
    const response = NextResponse.redirect(googleAuthUrl(state));
    response.cookies.set("greenlit_google_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  } catch {
    const origin = process.env.APP_URL || new URL(req.url).origin;
    return NextResponse.redirect(new URL("/signin?error=auth", origin));
  }
}
