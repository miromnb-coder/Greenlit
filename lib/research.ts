import type { Lead, Playbook, Research, Draft } from "./types";

function scoreLead(lead: Lead, playbook: Playbook): Research {
  const blob = `${lead.name} ${lead.email} ${lead.company} ${lead.title} ${lead.message}`.toLowerCase();
  const reasons: string[] = [];
  let score = 40;
  let disqualified = false;
  if (lead.company.trim()) { score += 15; reasons.push("Company name present"); }
  if (lead.title.trim()) { score += 10; reasons.push("Role present"); }
  if (lead.message.trim().length > 20) { score += 15; reasons.push("Wrote a real note"); }
  const roleHints = ["founder", "ceo", "owner", "partner", "sales", "growth", "head"];
  if (roleHints.some((w) => blob.includes(w))) { score += 10; reasons.push("Decision-adjacent title"); }
  const dq = playbook.disqualify.toLowerCase().split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  if (dq.some((w) => w.length > 3 && blob.includes(w))) {
    disqualified = true; score = Math.min(score, 25); reasons.push("Matches disqualify rule");
  }
  if (/(student|internship|job application|cv attached)/i.test(blob)) {
    disqualified = true; score = 10; reasons.push("Looks like inbound job seeker");
  }
  score = Math.max(0, Math.min(100, score));
  const companyGuess = lead.company || lead.email.split("@")[1] || "Unknown firm";
  const likelyNeed = lead.message.trim()
    ? lead.message.trim().slice(0, 220)
    : `Inbound from ${companyGuess}. Fit vs ICP: ${playbook.icpFirm}, ${playbook.icpSize}.`;
  return { companyGuess, likelyNeed, score, reasons, disqualified };
}

function draftFromPlaybook(lead: Lead, playbook: Playbook, research: Research): Draft {
  const first = lead.name.split(" ")[0] || "there";
  const subject = research.disqualified
    ? `Thanks ${first} — quick note`
    : `${playbook.companyName} / ${lead.company || "your note"}`;
  const quoted = lead.message ? `You wrote: "${lead.message.slice(0, 160)}"\n\n` : "";
  const body = research.disqualified
    ? `Hi ${first},\n\nThanks for writing in. This does not look like a fit for what we sell (${playbook.offer}).\n\nIf I have that wrong, reply and I will pick it up.\n\n${playbook.senderName}\n${playbook.senderTitle}\n${playbook.companyName}\n`
    : `Hi ${first},\n\nThanks for the note${lead.company ? ` from ${lead.company}` : ""}. ${playbook.firstEmailGoal}\n\n${playbook.offer}\n\n${quoted}If useful I can walk through how approval works on a short call.\n\n${playbook.senderName}\n${playbook.senderTitle}\n${playbook.companyName}\n${playbook.companyUrl}\n`;
  return {
    subject,
    body,
    reason: research.disqualified
      ? "Low score / disqualified — polite close, no meeting."
      : `Score ${research.score}. First email asks to confirm the request, no price promise.`,
  };
}

async function claudeJSON(prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

export async function runResearchAndDraft(lead: Lead, playbook: Playbook) {
  const fallbackResearch = scoreLead(lead, playbook);
  const fallbackDraft = draftFromPlaybook(lead, playbook, fallbackResearch);
  const llm = await claudeJSON(`You prepare one inbound B2B lead. Return ONLY JSON:\n{"research":{"companyGuess":"","likelyNeed":"","score":0,"reasons":[""],"disqualified":false},"draft":{"subject":"","body":"","reason":""}}\n\nPlaybook:\n${JSON.stringify(playbook)}\n\nLead:\n${JSON.stringify({ name: lead.name, email: lead.email, company: lead.company, title: lead.title, message: lead.message })}\n\nRules: never invent prices outside playbook.priceRange. Never claim the email was sent. Language: ${playbook.language}. Tone: ${playbook.tone}.`);
  const research: Research = {
    ...fallbackResearch,
    ...(llm?.research ?? {}),
    reasons: llm?.research?.reasons?.length ? llm.research.reasons : fallbackResearch.reasons,
    score: Number(llm?.research?.score ?? fallbackResearch.score),
  };
  const draft: Draft = { ...fallbackDraft, ...(llm?.draft ?? {}) };
  return { research, draft };
}
