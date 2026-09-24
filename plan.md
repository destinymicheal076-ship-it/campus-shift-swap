# Plan: Campus Shift Swap

Based on [spec.md](spec.md). The scope is cut by about 30% (30 → 21 tasks), which fits in about 8 weeks and leaves 4 weeks of buffer in the term.

## What v1 is now

A student posts a shift for cover, an eligible coworker claims it, and a supervisor approves it. The schedule then updates. Everything happens inside the app, with no emails. The workplace, its roles and its users come from seeded demo data.

## Scope cut

| Cut | Why it's safe to cut | What happens instead |
| --- | --- | --- |
| Email notifications (4 types) | Biggest integration risk; the demo works without them | An "Open shifts" list and a "Pending approval" badge in the app |
| Availability (entry, filtering, supervisor view) | It was an extra; the swap flow works without it | Eligibility is only same workplace, same role, and no overlapping shift |
| Screens for managing workplaces and roles | The demo uses one fixed workplace | Created by seed data |
| Inviting students | Demo users are seeded | Seed script creates the accounts |
| Unclaimed shifts expiring automatically | Needs a scheduled job | Past open shifts show as "Expired" in the app, and no data changes |
| Separate workplace-wide schedule page | Duplicates the "my shifts" view | One weekly view with a "Mine / Everyone" toggle |
| Demo video | Nice to have | The README with screenshots and demo logins |

**Kept:** login, creating shifts, the full swap flow (request, claim, approve or deny, cancel), the rules about overlapping shifts and one request per shift, Row Level Security and a test for it, seed data, a layout that works on phones, deployment, and checking the problem with 2 campus workers.

## Phases

| Week | Phase | Done when |
| --- | --- | --- |
| 1 | Setup + login | You can sign up and log in on the deployed Vercel URL |
| 2 | Data model + seed + RLS | The seed script loads the demo workplace, and RLS blocks other workplaces' data |
| 3 | Shifts + schedule view | A supervisor creates a shift, and it appears in the weekly view |
| 4–5 | Swap flow | Request → claim → approve or deny → cancel works end to end |
| 6 | Rules + tests | Overlap and one-request rules are enforced, and tests pass |
| 7 | Phone layout + polish | Every screen works at 375px width |
| 8 | Launch | README, demo logins, and a final deploy |
| 9–12 | Buffer | Fix bugs, then add back items from the cut list if time allows |

Before week 5, talk to 2 campus student workers to check the problem is real.

## Order for adding things back

If the buffer allows: 1) email notifications, 2) availability, 3) expiring unclaimed shifts.
