import { readStore } from "@/lib/store";
import { savePlaybook } from "@/lib/actions";

export const dynamic = "force-dynamic";

const FIELDS: { key: string; label: string; area?: boolean }[] = [
  { key: "companyName", label: "Company" },
  { key: "offer", label: "One-sentence offer", area: true },
  { key: "notSelling", label: "What we do not sell" },
  { key: "icpFirm", label: "ICP firm type" },
  { key: "icpSize", label: "ICP size" },
  { key: "icpRole", label: "Role we email" },
  { key: "disqualify", label: "Disqualify if" },
  { key: "tone", label: "Tone" },
  { key: "exampleSentences", label: "Example sentences", area: true },
  { key: "priceRange", label: "Price range" },
  { key: "forbiddenClaims", label: "Forbidden claims", area: true },
  { key: "firstEmailGoal", label: "Goal of first email" },
  { key: "qualifyingQuestions", label: "Qualifying questions", area: true },
  { key: "meetingRule", label: "When to offer a meeting" },
  { key: "calendarLink", label: "Calendar link" },
  { key: "flagHumanWhen", label: "Flag a human when" },
  { key: "senderName", label: "Sender name" },
  { key: "senderTitle", label: "Sender title" },
  { key: "companyUrl", label: "Company URL" },
];

export default async function PlaybookPage() {
  const { playbook } = await readStore();
  return (
    <div className="max-w-2xl">
      <p className="lime text-xs uppercase tracking-[0.18em]">Rules</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Playbook</h1>
      <p className="mt-2 mb-8 text-[#8a8a80]">Empty fields are how prices get invented. Fill this before trusting a draft.</p>
      <form action={savePlaybook} className="space-y-4">
        <div>
          <label className="label">Language</label>
          <select name="language" defaultValue={playbook.language} className="field">
            <option value="en">English</option>
            <option value="fi">Finnish</option>
          </select>
        </div>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            {f.area ? (
              <textarea name={f.key} className="field min-h-24" defaultValue={(playbook as Record<string, string>)[f.key] ?? ""} />
            ) : (
              <input name={f.key} className="field" defaultValue={(playbook as Record<string, string>)[f.key] ?? ""} />
            )}
          </div>
        ))}
        <button className="btn btn-primary" type="submit">Save playbook</button>
      </form>
    </div>
  );
}
