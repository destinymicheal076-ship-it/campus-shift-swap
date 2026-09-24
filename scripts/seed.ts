// Seeds one demo workplace. Safe to run more than once: users, the workplace
// and roles are reused, and the shifts are replaced with 2 fresh weeks.
//
//   npm run seed
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "demo1234";
const WORKPLACE = "Main Library";
const CIRC = "Circulation Desk";
const SHELVING = "Shelving";

type DemoUser = {
  email: string;
  name: string;
  supervisor?: boolean;
  roles: string[];
};

const USERS: DemoUser[] = [
  { email: "supervisor@example.com", name: "Sam Rivera", supervisor: true, roles: [] },
  { email: "alex@example.com", name: "Alex Chen", roles: [CIRC] },
  { email: "jordan@example.com", name: "Jordan Patel", roles: [CIRC] },
  { email: "taylor@example.com", name: "Taylor Kim", roles: [CIRC, SHELVING] },
  { email: "morgan@example.com", name: "Morgan Lee", roles: [CIRC] },
  { email: "casey@example.com", name: "Casey Okafor", roles: [SHELVING] },
  { email: "riley@example.com", name: "Riley Nguyen", roles: [SHELVING] },
];

// Weekday shift slots, as [role, start hour, end hour].
const SLOTS: [string, number, number][] = [
  [CIRC, 9, 13],
  [CIRC, 13, 17],
  [SHELVING, 10, 14],
];

// For writes: fail only on an error (writes without .select() return no data).
function must(result: { error: unknown }, what: string): void {
  if (result.error) {
    console.error(`Failed to ${what}:`, result.error);
    process.exit(1);
  }
}

// For reads: fail on an error or missing data.
function check<T>(result: { data: T; error: unknown }, what: string): NonNullable<T> {
  if (result.error || result.data == null) {
    console.error(`Failed to ${what}:`, result.error);
    process.exit(1);
  }
  return result.data;
}

async function ensureUser(u: DemoUser): Promise<string> {
  const created = await supabase.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.name },
  });
  if (created.data.user) return created.data.user.id;

  // Already exists: find it.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = error ? undefined : data.users.find((x) => x.email === u.email);
  if (!existing) {
    console.error(`Failed to create ${u.email}:`, created.error);
    process.exit(1);
  }
  return existing.id;
}

async function main() {
  // Users (the sign-up trigger creates their profiles).
  const ids = new Map<string, string>();
  for (const u of USERS) ids.set(u.email, await ensureUser(u));
  // Keep names in sync in case a profile already existed.
  must(
    await supabase
      .from("profiles")
      .upsert(USERS.map((u) => ({ id: ids.get(u.email)!, full_name: u.name }))),
    "upsert profiles",
  );

  // Workplace and roles.
  const workplace = check(
    await supabase
      .from("workplaces")
      .upsert({ name: WORKPLACE }, { onConflict: "name" })
      .select()
      .single(),
    "upsert workplace",
  );
  const roles = check(
    await supabase
      .from("roles")
      .upsert(
        [CIRC, SHELVING].map((name) => ({ workplace_id: workplace.id, name })),
        { onConflict: "workplace_id,name" },
      )
      .select(),
    "upsert roles",
  );
  const roleId = new Map(roles.map((r) => [r.name, r.id]));

  // Memberships and role assignments.
  must(
    await supabase.from("memberships").upsert(
      USERS.map((u) => ({
        user_id: ids.get(u.email)!,
        workplace_id: workplace.id,
        is_supervisor: Boolean(u.supervisor),
      })),
    ),
    "upsert memberships",
  );
  must(
    await supabase.from("user_roles").upsert(
      USERS.flatMap((u) =>
        u.roles.map((r) => ({ user_id: ids.get(u.email)!, role_id: roleId.get(r)! })),
      ),
    ),
    "upsert user roles",
  );

  // Shifts: replace with 2 weeks of weekdays starting this Monday.
  must(
    await supabase.from("shifts").delete().eq("workplace_id", workplace.id),
    "clear shifts",
  );
  const staffFor = (role: string) =>
    USERS.filter((u) => u.roles.includes(role)).map((u) => ids.get(u.email)!);
  const turn = new Map<string, number>();
  const shifts = [];
  // Dates and hours are campus time (APP_TIME_ZONE), not this machine's.
  const { addDays, mondayOf, todayInZone, zonedTimeToUtc } = await import("../src/lib/time");
  const monday = mondayOf(todayInZone());
  for (let i = 0; i < 14; i++) {
    const day = addDays(monday, i);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const [role, start, end] of SLOTS) {
      const staff = staffFor(role);
      const n = turn.get(role) ?? 0;
      turn.set(role, n + 1);
      const startsAt = zonedTimeToUtc(day, start);
      const endsAt = zonedTimeToUtc(day, end);
      shifts.push({
        workplace_id: workplace.id,
        role_id: roleId.get(role)!,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        assignee_id: staff[n % staff.length],
      });
    }
  }
  must(await supabase.from("shifts").insert(shifts), "insert shifts");

  console.log(
    `Seeded "${WORKPLACE}": ${USERS.length} users, ${shifts.length} shifts (${process.env.APP_TIME_ZONE ?? "machine time zone"}).`,
  );
  console.log(`Log in as any of these with password "${PASSWORD}":`);
  for (const u of USERS) {
    console.log(`  ${u.email.padEnd(24)} ${u.supervisor ? "supervisor" : u.roles.join(", ")}`);
  }
}

main();
