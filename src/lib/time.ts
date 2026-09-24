// Date helpers in the campus time zone (APP_TIME_ZONE). The server runs in
// UTC on Vercel, so "today" and "midnight" must be worked out in the campus
// zone, not with the server's local Date methods.
// Dates are plain "YYYY-MM-DD" strings.

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// The wall-clock time in the campus zone at `instant`, read as if it were UTC.
function wallClockAsUtc(instant: Date): number {
  const p = Object.fromEntries(
    partsFormat.formatToParts(instant).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export function todayInZone(now = new Date()): string {
  return new Date(wallClockAsUtc(now)).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function mondayOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((day + 6) % 7));
}

// The UTC instant of 00:00 on `date` in the campus zone.
export function zonedMidnightToUtc(date: string): Date {
  const guess = Date.parse(`${date}T00:00:00Z`);
  // Offset of the zone around that time; a second pass settles DST changes.
  let utc = guess - (wallClockAsUtc(new Date(guess)) - guess);
  utc = guess - (wallClockAsUtc(new Date(utc)) - utc);
  return new Date(utc);
}
