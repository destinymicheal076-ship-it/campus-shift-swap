# Todo: Campus Shift Swap

The scope is cut to 21 tasks (from 30). See [plan.md](plan.md) for why.

## Week 1: Setup + login
- [x] Create a Next.js app with TypeScript and Tailwind
- [ ] Create a Supabase project and connect it to the app
- [ ] Deploy to Vercel
- [x] Email and password sign-up, log-in and log-out

## Week 2: Data model + seed + RLS
- [x] Create tables: workplaces, roles, memberships, user_roles, shifts, swap_requests
- [x] Write Row Level Security policies (members only; only supervisors create shifts and approve swaps)
- [x] Seed script: 1 workplace, 2 roles, 1 supervisor, 6 students, 2 weeks of shifts

## Week 3: Shifts + schedule
- [ ] Supervisor form to create shifts (date, time, role, assigned student)
- [ ] Weekly schedule view with a "Mine / Everyone" toggle

## Weeks 4–5: Swap flow
- [ ] "Request cover" on your own shift, with an optional note
- [ ] "Open shifts" list, filtered to your role
- [ ] Claim a shift (only one person can claim it)
- [ ] Supervisor approval queue with approve and deny
- [ ] Cancel a request before it's approved
- [ ] Status badges (Open, Pending approval, Expired)

## Week 6: Rules + tests
- [ ] Block a claim that overlaps one of your existing shifts
- [ ] Allow only one active request per shift
- [ ] Test that RLS keeps each workplace's data separate

## Weeks 7–8: Polish + launch
- [ ] Phone layout for every screen (375px wide)
- [ ] README with screenshots and demo logins

## Validation (before week 5)
- [ ] Talk to 2 campus student workers about how they swap shifts now

---

## Cut (for later, if the buffer allows)
- Email notifications (request, claim, approve, deny)
- Availability: students mark when they can't work
- Filtering who can claim by availability
- Show availability when the supervisor creates shifts
- Screens to manage workplaces and roles
- Inviting students
- Automatically expire unclaimed shifts (scheduled job)
- Separate workplace-wide schedule page
- Demo video
