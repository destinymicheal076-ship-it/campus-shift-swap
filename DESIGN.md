# Design: Campus Shift Swap

The look is calm and neutral. Colour is saved for one thing: the state of a shift. Students check it on a phone between classes, so the key question should be answerable at a glance: "is my shift covered?"

**Live style guide:** log in and open `/design` to see every token and component below.

## Reference apps

These are **assumptions**. We haven't interviewed anyone yet. In the 2 interviews, ask "What apps do you use every day?" and swap out any that don't come up.

| App | What we take from it |
| --- | --- |
| **Google Calendar** | A week view that opens on today, with a clear "Today" marker and one-tap week switching |
| **Venmo** | The request → accept → done flow. Every item shows its status in plain words, and the main action is one big button. |
| **Notion** | A quiet, mostly black-and-white interface with lots of space. Colour marks status and is never decoration. |

**Not a reference:** full scheduling apps like When I Work and Homebase. They have dense screens built for managers.

## Tokens

All tokens are defined in [src/app/globals.css](src/app/globals.css) and used through Tailwind classes. **Never use raw hex values or Tailwind palette colours** (like `bg-blue-500`) in components.

### Colour
Every text/background pair passes WCAG AA contrast (4.5:1 or better).

| Token | Class | Value | Use |
| --- | --- | --- | --- |
| Brand | `bg-primary`, `text-primary` | `#4F46E5` | Primary buttons, active nav item, "Today", links, focus ring |
| Ink | `text-foreground` | `#18181B` | Body text and headings |
| Muted | `text-muted-foreground` | `#71717A` | Names, notes, hints, "No shifts" |
| Page | `bg-background` | `#FAFAFA` | App background |
| Surface | `bg-card` | `#FFFFFF` | Cards, inputs, nav bar, modals |
| Subtle | `bg-muted`, `bg-secondary` | `#F4F4F5` | Hover states, secondary buttons, neutral badges |
| Border | `border-border` | `#E4E4E7` | Card, input and divider lines |
| Danger | `text-destructive` | `#DC2626` | Form errors and destructive buttons only |

**Shift status.** Always show a status as a badge with a **word**, never colour alone. Use `<StatusBadge status="…">`.

| Status | Text / background | Classes | Badge word |
| --- | --- | --- | --- |
| `open` | `#92400E` on `#FEF3C7` (amber) | `text-status-open bg-status-open-bg` | Needs cover |
| `pending` | `#075985` on `#E0F2FE` (sky) | `text-status-pending bg-status-pending-bg` | Waiting for approval |
| `approved` | `#166534` on `#DCFCE7` (green) | `text-status-approved bg-status-approved-bg` | Covered |
| `denied`, `cancelled`, `expired` | `#52525B` on `#F4F4F5` (grey) | `text-status-closed bg-status-closed-bg` | Denied / Cancelled / Expired |

Amber is the only warm colour, so shifts that need cover stand out in a full week. The brand indigo is far from all 4 status colours, so a button is never mistaken for a status.

### Type
**Geist Sans** for everything (loaded with `next/font`). **Geist Mono** only for codes or IDs.

| Class | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `text-title` | 20 / 28px | 600 | One per page: the page title |
| `text-heading` | 16 / 24px | 600 | Section and card titles, like day names |
| `text-body` | 14 / 20px | 400 | Default text |
| `text-small` | 13 / 18px | 400 | Hints, meta, errors, badges |

- **Times and dates in columns** use `tabular-nums`, so `9:00` and `11:00` line up.
- **Sentence case everywhere.** "Open shifts", never "OPEN SHIFTS".
- Inputs use 16px text on phones, so iOS doesn't zoom in when you tap them.

### Space, shape, elevation, motion
| Token | Value | Rule |
| --- | --- | --- |
| Spacing | Tailwind's 4px scale | Page gutter `p-4` (16px). Between cards `gap-4`. Inside a card `--card-spacing` (16px). Between fields `gap-4`. |
| Page width | `max-w-3xl` | Content is centred. Phone first: every screen must work at 375px. |
| Radius | `--radius` 10px | Buttons and inputs `rounded-lg`, cards and modals `rounded-xl`, badges fully rounded |
| Elevation | `shadow-overlay` | Cards are flat, with a border only. Only modals and toasts, which float above the page, get a shadow. |
| Motion | 150ms | Colour and opacity transitions only. No bouncing or sliding content. |
| Tap targets | 40px minimum | Default button and input height is `h-10`. Use `size="sm"` (32px) only in dense rows next to a larger target. |

Dark mode isn't in v1 (it's not in plan.md). The tokens are set up so it can be added later.

## Components

| # | Component | File | Built on |
| --- | --- | --- | --- |
| 1 | Button | `src/components/ui/button.tsx` | shadcn/ui |
| 2 | Input + Field | `src/components/ui/input.tsx`, `src/components/ui/field.tsx` | shadcn/ui + our own |
| 3 | Card | `src/components/ui/card.tsx` | shadcn/ui |
| 4 | List | `src/components/ui/list.tsx` | our own |
| 5 | Nav | `src/components/nav.tsx`, `src/components/nav-links.tsx` | our own |
| 6 | Modal | `src/components/confirm-dialog.tsx` on `src/components/ui/dialog.tsx` | shadcn/ui (Radix Dialog) |
| 7 | Empty state | `src/components/empty-state.tsx` | our own |
| 8 | Toast | `src/components/ui/sonner.tsx`, mounted in `src/app/layout.tsx` | shadcn/ui (Sonner) |

Plus `<StatusBadge>` (`src/components/status-badge.tsx`), built on `Badge`.

### 1. Button
- **Variants:**
  - `default` (brand): the one main action on a screen, like "Claim shift" or "Approve".
  - `outline`: secondary actions.
  - `ghost`: low-emphasis actions in toolbars.
  - `destructive`: "Deny" and "Cancel request".
  - `link`: inline navigation.
  - `secondary`: rare. Prefer `outline`.
- **Sizes:** `default` 40px, `lg` 44px (the main action on phone forms), `sm` 32px (dense rows only), plus `icon` sizes.
- **Rules:**
  - Only one `default` button per screen or modal.
  - Labels are verbs that say what happens: "Claim shift", not "OK" or "Submit".
  - While the action runs, disable the button and change the label to "Please wait…".
  - Use `asChild` with `<Link>` for buttons that navigate.

### 2. Input and Field
- **`<Input>`** is 40px tall, on the surface colour, with the brand focus ring.
- **`<Field id label hint? error?>`** wraps exactly one control. It adds the label, connects the hint and error with `aria-describedby`, and sets `aria-invalid` when there's an error.
- **Rules:**
  - Every input has a visible label. Placeholder text is only an example, never the label.
  - Hints are one short sentence ("Your coworkers see this.").
  - Errors say how to fix the problem ("Enter an email address like alex@school.edu.").
  - Form-level errors use `role="alert"`, and success messages use `role="status"`.

### 3. Card
- A white surface with a border and no shadow. Use `CardHeader`, `CardTitle` (`text-heading`), `CardDescription` and `CardContent`.
- **Use for:** one day in the schedule, one form, one request.
- **Don't** nest cards, and don't use a card for a single line of text.

### 4. List
- **`<List>`** holds rows separated by dividers, usually inside a `CardContent`.
- **`<ListItem leading title meta? trailing?>`** has 4 slots:
  - `leading`: a time, in tabular numbers.
  - `title`: a person, or "You".
  - `meta`: muted, like a note or "Claimed by Riley".
  - `trailing`: a badge or button.
- The row wraps on narrow screens instead of squeezing the text.
- **Use for:** shifts in a day, open shifts, the approval queue.

### 5. Nav
- A white bar at the top with the app name (in brand colour), the page links and a logout button. It wraps on phones.
- The current page is highlighted in brand colour and gets `aria-current="page"`.
- **Links:** students see Schedule and Open shifts. Supervisors also see Approvals and New shift. Supervisor-only pages must also call `requireSupervisor()`. Hiding the link isn't enough.

### 6. Modal
- Use **`<ConfirmDialog trigger title description? confirmLabel destructive? onConfirm>`** before anything that's hard to undo: cancelling a request, or denying a swap.
- **Rules:**
  - The title is a question: "Cancel your cover request?"
  - The description says what will happen: "Your Thu 9am–1pm shift goes back to you."
  - The confirm button repeats the action ("Cancel request"). The cancel button defaults to "Keep it".
  - The modal closes when `onConfirm` finishes.
- Don't use a modal for forms or information. Use a page.

### 7. Empty state
- **`<EmptyState icon? title description? action?>`**: a dashed-border panel with a muted icon.
- **Rules:**
  - The title says what's missing: "No open shifts right now".
  - The description says when that will change: "When a coworker needs cover…, it shows up here."
  - Offer one action at most, and only if there's something useful to do.
- For an empty day inside the schedule, use the plain muted text "No shifts", not a full empty state.

### 8. Toast
- Use `toast()` from `sonner`. The Toaster is already mounted once in the root layout. Toasts are light theme and appear at the bottom centre.
- **Use for:** confirming something just happened, such as "Your Thu 9am–1pm shift is posted." Use `toast.success` for a finished swap and `toast.error` for a failed action.
- **Rules:**
  - One sentence, following the tone rules below.
  - Never put the only copy of important information in a toast, because it disappears. The page itself must show the new state too (for example the status badge).

## Tone

**Like a helpful coworker texting you:** short, plain and specific. Friendly, but not cute. Supervisors use it too, and nobody wants a joke when a shift is uncovered.

1. **Say what happened, then what to do next.** No more than 2 sentences.
2. **Use names and times, not IDs:** "Jordan claimed your Thu 9am shift."
3. **Write "you" and "your",** in the active voice.
4. **Blame the situation, not the person,** in error messages. Say how to fix it.
5. **No emoji, no exclamation marks, and no "Oops!"**

| Situation | Do | Don't |
| --- | --- | --- |
| Request posted | Your Thu 9am–1pm shift is posted. We'll show it to Circulation Desk staff. | Success! Your swap request has been created! 🎉 |
| Shift claimed | Jordan claimed your Thu 9am shift. Waiting for Sam to approve. | Swap request status updated to PENDING. |
| Swap approved | Covered. Jordan is working Thu 9am–1pm. | The request was approved by the supervisor. |
| Overlap error | You already have a shift then (Thu 10am–2pm). Pick a different one. | Error: overlapping shift constraint violated. |
| Empty state | No open shifts right now. | Nothing to see here! |
| Supervisor queue | 2 swaps waiting for you. | You have pending approvals that require action. |

**Words to use:**
- "Needs cover", not "open request"
- "Claim", not "accept" or "pick up"
- "Covered", not "approved" (the status students see)
- "Supervisor", not "manager" or "admin"
