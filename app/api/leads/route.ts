import { NextResponse } from "next/server";
import { createLead } from "@/lib/actions";
import { leadInput, requireWebhookSecret } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    requireWebhookSecret(req);
    const input = leadInput(await req.json());
    const lead = await createLead({ ...input, source: "webhook" });
    return NextResponse.json({ id: lead.id, status: lead.status });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, ingest: "POST /api/leads", header: "x-greenlit-secret" });
}
