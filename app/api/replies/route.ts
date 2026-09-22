import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { ingestReply } from "@/lib/replies";
import { requireWebhookSecret } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    requireWebhookSecret(req);
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const text = String(body?.text ?? "").trim().slice(0, 20000);
    if (!email || !email.includes("@") || !text) return NextResponse.json({ error: "email and text required" }, { status: 400 });
    const { leads } = await readStore();
    const lead = leads.find((l) => l.email === email);
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    await ingestReply(lead.id, text);
    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
