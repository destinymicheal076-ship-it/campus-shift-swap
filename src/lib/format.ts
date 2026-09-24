// How shift times read in the UI, always in the campus time zone.
const zone = () => process.env.APP_TIME_ZONE;

const time = () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: zone() });
const day = () => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: zone() });
const longDay = () => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: zone() });

// "9:00 AM–1:00 PM"
export function timeRange(startsAt: string | Date, endsAt: string | Date): string {
  const f = time();
  return `${f.format(new Date(startsAt))}–${f.format(new Date(endsAt))}`;
}

// "Thu, Sep 24, 9:00 AM–1:00 PM": for messages and toasts.
export function shiftLabel(startsAt: string | Date, endsAt: string | Date): string {
  return `${day().format(new Date(startsAt))}, ${timeRange(startsAt, endsAt)}`;
}

// "Thursday, Sep 24": for day headings.
export function dayHeading(startsAt: string | Date): string {
  return longDay().format(new Date(startsAt));
}
