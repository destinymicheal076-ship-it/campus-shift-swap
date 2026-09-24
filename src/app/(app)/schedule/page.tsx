import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { StatusBadge } from "@/components/status-badge";
import { CancelRequestButton, RequestCoverButton } from "@/components/swap-buttons";
import { shiftLabel, timeRange } from "@/lib/format";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  isDateString,
  mondayOf,
  todayInZone,
  zonedMidnightToUtc,
} from "@/lib/time";

// Shift times are instants, shown in the campus zone. Day labels are plain
// "YYYY-MM-DD" dates, so they're formatted as UTC to avoid shifting a day.
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
const shortFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const label = (date: string, format: Intl.DateTimeFormat) => format.format(new Date(`${date}T00:00:00Z`));

export default async function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  const { view, week } = await searchParams;
  const mine = view !== "everyone";
  const now = new Date();
  const today = todayInZone(now);
  const thisWeek = mondayOf(today);
  const weekStart = isDateString(week) ? mondayOf(week) : thisWeek;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const session = await getSession();
  const supabase = await createClient();
  let query = supabase
    .from("shifts")
    .select(
      "id, starts_at, ends_at, assignee_id, roles (name), profiles (full_name), swap_requests (id, status, requester_id, note, claimer:profiles!swap_requests_claimer_id_fkey (full_name))",
    )
    .gte("starts_at", zonedMidnightToUtc(weekStart).toISOString())
    .lt("starts_at", zonedMidnightToUtc(addDays(weekStart, 7)).toISOString())
    .order("starts_at");
  if (mine) query = query.eq("assignee_id", session.userId);
  const { data: shifts, error } = await query;

  const byDay = new Map<string, NonNullable<typeof shifts>>();
  for (const s of shifts ?? []) {
    const day = todayInZone(new Date(s.starts_at));
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }

  // Links keep the other setting: the toggle keeps the week, the week links keep the toggle.
  const href = (next: { week?: string; mine?: boolean }) => {
    const params = new URLSearchParams();
    const w = next.week ?? weekStart;
    if (w !== thisWeek) params.set("week", w);
    if (!(next.mine ?? mine)) params.set("view", "everyone");
    const qs = params.toString();
    return qs ? `/schedule?${qs}` : "/schedule";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title">{session.workplace?.name} schedule</h1>
        <div className="flex gap-1">
          <Button asChild size="sm" variant={mine ? "default" : "outline"}>
            <Link href={href({ mine: true })}>Mine</Link>
          </Button>
          <Button asChild size="sm" variant={mine ? "outline" : "default"}>
            <Link href={href({ mine: false })}>Everyone</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={href({ week: addDays(weekStart, -7) })}>← Prev</Link>
        </Button>
        <div className="flex flex-col items-center text-body">
          <span className="font-medium">
            {label(weekStart, shortFormat)} – {label(addDays(weekStart, 6), shortFormat)}
          </span>
          {weekStart !== thisWeek && (
            <Link href={href({ week: thisWeek })} className="text-small text-primary underline-offset-4 hover:underline">
              This week
            </Link>
          )}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={href({ week: addDays(weekStart, 7) })}>Next →</Link>
        </Button>
      </div>

      {error && <p className="text-small text-destructive">Couldn&apos;t load shifts: {error.message}</p>}

      {days.map((day) => {
        const dayShifts = byDay.get(day) ?? [];
        return (
          <Card key={day} className={day === today ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="text-heading">
                {label(day, dayFormat)}
                {day === today && <span className="ml-2 text-small font-normal text-primary">Today</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayShifts.length === 0 ? (
                <p className="text-small text-muted-foreground">No shifts</p>
              ) : (
                <List>
                  {dayShifts.map((s) => {
                    const mineShift = s.assignee_id === session.userId;
                    const started = new Date(s.starts_at) <= now;
                    // The one open or pending request, if any (the database allows only one).
                    const active = s.swap_requests.find((r) => r.status === "open" || r.status === "pending");
                    const status = active && active.status === "open" && started ? "expired" : active?.status;
                    const meta =
                      active?.status === "pending"
                        ? `Claimed by ${active.claimer?.full_name ?? "a coworker"}`
                        : active?.note || undefined;
                    return (
                      <ListItem
                        key={s.id}
                        leading={timeRange(s.starts_at, s.ends_at)}
                        title={mineShift ? "You" : (s.profiles?.full_name ?? "Unassigned")}
                        meta={meta}
                        trailing={
                          <>
                            <Badge variant="secondary">{s.roles?.name}</Badge>
                            {status && <StatusBadge status={status} />}
                            {mineShift && !started && !active && <RequestCoverButton shiftId={s.id} />}
                            {mineShift && !started && active && active.requester_id === session.userId && (
                              <CancelRequestButton requestId={active.id} label={shiftLabel(s.starts_at, s.ends_at)} />
                            )}
                          </>
                        }
                      />
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
