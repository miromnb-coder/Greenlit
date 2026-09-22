const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireWebhookSecret(req: Request) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) throw new Error("WEBHOOK_SECRET is not configured");
  const actual = req.headers.get("x-greenlit-secret");
  if (!actual || actual !== expected) throw new Response("Unauthorized", { status: 401 });
}

export function leadInput(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Invalid JSON body");
  const input = body as Record<string, unknown>;
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 320) throw new Error("Valid email required");
  const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
  return {
    name: text(input.name ?? email.split("@")[0], 200),
    email,
    company: text(input.company, 200),
    title: text(input.title, 200),
    message: text(input.message ?? input.note, 10000),
  };
}
