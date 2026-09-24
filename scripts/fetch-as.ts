// Fetch an app page as a seeded demo user and print what it shows, so a
// screen can be checked without a browser. The app must be running.
//
//   npm run fetch-as -- alex /schedule
//   npm run fetch-as -- supervisor /approvals http://localhost:3000
//
// Uses only the public (anon) key and the demo password from the seed.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const [who, path = "/schedule", base = "http://localhost:3000"] = process.argv.slice(2);
if (!who) {
  console.error("Usage: npm run fetch-as -- <alex|supervisor|…|email> <path> [base-url]");
  process.exit(1);
}
const email = who.includes("@") ? who : `${who}@example.com`;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ref = new URL(url).hostname.split(".")[0];

async function main() {
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: "demo1234" });
  if (error || !data.session) {
    console.error(`Couldn't log in as ${email}: ${error?.message}`);
    process.exit(1);
  }

  // Same cookie format @supabase/ssr writes (chunked when long).
  const value = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  const size = 3180;
  const cookie =
    value.length <= size
      ? `${name}=${value}`
      : Array.from({ length: Math.ceil(value.length / size) }, (_, i) =>
          `${name}.${i}=${value.slice(i * size, (i + 1) * size)}`,
        ).join("; ");

  const res = await fetch(new URL(path, base), { headers: { cookie }, redirect: "manual" });
  console.log(`${res.status} ${path} as ${email}`);
  if (res.status >= 300 && res.status < 400) {
    console.log(`→ redirected to ${res.headers.get("location")}`);
    return;
  }

  // Visible text only: drop scripts, styles and tags.
  const html = await res.text();
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  const text = main
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/<\/(p|div|li|h\d|tr|button|label)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"')
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  console.log(text.join("\n"));
}

main();
