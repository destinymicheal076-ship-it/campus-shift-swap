import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Session = {
  userId: string;
  fullName: string;
  email: string;
  workplace: { id: string; name: string } | null;
  isSupervisor: boolean;
};

// The logged-in user, their profile and their workplace. Cached per request.
// Pages call this instead of trusting the proxy alone.
export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("is_supervisor, workplaces (id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    userId: user.id,
    fullName: profile?.full_name || user.email || "",
    email: user.email ?? "",
    workplace: membership?.workplaces ?? null,
    isSupervisor: membership?.is_supervisor ?? false,
  };
});

export async function requireSupervisor(): Promise<Session> {
  const session = await getSession();
  if (!session.isSupervisor) redirect("/schedule");
  return session;
}
