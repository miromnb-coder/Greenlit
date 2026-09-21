import { NextResponse } from "next/server";
import { createLead } from "@/lib/actions";

export async function POST(req: Request) {
  const secret = req.headers.get("x-greenlit-secret");
  if (secret !== (process.env.WEBHOOK_SECRET ?? "dev-secret")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const lead = await createLead({
    name: String(body.name ?? body.email.split("@")[0]),
    email: String(body.email),
    company: String(body.company ?? ""),
    title: String(body.title ?? ""),
    message: String(body.message ?? body.note ?? ""),
    source: "webhook",
  });
  return NextResponse.json({ id: lead.id, status: lead.status });
}

export async function GET() {
  return NextResponse.json({ ok: true, ingest: "POST /api/leads", header: "x-greenlit-secret" });
}
