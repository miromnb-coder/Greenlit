"use client";

import { useActionState } from "react";
import { importCsv } from "@/lib/actions";

type ImportState = { imported: number; errors: { row: number; message: string }[] } | null;

async function submitCsv(_: ImportState, form: FormData): Promise<ImportState> {
  return importCsv(String(form.get("csv") ?? ""));
}

export function CsvImportForm() {
  const [result, action, pending] = useActionState(submitCsv, null);

  return (
    <form action={action} className="space-y-3">
      <textarea className="field min-h-48 font-mono text-sm" name="csv" placeholder={'name,email,company,title,message\nAda,ada@firma.fi,Firma,CEO,"Need help with inbound, urgently"'} required />
      <button className="btn btn-ghost" type="submit" disabled={pending}>{pending ? "Checking import…" : "Validate and import CSV"}</button>
      {result && (
        <div className="rounded-xl border border-[#d7d7d2] p-4 text-sm" role="status">
          <p className="font-medium">Imported {result.imported} {result.imported === 1 ? "lead" : "leads"}.</p>
          {result.errors.length > 0 && (
            <div className="mt-3" role="alert">
              <p className="font-medium text-[#9a3b3b]">{result.errors.length} rows were not imported.</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[#6b6b66]">
                {result.errors.slice(0, 20).map((error) => <li key={`${error.row}-${error.message}`}>Row {error.row || "file"}: {error.message}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
