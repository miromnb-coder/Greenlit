import type { LeadStatus } from "@/lib/types";

const TONE: Record<string, string> = {
  new: "text-[#111] border-[#111]",
  researching: "text-[#111] border-[#cfcfc8]",
  researched: "text-[#111] border-[#cfcfc8]",
  drafted: "text-[#111] border-[#cfcfc8]",
  waiting_approval: "text-[#111] border-[#111]",
  approved: "text-[#111] border-[#111]",
  sent: "text-[#444] border-[#cfcfc8]",
  replied: "text-[#111] border-[#111]",
  needs_human: "text-[#7a5a28] border-[#e2d2b0]",
  rejected: "text-[#9a3b3b] border-[#e4c8c8]",
  won: "text-[#111] border-[#111]",
  lost: "text-[#6b6b66] border-[#e6e6e2]",
};

export function Status({ value }: { value: LeadStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${TONE[value] ?? ""}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
