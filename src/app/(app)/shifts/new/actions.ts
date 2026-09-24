"use server";

import { revalidatePath } from "next/cache";
import { shiftLabel } from "@/lib/format";
import { requireSupervisor } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isDateString, zonedTimeToUtc } from "@/lib/time";

export type NewShiftState = {
  error?: string;
  message?: string;
  // Changes on every save, so the form knows to show a toast and reset.
  savedAt?: number;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function createShift(_: NewShiftState, formData: FormData): Promise<NewShiftState> {
  const session = await requireSupervisor();
  const workplaceId = session.workplace?.id;
  if (!workplaceId) return { error: "You're not in a workplace." };

  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "").match(TIME_RE);
  const end = String(formData.get("end") ?? "").match(TIME_RE);
  const roleId = String(formData.get("role_id") ?? "");
  const assigneeId = String(formData.get("assignee_id") ?? "");

  if (!isDateString(date) || !start || !end) return { error: "Enter a date, a start time and an end time." };
  if (!roleId) return { error: "Pick a role." };
  if (!assigneeId) return { error: "Pick a student for this shift." };

  const startsAt = zonedTimeToUtc(date, +start[1], +start[2]);
  const endsAt = zonedTimeToUtc(date, +end[1], +end[2]);
  if (endsAt <= startsAt) return { error: "The end time must be after the start time." };
  if (startsAt <= new Date()) return { error: "The shift must start in the future." };

  const supabase = await createClient();
  // Never trust IDs from the form: the role must be this workplace's, and
  // the student must be a member here who has that role.
  const [{ data: role }, { data: member }, { data: hasRole }] = await Promise.all([
    supabase.from("roles").select("name").eq("id", roleId).eq("workplace_id", workplaceId).maybeSingle(),
    supabase
      .from("memberships")
      .select("profiles (full_name)")
      .eq("user_id", assigneeId)
      .eq("workplace_id", workplaceId)
      .maybeSingle(),
    supabase.from("user_roles").select("user_id").eq("user_id", assigneeId).eq("role_id", roleId).maybeSingle(),
  ]);
  if (!role) return { error: "Pick a role from this workplace." };
  if (!member || !hasRole) return { error: `That student doesn't work ${role.name}. Pick someone else.` };
  const name = member.profiles?.full_name || "That student";

  const { data: clash, error: clashError } = await supabase.rpc("has_overlapping_shift", {
    who: assigneeId,
    starts: startsAt.toISOString(),
    ends: endsAt.toISOString(),
  });
  if (clashError) return { error: `Couldn't check for overlapping shifts. ${clashError.message}` };
  if (clash) return { error: `${name} already has a shift at that time. Pick a different time or student.` };

  const { error } = await supabase.from("shifts").insert({
    workplace_id: workplaceId,
    role_id: roleId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    assignee_id: assigneeId,
  });
  if (error) return { error: `Couldn't save the shift. ${error.message}` };

  revalidatePath("/schedule");
  return {
    message: `Shift added: ${name}, ${role.name}, ${shiftLabel(startsAt, endsAt)}.`,
    savedAt: Date.now(),
  };
}
