import type { LeadStatus } from "./types";

export const ALLOWED: Record<LeadStatus, LeadStatus[]> = {
  new: ["researching", "needs_human", "rejected"],
  researching: ["researched", "waiting_approval", "needs_human"],
  researched: ["drafted", "needs_human", "rejected"],
  drafted: ["waiting_approval"],
  waiting_approval: ["approved", "rejected", "drafted", "needs_human"],
  approved: ["sent"],
  sent: ["replied", "lost", "needs_human"],
  replied: ["won", "lost", "needs_human", "waiting_approval"],
  needs_human: ["researching", "drafted", "waiting_approval", "approved", "rejected", "lost", "won"],
  rejected: [],
  won: [],
  lost: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus) {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: LeadStatus, to: LeadStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal transition ${from} → ${to}`);
  }
}
