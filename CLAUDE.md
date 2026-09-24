# Campus Shift Swap

A portfolio web app for student workers at campus jobs. A student posts a shift they need covered, a coworker with the same role claims it, the supervisor approves it, and the schedule updates.

**Read [spec.md](spec.md) before any product change.** [plan.md](plan.md) has the cut scope (21 tasks) and [todo.md](todo.md) the build order. If a request conflicts with them, explain the conflict before changing code.

**UI follows [DESIGN.md](DESIGN.md):** colours, typeface and the tone of every piece of text.

## Stack
- Next.js 16 (App Router, TypeScript, React 19). Middleware is now `proxy` (`src/proxy.ts`).
- Supabase: Postgres, Auth (email + password), Row Level Security. `@supabase/ssr` for cookies.
- Tailwind CSS v4 + shadcn/ui (Radix) in `src/components/ui/`.
- Node 22 (`nvm use`). Deploys to Vercel.

## Commands
| Command | Use |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run lint` / `npm run typecheck` / `npm run build` | Checks; all must pass before "done" |
| `npm run db:push` | Apply `supabase/migrations/` to the linked project |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` |
| `npm run seed` | Reset demo data (Main Library, password `demo1234`) |
| `npx shadcn@latest add <name>` | Add a UI component |
| `npm run fetch-as -- <user> <path>` | Load a page as a demo user (app must be running) |

## Layout
- `src/lib/supabase/{client,server,proxy}.ts`: the only places Supabase clients are created
- `src/lib/session.ts`: `getSession()` and `requireSupervisor()`
- `src/app/(auth)/`: login, signup, auth server actions
- `src/app/(app)/`: logged-in pages; the layout loads the session and nav
- `supabase/migrations/`: schema and RLS; `scripts/seed.ts`: demo data
- `.claude/skills/`: `/add-screen <name>` builds a screen from spec.md + DESIGN.md; `/project-review` reviews changes before a commit

## Conventions
- Server Components by default; add `"use client"` only for interactivity (forms use `useActionState`).
- Mutations are Server Actions that return `{ error?: string }` for the form to show.
- Every page checks the user with `getSession()` or `requireSupervisor()`, not the proxy alone.
- Every table has RLS. Schema changes go in a new, timestamped migration file, then run `db:types`.
- Rules that span rows (claiming, overlapping shifts, approval) live in `security definer` Postgres functions and are also checked in the UI.
- Format times with `APP_TIME_ZONE`, since the server runs in UTC.
- Use theme tokens (`bg-primary`, `text-muted-foreground`, `bg-status-open-bg`), never raw hex or Tailwind palette colours. Show shift status with `<StatusBadge>`. Times get `tabular-nums`.
- Before using an unfamiliar Next.js API, read `node_modules/next/dist/docs/`.
- Keep changes small and focused, in the order todo.md gives. No unrelated refactors.

## Forbidden
- Features plan.md cut: email/SMS/push notifications, availability, workplace or role management screens, invites, scheduled jobs, time clocks, payroll, a native app. Only if explicitly asked.
- `SUPABASE_SERVICE_ROLE_KEY` anywhere under `src/` or in client code. It is only for `scripts/`.
- Disabling RLS, `using (true)` policies, or editing a migration that has already been applied.
- `supabase.auth.getSession()` for auth decisions on the server (it trusts the cookie); use `getUser()` or `getClaims()`.
- `middleware.ts` (use `proxy.ts`), the Pages Router, or a second styling system.
- New dependencies without asking first.
- `any` to silence type errors; fix the types instead.
- Committing `.env.local`, or committing or pushing at all unless explicitly asked.

## Done means
- lint, typecheck and build pass.
- The change was checked in the running app with a seeded login (student and supervisor if roles matter).
- Report honestly what was tested and what wasn't.
