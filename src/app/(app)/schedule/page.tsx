import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Pages render on the server, so format times in the campus time zone,
// not the server's (Vercel runs in UTC).
const timeZone = process.env.APP_TIME_ZONE;
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });

// First version of the week 3 schedule view: the next 14 days of shifts.
export default async function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  const { view } = await searchParams;
  const mine = view !== "everyone";
  const session = await getSession();
  const supabase = await createClient();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const until = new Date(now);
  until.setDate(now.getDate() + 14);

  let query = supabase
    .from("shifts")
    .select("id, starts_at, ends_at, assignee_id, roles (name), profiles (full_name)")
    .gte("starts_at", now.toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at");
  if (mine) query = query.eq("assignee_id", session.userId);
  const { data: shifts, error } = await query;

  const days = new Map<string, NonNullable<typeof shifts>>();
  for (const s of shifts ?? []) {
    const key = dayFormat.format(new Date(s.starts_at));
    days.set(key, [...(days.get(key) ?? []), s]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{session.workplace?.name} schedule</h1>
        <div className="flex gap-1">
          <Button asChild size="sm" variant={mine ? "default" : "outline"}>
            <Link href="/schedule">Mine</Link>
          </Button>
          <Button asChild size="sm" variant={mine ? "outline" : "default"}>
            <Link href="/schedule?view=everyone">Everyone</Link>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">Couldn&apos;t load shifts: {error.message}</p>}
      {!error && days.size === 0 && (
        <p className="text-sm text-muted-foreground">No shifts in the next 2 weeks.</p>
      )}

      {[...days].map(([day, dayShifts]) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base">{day}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {dayShifts.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {timeFormat.format(new Date(s.starts_at))}–{timeFormat.format(new Date(s.ends_at))}
                </span>
                <Badge variant="secondary">{s.roles?.name}</Badge>
                <span className="text-muted-foreground">
                  {s.assignee_id === session.userId ? "You" : (s.profiles?.full_name ?? "Unassigned")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
