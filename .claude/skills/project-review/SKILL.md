---
name: project-review
description: Review the current changes in Campus Shift Swap against spec.md, DESIGN.md and CLAUDE.md, covering scope, security, design and tone, correctness and verification. Run it before committing. Read-only; it reports findings and doesn't fix them.
argument-hint: "[optional focus: a path, or e.g. \"security\"]"
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git ls-files *) Bash(npm run lint) Bash(npm run typecheck) Bash(npm run build)
---

# Project review $ARGUMENTS

Review the changes below as a strict senior reviewer for this project. **Don't edit any files.** Report findings; the user decides what to fix. If a focus was given above, review that first and most deeply, but still report anything serious elsewhere.

## What changed (compared with origin/main, including uncommitted work)
!`git status --short`
!`git log --oneline "$(git rev-parse --verify -q origin/main || echo HEAD)"..HEAD`
!`git diff "$(git rev-parse --verify -q origin/main || echo HEAD)" --stat`
Untracked files:
!`git ls-files --others --exclude-standard`

Read the full diff with `git diff <base>`, and read untracked files in full. Read enough of the surrounding code to judge each change. Don't review from the file list alone.

## Automatic checks (a hit here isn't always a bug; confirm by reading the code)
```!
echo "--- Raw colours in src (DESIGN.md: tokens only; globals.css and the /design swatch labels are exempt):"
grep -rnE '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(bg|text|border|ring)-(red|blue|green|yellow|amber|orange|indigo|violet|purple|sky|cyan|teal|emerald|lime|pink|rose|gray|zinc|slate|neutral|stone)-[0-9]{2,3}' src --include=*.tsx --include=*.ts | grep -v -e 'src/app/globals.css' -e 'src/app/(app)/design/page.tsx' || echo "none"
echo "--- Service role key used in src (forbidden):"
grep -rn 'SERVICE_ROLE' src || echo "none"
echo "--- supabase.auth.getSession() on the server (forbidden):"
grep -rn 'auth.getSession' src || echo "none"
echo "--- middleware.ts (use proxy.ts):"
ls src/middleware.ts middleware.ts 2>/dev/null || echo "none"
echo "--- 'any' types:"
grep -rnE --include=*.ts --include=*.tsx ':\s*any\b|\bas any[;,)> ]*$|\bas any[;,)>\]]|<any>' src scripts || echo "none"
echo "--- Supervisor pages missing requireSupervisor():"
for f in $(find "src/app/(app)/approvals" "src/app/(app)/shifts" -name 'page.tsx' 2>/dev/null); do grep -q requireSupervisor "$f" || echo "$f"; done; echo "(checked)"
echo "--- Server Action files missing an auth check:"
for f in $(grep -rl '"use server"' src 2>/dev/null); do grep -qE 'getSession|requireSupervisor|auth\.getUser|auth\.sign' "$f" || echo "$f"; done; echo "(checked)"
echo "--- Applied migrations that were edited (must be a new file instead):"
git diff --name-status "$(git rev-parse --verify -q origin/main || echo HEAD)" -- supabase/migrations | grep -v '^A' || echo "none"
echo "--- Env files tracked by git:"
git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' || echo "none"
```

## What to check

### 1. Scope (spec.md, plan.md, todo.md)
- Is every change something spec.md asks for, done in todo.md's order?
- **Is anything from plan.md's cut list sneaking in** (emails, availability, workplace or role screens, invites, scheduled jobs)? That's a finding even if it works.
- Was a todo.md box ticked for work that doesn't meet CLAUDE.md's "Done means"?

### 2. Security and data
- **RLS:** is it enabled on every new table, with a policy for each operation used? Look for policies that are too wide, like `using (true)` or missing a workplace check.
- **Server Actions:** does each one check the user (`getSession()` or `requireSupervisor()`) and validate every input? Never trust IDs from the form: check the role, shift and user belong to this workplace.
- **Rules that span rows** (claiming, overlapping shifts, one active request, approval): are they enforced on the server, and in a `security definer` function when the database has to guarantee them? Could two people claim the same shift at once?
- **Secrets:** is the service role key kept out of `src/`, and is `.env.local` untracked?

### 3. Design and tone (DESIGN.md)
- Only tokens are used. Status is shown with `<StatusBadge>`, with a word and never colour alone.
- **The right component for each job:**
  - `List` for rows;
  - `Field` around inputs;
  - `ConfirmDialog` for hard-to-undo actions;
  - `EmptyState` for empty lists;
  - one `default` button per screen;
  - verbs as button labels.
- **Type:** one `text-title` per page, then `text-heading`, `text-body` and `text-small`. Times in columns use `tabular-nums`.
- **Text:** check every string a user sees against the tone rules and the word list. Quote each bad string and suggest a rewrite.
- All 4 states (loading, empty, error, success) are handled, and the screen works at 375px.

### 4. Correctness
- Bugs, missed edge cases and error paths that fail silently.
- **Time zones:** everything goes through `src/lib/time.ts` and `APP_TIME_ZONE`, never the server's local time.
- **Next.js 16:** no deprecated APIs (check `node_modules/next/dist/docs/` when unsure), and `revalidatePath` after writes.
- Types: no `any`, and the Supabase query result shapes are handled properly.

### 5. Verification
- Run `npm run lint` and `npm run typecheck`. Run `npm run build` if the changes touch routes or config.
- Were the changes tested in the running app as both a student and the supervisor (`npm run fetch-as`)? If the diff or conversation doesn't show it, say that it's untested. Don't assume.

## Report format
1. **Verdict** (one line): *Ready to commit*, *Fix first* or *Needs rework*.
2. **Findings**, most serious first, as a table:
   - Severity: **Blocker** (security, data loss, broken flow, out of scope), **Should fix** (bug, design or tone violation) or **Nit**.
   - `file:line`.
   - What's wrong and what it breaks.
   - The suggested fix.
3. **Check results:** lint, typecheck and build, pass or fail.
4. **What looked good** (2–3 lines, only if it's true).

Only report findings you've confirmed by reading the code. If nothing survives, say so plainly. Don't make findings up.
