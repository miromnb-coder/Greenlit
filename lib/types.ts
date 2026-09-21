export const LEAD_STATUSES = [
  "new","researching","researched","drafted","waiting_approval","approved","sent","replied","needs_human","rejected","won","lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const REPLY_INTENTS = ["interested","question","meeting","not_now","angry","other"] as const;
export type ReplyIntent = (typeof REPLY_INTENTS)[number];

export type Playbook = {
  companyName: string; offer: string; notSelling: string; icpFirm: string; icpSize: string; icpRole: string; disqualify: string;
  language: "en" | "fi"; tone: string; exampleSentences: string; priceRange: string; forbiddenClaims: string;
  firstEmailGoal: string; qualifyingQuestions: string; meetingRule: string; calendarLink: string; flagHumanWhen: string;
  senderName: string; senderTitle: string; companyUrl: string;
};

export type Research = { companyGuess: string; likelyNeed: string; score: number; reasons: string[]; disqualified: boolean };
export type Draft = { subject: string; body: string; reason: string };
export type ThreadMessage = { at: string; direction: "in" | "out"; body: string; gmailId?: string };
export type Meeting = { startsAt: string; endsAt: string; label: string; status: "proposed" | "booked"; hangoutLink?: string };
export type LeadEvent = { at: string; type: string; detail: string; tokens?: number; costUsd?: number };

export type Lead = {
  id: string; createdAt: string; source: "webhook" | "csv" | "manual";
  name: string; email: string; company: string; title: string; message: string;
  status: LeadStatus; research: Research | null; draft: Draft | null;
  events: LeadEvent[];
  thread: ThreadMessage[];
  intent: ReplyIntent | null;
  slots: Meeting[];
  tokens?: number; costUsd?: number; gmailId?: string; hubspotContactId?: string;
};

export type GmailConnection = { email: string; accessToken: string; refreshToken: string; expiry: number };
export type Connections = { gmail: GmailConnection | null; hubspotToken: string };
export type Job = {
  id: string;
  type: "send_and_crm" | "poll_replies" | "book_meeting";
  leadId: string;
  status: "queued" | "running" | "done" | "failed";
  detail: string;
  createdAt: string;
  finishedAt?: string;
};
export type Store = { playbook: Playbook; leads: Lead[]; connections: Connections; jobs: Job[] };
