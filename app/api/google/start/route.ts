import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/gmail";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/connections?error=google-env", process.env.APP_URL || "http://localhost:3000"));
  }
  return NextResponse.redirect(googleAuthUrl());
}
