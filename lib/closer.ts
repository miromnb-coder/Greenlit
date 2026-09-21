import type { Lead, Playbook, ReplyIntent, Draft, Meeting } from "./types";

const KEYS: Record<ReplyIntent, RegExp> = {
  angry: /(lawsuit|angry|unsubscribe|stop emailing|incompetent|worst)/i,
  meeting: /(book|calendar|call|meet|tomorrow|thursday|times work|schedule|zoom)/i,
  interested: /(interested|sounds good|let.?s do|yes please|keen|love to)/i,
  question: /(\?|how much|pricing|what does|can you|do you)/i,
  not_now: /(not now|later|next quarter|no thanks|not a fit)/i,
  other: /./,
};

export function classifyReply(text: string): ReplyIntent {
  const order: ReplyIntent[] = ["angry", "not_now", "meeting", "interested", "question", "other"];
  return order.find((k) => KEYS[k].test(text)) ?? "other";
}

export function proposeSlots(): Meeting[] {
  const out: Meeting[] = [];
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);
  while (out.length < 2) {
    const day = start.getDay();
    if (day !== 0 && day !== 6) {
      const hour = out.length === 0 ? 10 : 14;
      const a = new Date(start);
      a.setHours(hour, 0, 0, 0);
      const b = new Date(a.getTime() + 30 * 60 * 1000);
      out.push({
        startsAt: a.toISOString(),
        endsAt: b.toISOString(),
        label: a.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: "proposed",
      });
    }
    start.setDate(start.getDate() + 1);
  }
  return out;
}

export function draftAfterReply(lead: Lead, playbook: Playbook, intent: ReplyIntent, incoming: string): { draft: Draft; slots: Meeting[]; needsHuman: boolean } {
  const first = lead.name.split(" ")[0] || "there";
  const slots = intent === "meeting" || intent === "interested" ? proposeSlots() : [];
  const slotLines = slots.map((s) => `- ${s.label}`).join("\n");
  const cal = playbook.calendarLink ? `\nOr pick here: ${playbook.calendarLink}` : "";
  let body = "";
  let reason = "";
  let needsHuman = intent === "angry";

  if (intent === "angry") {
    body = `Hi ${first},\n\nUnderstood. I am stopping automated follow-up. A person on our side will read this.\n\n${playbook.senderName}`;
    reason = "Anger or legal tone — do not send without a human.";
  } else if (intent === "not_now") {
    body = `Hi ${first},\n\nThanks for the honest note. I will close this thread. If timing changes, reply here.\n\n${playbook.senderName}`;
    reason = "Not now — polite close.";
  } else if (intent === "meeting" || intent === "interested") {
    body = `Hi ${first},\n\nGlad this is useful. Two times that work on our side:\n${slotLines}${cal}\n\nReply with the one you want and I will send the invite.\n\n${playbook.senderName}`;
    reason = playbook.meetingRule || "Offer times only after they showed intent.";
  } else if (intent === "question") {
    body = `Hi ${first},\n\nGood question. ${playbook.offer} Typical range: ${playbook.priceRange}.\n\n${playbook.qualifyingQuestions.split("\n")[0] || ""}\n\nHappy to show the approval queue live if useful.\n\n${playbook.senderName}`;
    reason = "Answer from the playbook. No extra promises.";
  } else {
    body = `Hi ${first},\n\nThanks — I read your note:\n\n"${incoming.slice(0, 180)}"\n\nWant a 20-minute walkthrough, or should I close this?\n\n${playbook.senderName}`;
    reason = "Unclear intent — ask one question.";
  }

  if (playbook.flagHumanWhen && playbook.flagHumanWhen.split(/[,\n]/).some((w) => w.trim().length > 3 && incoming.toLowerCase().includes(w.trim().toLowerCase()))) {
    needsHuman = true;
    reason = `Playbook flag: ${playbook.flagHumanWhen}`;
  }

  return {
    draft: { subject: `Re: ${lead.draft?.subject || playbook.companyName}`, body, reason },
    slots,
    needsHuman,
  };
}
