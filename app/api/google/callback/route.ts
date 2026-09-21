import { NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/gmail";
import { mutateStore } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = process.env.APP_URL || url.origin;
  if (!code) return NextResponse.redirect(new URL("/connections?error=missing-code", origin));
  try {
    const gmail = await exchangeGoogleCode(code);
    await mutateStore((s) => {
      s.connections.gmail = gmail;
    });
    return NextResponse.redirect(new URL("/connections?ok=gmail", origin));
  } catch {
    return NextResponse.redirect(new URL("/connections?error=gmail", origin));
  }
}
