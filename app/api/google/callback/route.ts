import { NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/gmail";
import { getAuthContext } from "@/lib/auth";
import { mutateStore } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = process.env.APP_URL || url.origin;
  const cookieState = req.headers.get("cookie")?.match(/(?:^|;\s*)greenlit_google_oauth_state=([^;]+)/)?.[1];
  const clear = (response: NextResponse) => { response.cookies.set("greenlit_google_oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); return response; };
  if (!code || !state || !cookieState || state !== cookieState) return clear(NextResponse.redirect(new URL("/connections?error=oauth-state", origin)));
  try {
    await getAuthContext();
    const gmail = await exchangeGoogleCode(code);
    await mutateStore((s) => { s.connections.gmail = gmail; });
    return clear(NextResponse.redirect(new URL("/connections?ok=gmail", origin)));
  } catch {
    return clear(NextResponse.redirect(new URL("/connections?error=gmail", origin)));
  }
}
