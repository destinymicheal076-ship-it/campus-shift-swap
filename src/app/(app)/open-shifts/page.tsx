import { CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ClaimButton } from "@/components/swap-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { dayHeading, timeRange } from "@/lib/format";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { todayInZone } from "@/lib/time";

// Shifts coworkers need covered. Students see the ones for their roles and
// can claim them; the supervisor sees all of them, read-only.
export default async function OpenShiftsPage() {
  const session = await getSession();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: myRoles }, { data: requests, error }, { data: myShifts }] = await Promise.all([
    supabase.from("user_roles").select("role_id").eq("user_id", session.userId),
    supabase
      .from("swap_requests")
      .select(
        "id, note, requester_id, requester:profiles!swap_requests_requester_id_fkey (full_name), shifts!inner (starts_at, ends_at, role_id, roles (name))",
      )
      .eq("status", "open")
      .gt("shifts.starts_at", now),
    supabase.from("shifts").select("starts_at, ends_at").eq("assignee_id", session.userId).gt("ends_at", now),
  ]);

  const roleIds = new Set((myRoles ?? []).map((r) => r.role_id));
  const visible = (requests ?? [])
    .filter((r) => r.requester_id !== session.userId)
    .filter((r) => session.isSupervisor || roleIds.has(r.shifts.role_id))
    .sort((a, b) => a.shifts.starts_at.localeCompare(b.shifts.starts_at));

  // Shown up front so nobody taps Claim just to be told no. The database
  // checks it again when they do claim.
  const clashes = (starts: string, ends: string) =>
    (myShifts ?? []).some((m) => m.starts_at < ends && m.ends_at > starts);

  const byDay = new Map<string, typeof visible>();
  for (const r of visible) {
    const day = todayInZone(new Date(r.shifts.starts_at));
    byDay.set(day, [...(byDay.get(day) ?? []), r]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-title">Open shifts</h1>
        <p className="text-body text-muted-foreground">
          {session.isSupervisor
            ? "Shifts your staff need covered."
            : "Shifts your coworkers need covered, for your roles."}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-small text-destructive">
          Couldn&apos;t load open shifts. {error.message}
        </p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="No open shifts right now"
          description="When a coworker needs cover for a shift you can work, it shows up here."
          action={
            <Button asChild variant="outline">
              <Link href="/schedule">View schedule</Link>
            </Button>
          }
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
                  const busy = clashes(r.shifts.starts_at, r.shifts.ends_at);
                  return (
                    <ListItem
                      key={r.id}
                      leading={timeRange(r.shifts.starts_at, r.shifts.ends_at)}
                      title={r.requester?.full_name ?? "A coworker"}
                      meta={busy ? "You already have a shift then." : (r.note ?? undefined)}
                      trailing={
                        <>
                          <Badge variant="secondary">{r.shifts.roles?.name}</Badge>
                          {!session.isSupervisor && !busy && <ClaimButton requestId={r.id} />}
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
