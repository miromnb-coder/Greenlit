import { googleAccess } from "./gmail";
import type { Meeting } from "./types";

export async function bookGoogleEvent(input: {
  title: string;
  description: string;
  attendee: string;
  slot: Meeting;
}) {
  const { token } = await googleAccess();
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.slot.startsAt },
        end: { dateTime: input.slot.endsAt },
        attendees: [{ email: input.attendee }],
        conferenceData: { createRequest: { requestId: crypto.randomUUID() } },
      }),
    },
  );
  const data = (await res.json()) as { id?: string; hangoutLink?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || "Calendar create failed");
  return { id: data.id || "", hangoutLink: data.hangoutLink || "" };
}
