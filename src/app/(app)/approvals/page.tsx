import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { DecisionButtons } from "@/components/swap-buttons";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { dayHeading, shiftLabel, timeRange } from "@/lib/format";
import { requireSupervisor } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { todayInZone } from "@/lib/time";

// Claimed shifts waiting for the supervisor. Approving moves the shift to
// the claimer; denying puts it back to needing cover.
export default async function ApprovalsPage() {
  const session = await requireSupervisor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("swap_requests")
    .select(
      "id, note, requester:profiles!swap_requests_requester_id_fkey (full_name), claimer:profiles!swap_requests_claimer_id_fkey (full_name), shifts!inner (starts_at, ends_at, workplace_id, roles (name))",
    )
    .eq("status", "pending")
    .eq("shifts.workplace_id", session.workplace!.id);

  const pending = (data ?? []).sort((a, b) => a.shifts.starts_at.localeCompare(b.shifts.starts_at));
  const byDay = new Map<string, typeof pending>();
  for (const r of pending) {
    const day = todayInZone(new Date(r.shifts.starts_at));
    byDay.set(day, [...(byDay.get(day) ?? []), r]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-title">Approvals</h1>
        {pending.length > 0 && (
          <p className="text-body text-muted-foreground">
            {pending.length === 1 ? "1 swap waiting for you." : `${pending.length} swaps waiting for you.`}
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-small text-destructive">
          Couldn&apos;t load swaps. {error.message}
        </p>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No swaps waiting for you"
          description="When a coworker claims a shift, it shows up here for you to approve or deny."
        />
      ) : (
        [...byDay].map(([day, rows]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-heading">{dayHeading(rows[0].shifts.starts_at)}</CardTitle>
            </CardHeader>
            <CardContent>
              <List>
                {rows.map((r) => {
                  const claimer = r.claimer?.full_name ?? "The claimer";
                  const meta = [r.shifts.roles?.name, r.note].filter(Boolean).join(" · ");
                  return (
                    <ListItem
                      key={r.id}
                      leading={timeRange(r.shifts.starts_at, r.shifts.ends_at)}
                      title={`${r.requester?.full_name ?? "A student"} → ${claimer}`}
                      meta={meta || undefined}
                      trailing={
                        <>
                          <StatusBadge status="pending" />
                          <DecisionButtons
                            requestId={r.id}
                            claimer={claimer}
                            label={shiftLabel(r.shifts.starts_at, r.shifts.ends_at)}
                          />
                        </>
                      }
                    />
                  );
                })}
              </List>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
