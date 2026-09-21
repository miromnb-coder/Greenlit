import type { LeadStatus } from "@/lib/types";

const TONE: Record<string, string> = {
  new: "text-[#d4ff00] border-[#3a4a00]",
  researching: "text-[#d4ff00] border-[#3a4a00]",
  researched: "text-[#d4ff00] border-[#3a4a00]",
  drafted: "text-[#d4ff00] border-[#3a4a00]",
  waiting_approval: "text-[#d4ff00] border-[#d4ff00]",
  approved: "text-[#9dffb0] border-[#245534]",
  sent: "text-[#9dffb0] border-[#245534]",
  replied: "text-[#9dffb0] border-[#245534]",
  needs_human: "text-[#ffd36a] border-[#5a4a20]",
  rejected: "text-[#ff8a8a] border-[#5a2a2a]",
  won: "text-[#9dffb0] border-[#245534]",
  lost: "text-[#8a8a80] border-[#333]",
};

export function Status({ value }: { value: LeadStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${TONE[value] ?? ""}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
