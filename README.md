# Campus Shift Swap

Student workers post a shift they need covered, a coworker with the same role claims it, and the supervisor approves it. The schedule updates on its own.

See [spec.md](spec.md) for the product, [plan.md](plan.md) for the cut scope and [todo.md](todo.md) for the task list.

**Stack:** Next.js 16 · Supabase (Postgres, Auth, Row Level Security) · Tailwind CSS · shadcn/ui · Vercel

## Setup

1. **Node 22:** `nvm use` (reads `.nvmrc`)
2. **Install:** `npm install`
3. **Supabase project:** create a free project at [supabase.com](https://supabase.com).
4. **Env vars:** `cp .env.example .env.local`, then fill in the values from *Project Settings → API*.
5. **Database:**
   ```bash
   npx supabase login      # once
   npm run db:link         # choose your project, enter the database password
   npm run db:push         # applies supabase/migrations/
   ```
6. **Demo data:** `npm run seed`
7. **Run:** `npm run dev` and open http://localhost:3000

## Demo logins

All use the password `demo1234`.

| Email | Role |
| --- | --- |
| supervisor@example.com | Supervisor, Main Library |
| alex@example.com | Circulation Desk |
| jordan@example.com | Circulation Desk |
| taylor@example.com | Circulation Desk, Shelving |
| morgan@example.com | Circulation Desk |
| casey@example.com | Shelving |
| riley@example.com | Shelving |

## Project layout

```
src/
  proxy.ts                 refreshes the session, sends logged-out users to /login
  lib/supabase/            browser, server and proxy clients
  lib/session.ts           getSession() / requireSupervisor()
  app/(auth)/              login, signup, server actions
  app/(app)/               logged-in pages: schedule, open-shifts, approvals, shifts/new
  components/ui/           shadcn/ui components
supabase/migrations/       schema + RLS policies
scripts/seed.ts            demo workplace, users and 2 weeks of shifts
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Apply migrations to the linked Supabase project |
| `npm run seed` | Load demo data (safe to run again; it replaces the shifts) |
