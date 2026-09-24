---
name: add-screen
description: Add or build a screen (page) in Campus Shift Swap, such as Open shifts, Approvals or New shift. Use whenever a new page is created or a placeholder page is replaced. Enforces spec.md for what the screen does and DESIGN.md for how it looks and reads.
argument-hint: <screen, e.g. "open shifts" or "/approvals">
---

# Add a screen: $ARGUMENTS

You are adding one screen to Campus Shift Swap. **spec.md decides what it does. DESIGN.md decides how it looks and what it says.** Both are loaded below; don't work from memory of them.

## Source of truth (loaded when this skill ran)

### spec.md
!`cat spec.md`

### DESIGN.md
!`cat DESIGN.md`

### Scope and build order (plan.md cut list, todo.md)
!`sed -n '/## Scope cut/,/## Phases/p' plan.md`
!`cat todo.md`

### Screens that exist now
!`find "src/app" -name page.tsx | sort`

## Step 1: Check it's in scope. Stop if it isn't.
- Find the screen in spec.md (Core flow, Features, Rules and edge cases) and in todo.md.
- **If the screen or any part of it is in plan.md's cut list** (emails, availability, workplace management, invites, expiry job, and so on), or isn't in spec.md at all: **stop**. Tell the user which line it conflicts with and ask how to proceed. Don't build a partial version quietly.
- If an earlier todo.md item it depends on isn't done (for example, Approvals before Claim), say so before starting.

## Step 2: Write a short plan and show it before coding
Keep it to about 10 lines:
1. **Route and file:** `src/app/(app)/<route>/page.tsx`, plus `actions.ts` for Server Actions and a `*-form.tsx` client component only if needed.
2. **Who can see it:** `getSession()`, or `requireSupervisor()` for supervisor pages. Include the nav link and whether it's supervisor-only.
3. **Data:** the tables and columns it reads and writes, and which RLS policy or `security definer` function allows each write. If a write needs a new database rule, it goes in a **new** migration file.
4. **States:** loading, empty, error, success. Every one must be designed. None can be left blank.
5. **Components** from DESIGN.md's component list. Name which of the 8, plus `StatusBadge`.
6. **Text:** the exact title, button labels, empty-state wording, error messages and toast text, following DESIGN.md's tone rules and word list.

## Step 3: Build it
Follow CLAUDE.md's conventions, plus these screen rules from DESIGN.md:
- **One `text-title` per page.** Card titles use `text-heading`, body text `text-body`, meta and hints `text-small`.
- **Only theme tokens.** No hex values and no Tailwind palette colours (`bg-blue-500`).
- **Status** is always `<StatusBadge status=…>`, with the word, never colour alone.
- **Rows of shifts or requests** use `<List>`/`<ListItem>` inside a `Card`, with the time in `leading` and `tabular-nums`.
- **Forms** use `<Field>` around every `<Input>`. Use one `default` button per screen, labelled with a verb ("Claim shift"). While a form is submitting, its button is disabled and says "Please wait…".
- **Hard-to-undo actions** (cancel, deny) go through `<ConfirmDialog>`, whose title is a question.
- **Empty lists:** use `<EmptyState>` with a title saying what's missing and a description saying when that will change. For an empty day inside the schedule, just use the text "No shifts".
- **After an action:** show a `toast()` in the tone of DESIGN.md, *and* update the page (`revalidatePath`), because a toast isn't the only record.
- **Rules that span rows** (can this person claim this shift, overlapping shifts, one active request per shift) are enforced on the server: in the Server Action, and in a `security definer` function when the database has to guarantee it. The UI check is only a convenience.
- **Times** use the `src/lib/time.ts` helpers and `APP_TIME_ZONE`, never the server's local time.
- **Phones first:** it must work at 375px wide, with no horizontal scrolling and tap targets of at least 40px.

## Step 4: Check it against DESIGN.md
Go through this and fix anything that fails before moving on:
- [ ] Every text on the screen matches the tone rules. Use names and times, not IDs. No "Oops", no emoji, no exclamation marks.
- [ ] Words match the word list: "Needs cover", "Claim", "Covered", "Supervisor".
- [ ] `grep -nE '#[0-9a-fA-F]{3,6}\b|\b(bg|text|border)-(red|blue|green|yellow|amber|indigo|sky|gray|zinc|slate)-[0-9]' <your files>` finds nothing.
- [ ] All 4 states (loading, empty, error, success) are handled.

## Step 5: Verify
1. Run `npm run lint`, `npm run typecheck` and `npm run build`. All must pass.
2. With `npm run dev` running, use `npm run fetch-as -- <user> <path>` to load the screen:
   - as a **student** (alex, jordan or casey) and as the **supervisor**;
   - check the right person sees it, and that the wrong one is redirected;
   - check the visible text matches the plan.
3. If the screen writes data, run the action once for real against the seeded database, then check the result with `fetch-as`.
4. **Tick the todo.md item only if all of the above passed.**

## Step 6: Report
- **Files:** created or changed, one line each.
- **Checks:** each command, with pass or fail.
- **Tested in the app:** as which users, and what you saw.
- **Not tested**, and why.
- **Spec or design gaps:** anything spec.md or DESIGN.md didn't cover and the choice you made, so the user can update the doc.
- Don't commit unless the user asks.
