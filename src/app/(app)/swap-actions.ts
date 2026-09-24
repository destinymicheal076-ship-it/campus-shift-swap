"use server";

import { revalidatePath } from "next/cache";
import { shiftLabel } from "@/lib/format";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Every step of the swap flow. The rules themselves live in the database
// (claim_shift, cancel_request, decide_request in the swap_flow migration);
// these actions check who's asking, call them, and turn the result into a
// message for a toast.

export type SwapResult = { error?: string; message?: string };

function refresh() {
  revalidatePath("/schedule");
  revalidatePath("/open-shifts");
  revalidatePath("/approvals");
}

// Postgres raise exception messages are written for people; show them as-is.
function friendly(error: { message: string; code?: string }): string {
  if (error.code === "23505") return "This shift is already posted for cover.";
  if (error.code === "42501") return "You can only do that for your own upcoming shifts.";
  return error.message;
}

export async function requestCover(shiftId: string, note: string): Promise<SwapResult> {
  const session = await getSession();
  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("starts_at, ends_at, assignee_id, roles (name)")
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift || shift.assignee_id !== session.userId) {
    return { error: "You can only post your own shifts." };
  }
  if (new Date(shift.starts_at) <= new Date()) {
    return { error: "This shift has already started." };
  }

  const { error } = await supabase.from("swap_requests").insert({
    shift_id: shiftId,
    requester_id: session.userId,
    note: note.trim().slice(0, 200) || null,
  });
  if (error) return { error: friendly(error) };

  refresh();
  return {
    message: `Your ${shiftLabel(shift.starts_at, shift.ends_at)} shift is posted. We'll show it to ${shift.roles?.name ?? "your coworkers"} staff.`,
  };
}

export async function cancelRequest(requestId: string): Promise<SwapResult> {
  await getSession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_request", { request: requestId });
  if (error) return { error: friendly(error) };
  refresh();
  return { message: "Request cancelled. The shift is yours again." };
}

export async function claimShift(requestId: string): Promise<SwapResult> {
  await getSession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_shift", { request: requestId });
  if (error) return { error: friendly(error) };

  const { data } = await supabase
    .from("swap_requests")
    .select("requester:profiles!swap_requests_requester_id_fkey (full_name), shifts (starts_at, ends_at)")
    .eq("id", requestId)
    .maybeSingle();
  refresh();
  const who = data?.requester?.full_name ?? "your coworker";
  const when = data?.shifts ? `${shiftLabel(data.shifts.starts_at, data.shifts.ends_at)} ` : "";
  return { message: `You claimed ${who}'s ${when}shift. Waiting for your supervisor to approve.` };
}

export async function decideRequest(requestId: string, approve: boolean): Promise<SwapResult> {
  const session = await getSession();
  if (!session.isSupervisor) return { error: "Only a supervisor can approve or deny swaps." };
  const supabase = await createClient();

  const { data } = await supabase
    .from("swap_requests")
    .select("claimer:profiles!swap_requests_claimer_id_fkey (full_name), shifts (starts_at, ends_at)")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase.rpc("decide_request", { request: requestId, approve });
  if (error) return { error: friendly(error) };
  refresh();

  const who = data?.claimer?.full_name ?? "The claimer";
  const when = data?.shifts ? shiftLabel(data.shifts.starts_at, data.shifts.ends_at) : "the shift";
  return approve
    ? { message: `Covered. ${who} is working ${when}.` }
    : { message: `Denied. The ${when} shift needs cover again.` };
}
