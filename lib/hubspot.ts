import type { Lead } from "./types";

export async function upsertHubspot(token: string, lead: Lead) {
  const search = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: lead.email }] }],
      properties: ["email"],
    }),
  });
  const found = (await search.json()) as { results?: { id: string }[] };
  if (!search.ok) throw new Error("HubSpot search failed");

  let contactId = found.results?.[0]?.id;
  const props = {
    email: lead.email,
    firstname: lead.name.split(" ")[0],
    lastname: lead.name.split(" ").slice(1).join(" ") || undefined,
    company: lead.company || undefined,
    jobtitle: lead.title || undefined,
  };

  if (!contactId) {
    const created = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ properties: props }),
    });
    const data = (await created.json()) as { id?: string; message?: string };
    if (!created.ok || !data.id) throw new Error(data.message || "HubSpot create failed");
    contactId = data.id;
  }

  const noteBody = [
    `Greenlit ${lead.status}`,
    lead.draft ? `Subject: ${lead.draft.subject}` : "",
    lead.draft?.body ?? "",
    lead.research ? `Score ${lead.research.score}. ${lead.research.likelyNeed}` : "",
  ].filter(Boolean).join("\n\n");

  await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        hs_timestamp: Date.now().toString(),
        hs_note_body: noteBody,
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        },
      ],
    }),
  });

  return { contactId };
}
