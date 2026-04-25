# Circle (Family graph)

**File:** [`web/src/screens/CircleScreen.tsx`](../../web/src/screens/CircleScreen.tsx)
**ScreenId:** `circle` (and `family` aliased to it)

## Purpose

The privacy-respecting view of everyone Nik knows about: partner, kids, parents, caregivers. Each member has a rich profile (health snapshot, meds, mood, schedule, diary), but **what you see depends on what they've shared with you**.

## What renders

1. **Constellation hero** — orbital arrangement of family members around "you" at center. Each is an `<Avatar>` with status indicator (online/away/offline) and concern color (amber/red dot if there's an alert).
2. **Awareness strip** — `Your profile was viewed Nx this week. By Meera.` Tap → opens [[Screens/View Log]] (deferred).
3. **Nik Noticed** — color-coded alerts (`AMBER`, `RED`, `SOFT`) about other members:
   - "Meera · Sleep <6h for 4 nights" → CTA "SEND A SOFT CHECK-IN"
   - "Mom · Telmisartan missed 3x — BP elevated" → CTA "CALL NOW"
4. **Everyone list** — tap any member → opens detail sheet (currently inlined).

## Key data

Sourced from [`web/src/data/circle.ts`](../../web/src/data/circle.ts):
- `CIRCLE_MEMBERS` — the 6-person mock family (Arjun, Meera, Kiaan, Anya, Mom, …)
- `CIRCLE_ALERTS` — what to flag in the "Nik Noticed" feed
- `VIEW_LOG` — who viewed what category, when
- `DEFAULT_SHARING` — the matrix of `(member, category) → trustTiers[]`
- `canCircleView(viewerId, ownerId, category)` — the permission check

See [[Data Model]] for the full type shapes.

## The privacy model

Every member's data is bucketed into 9 categories:
`health`, `meds`, `mood`, `cycle`, `schedule`, `location`, `care`, `score`, `diary`

Each viewer sits in a trust tier:
`inner` (partner, parents) → `family` (siblings, in-laws) → `kid` (visibility-reduced) → `caregiver` (helpers, doctors)

`canCircleView(viewer, owner, category)` returns `true` only if the owner's `DEFAULT_SHARING[ownerId][category]` includes the viewer's tier. Categories the viewer can't see render as `🔒 PRIVATE`.

This is **client-side only** in v1 — backend MUST enforce this server-side via row-level security or middleware. See [[Backlog]].

## Interactions

- Tap a member avatar in the constellation → opens member detail (currently inlined, will move to a sheet).
- Tap the "viewed Nx" banner → opens view log (deferred).
- Tap an alert CTA → triggers an action (call, send check-in, etc.).
- Tap a member in the "Everyone" list → opens detail.

## Device APIs needed (later)

- **Location** for the location category (real-time-ish, with privacy gate).
- **HealthKit / Health Connect** for sleep, steps, heart, etc.
- **Calendar** for the schedule category.
- **Push** to notify when a member triggers an alert.

## Skipped in v1

- Real privacy editor sheet (currently inlined; partial UI).
- View log timeline (referenced but no full sheet).
- Adding/removing circle members.

## Related

- [[Data Model]] — full circle member schema
- [[Backlog]] — backend privacy enforcement plan
- [[Screens/Index]]
