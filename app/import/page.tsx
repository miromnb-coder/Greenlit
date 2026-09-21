import { createLead, importCsv } from "@/lib/actions";
import { redirect } from "next/navigation";

async function addOne(form: FormData) {
  "use server";
  await createLead({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    company: String(form.get("company") ?? ""),
    title: String(form.get("title") ?? ""),
    message: String(form.get("message") ?? ""),
    source: "manual",
  });
  redirect("/inbox");
}

async function addCsv(form: FormData) {
  "use server";
  await importCsv(String(form.get("csv") ?? ""));
  redirect("/inbox");
}

export default function ImportPage() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <p className="lime text-xs uppercase tracking-[0.18em]">Manual</p>
        <h1 className="mt-1 mb-6 text-3xl font-semibold tracking-tight">Add a lead</h1>
        <form action={addOne} className="space-y-3">
          <input className="field" name="name" placeholder="Name" required />
          <input className="field" name="email" type="email" placeholder="Email" required />
          <input className="field" name="company" placeholder="Company" />
          <input className="field" name="title" placeholder="Title" />
          <textarea className="field min-h-28" name="message" placeholder="Form note" />
          <button className="btn btn-primary" type="submit">Add to inbox</button>
        </form>
      </section>
      <section>
        <p className="lime text-xs uppercase tracking-[0.18em]">CSV</p>
        <h2 className="mt-1 mb-6 text-3xl font-semibold tracking-tight">Import</h2>
        <p className="mb-3 text-sm text-[#8a8a80]">Header row required. Columns: name, email, company, title, message.</p>
        <form action={addCsv} className="space-y-3">
          <textarea className="field min-h-48 font-mono text-sm" name="csv" placeholder={"name,email,company,title,message\nAda,ada@firma.fi,Firma,CEO,Need help with inbound"} />
          <button className="btn btn-ghost" type="submit">Import CSV</button>
        </form>
        <p className="mt-6 text-sm text-[#8a8a80]">
          Webhook: <code className="text-[#d4ff00]">POST /api/leads</code> with header <code>x-greenlit-secret</code>
        </p>
      </section>
    </div>
  );
}
