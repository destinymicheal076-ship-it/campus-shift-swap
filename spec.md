# Spec: Campus Shift Swap

## Problem

Student workers in campus jobs (library desks, dining halls, rec centers, tutoring centers) often need to give up a shift because of exams, class changes, or illness. Today they post "can anyone cover Thursday?" in a group chat, wait for a reply, then message their supervisor to approve it. Agreements get lost, the schedule goes out of date, and the supervisor becomes the middleman for every change.

> Note: this problem is an assumption, not something I've observed. It should be checked with 2–3 campus student workers or supervisors.

## Goal

A portfolio project that lets a student post a shift, lets an eligible coworker claim it, and lets a supervisor approve it, with the schedule updating automatically. Success means a working, deployed demo that anyone can try with seeded demo logins.

## Users and roles

| Role | Can do |
| --- | --- |
| Student worker | View the schedule, set availability, post their own shift for coverage, claim eligible shifts |
| Supervisor | Manage the workplace's roles, staff and shifts; approve or deny swaps |

A workplace (for example, "Main Library") has roles (for example, "Circulation Desk" and "Shelving"). Each student has one or more roles.

## Core flow: shift swap

1. A student opens one of their upcoming shifts and taps **Request cover**. Adding a note is optional.
2. The shift appears as **Open**. Coworkers at the same workplace with the same role, who are marked available at that time, get an email.
3. A coworker taps **Claim**. The shift becomes **Pending approval**. Only one person can claim a shift.
4. The supervisor gets an email and approves or denies the swap.
   - **Approved:** the shift is reassigned, and both students get an email.
   - **Denied:** the shift goes back to Open, and the claimer gets an email.
5. The original student can cancel the request any time before approval.

Shift states: `Assigned → Open → Pending approval → Assigned (new owner)`, with the paths Denied → Open and Cancelled → Assigned (original owner).

## Features

### v1 (must have)
- Sign up and log in with email and password (Supabase Auth)
- A supervisor creates a workplace and roles, and invites students
- A supervisor creates shifts (date, start and end time, role, assigned student)
- A weekly schedule view (my shifts, and the whole workplace)
- The full swap flow above, including a list of open shifts students can claim
- Email notifications at each step
- Seeded demo data: one workplace, 2 roles, 1 supervisor, 6 students, about 2 weeks of shifts

### Extra: availability
- Students mark the weekly times they can't work (for example, when they have classes)
- Only students who are available get notified about an open shift, and the claim button is hidden for students whose availability conflicts with it
- The supervisor sees availability when creating shifts

### Out of scope
- SMS or push notifications
- Weekly hour limits, calendar export, alerts for unclaimed shifts
- Time clocks, payroll, or building schedules automatically
- A native mobile app. The web app should work well on phones, since students will use it on their phones.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend and API | Next.js (App Router), TypeScript |
| Database and login | Supabase (Postgres + Auth + Row Level Security) |
| Email | Resend (or Supabase's built-in email) |
| Styling | Tailwind CSS |
| Hosting | Vercel (free plan) |

## Data model (first draft)

- `workplaces` (id, name)
- `roles` (id, workplace_id, name)
- `memberships` (user_id, workplace_id, is_supervisor)
- `user_roles` (user_id, role_id)
- `shifts` (id, workplace_id, role_id, starts_at, ends_at, assignee_id)
- `swap_requests` (id, shift_id, requester_id, claimer_id, status, note, created_at, decided_at)
- `unavailability` (id, user_id, weekday, start_time, end_time)

Row Level Security: users can only see data for workplaces they belong to, and only supervisors can create shifts or approve swaps.

## Rules and edge cases
- A student can't claim a shift that overlaps one they already have
- A shift can have only one active swap request at a time
- If an open shift reaches its start time without being claimed, it goes back to its original owner and the request is marked expired
- Only a supervisor at that workplace can approve a swap

## Milestones (one term, about 12 weeks)

| Weeks | Milestone |
| --- | --- |
| 1–2 | Set up the project, login, workplaces, roles and inviting students |
| 3–4 | Create shifts and the weekly schedule view |
| 5–7 | Swap flow: request, claim, approve or deny, cancel |
| 8 | Email notifications |
| 9–10 | Availability, and filtering who's eligible to claim |
| 11 | Seeded demo data, phone layout, polish |
| 12 | Deploy, write the README, record a demo video |

## Success criteria
- The deployed app works from start to finish using the demo logins
- A swap goes from request to approval in under 1 minute
- Row Level Security keeps each workplace's data separate, and a test checks this
- Before week 5, talk to at least 2 real campus workers to check that the problem is real

## Open questions
- Can the supervisor also assign an open shift directly to someone, without waiting for a claim?
- Should a supervisor be able to belong to more than one workplace?
