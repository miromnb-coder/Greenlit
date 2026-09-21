export const LEAD_STATUSES = [
  "new","researching","researched","drafted","waiting_approval","approved","sent","replied","needs_human","rejected","won","lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Playbook = {
  companyName: string; offer: string; notSelling: string; icpFirm: string; icpSize: string; icpRole: string; disqualify: string;
  language: "en" | "fi"; tone: string; exampleSentences: string; priceRange: string; forbiddenClaims: string;
  firstEmailGoal: string; qualifyingQuestions: string; meetingRule: string; calendarLink: string; flagHumanWhen: string;
  senderName: string; senderTitle: string; companyUrl: string;
};
export type Research = { companyGuess: string; likelyNeed: string; score: number; reasons: string[]; disqualified: boolean };
export type Draft = { subject: string; body: string; reason: string };
export type Lead = {
  id: string; createdAt: string; source: "webhook" | "csv" | "manual";
  name: string; email: string; company: string; title: string; message: string;
  status: LeadStatus; research: Research | null; draft: Draft | null;
  events: { at: string; type: string; detail: string }[];
};
export type Store = { playbook: Playbook; leads: Lead[] };
