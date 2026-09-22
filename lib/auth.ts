import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "./supabase";

export type AuthContext = { userId: string; organizationId: string };

export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  const userId = data.user.id;

  const admin = supabaseAdmin();
  const existing = await admin.rest<{ organization_id: string }[]>(
    `organization_members?user_id=eq.${encodeURIComponent(userId)}&select=organization_id&limit=1`,
  );
  if (existing[0]?.organization_id) return { userId, organizationId: existing[0].organization_id };

  const org = await admin.rest<{ id: string }[]>("organizations", {
    method: "POST",
    body: JSON.stringify({ name: `${data.user.email || "User"}'s Greenlit workspace` }),
    headers: { prefer: "return=representation" },
  });
  const organizationId = org[0]?.id;
  if (!organizationId) throw new Error("Could not create workspace");
  await admin.rest("organization_members", {
    method: "POST",
    body: JSON.stringify({ organization_id: organizationId, user_id: userId, role: "owner" }),
    headers: { prefer: "return=minimal" },
  });
  await admin.rest("org_playbooks", {
    method: "POST",
    body: JSON.stringify({ organization_id: organizationId, data: {} }),
    headers: { prefer: "return=minimal" },
  });
  await admin.rest("org_connections", {
    method: "POST",
    body: JSON.stringify({ organization_id: organizationId, gmail: null, hubspot_token: "" }),
    headers: { prefer: "return=minimal" },
  });
  return { userId, organizationId };
}

export async function requireOrganizationId() {
  return (await getAuthContext()).organizationId;
}
