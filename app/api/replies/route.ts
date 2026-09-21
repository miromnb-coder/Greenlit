import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { ingestReply } from "@/lib/replies";

export async function POST(req: Request) {
  const secret = req.headers.get("x-greenlit-secret");
  if (secret !== (process.env.WEBHOOK_SECRET ?? "dev-secret")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.text) {
    return NextResponse.json({ error: "email and text required" }, { status: 400 });
  }
  const { leads } = await readStore();
  const lead = leads.find((l) => l.email === String(body.email).toLowerCase());
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
  await ingestReply(lead.id, String(body.text));
  return NextResponse.json({ ok: true, id: lead.id });
}
