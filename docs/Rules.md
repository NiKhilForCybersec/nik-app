# Rules

Per-feature, per-screen rules. Smaller and more granular than [Policy.md](Policy.md). When something here contradicts Policy, Policy wins.

## Widgets

### Adding a widget
- Single-instance widget types are hidden from the library once installed (Hydration, Score, Streak, etc.).
- `list_preview` is multi-instance — always shown in the library so the user can drop multiple lists (e.g. reading + shopping).
- Tap a library item → installs at end with the type's `defaultSize`.
- Drag a library item over an existing tile → installs at that slot's position; existing tiles shift down.

### Resizing
- Tap a widget to enter resize mode; tap the same widget or any empty grid area to exit.
- 4 size buttons appear in resize mode: 1×1 / 2×1 / 1×2 / 2×2. Tap to apply.
- OR drag the right edge (toggles width) / bottom edge (toggles height). Past half a tile-width/height threshold = commit.

### Reordering
- Tap-and-hold for 200ms then drag → reorder. Optimistic local reflow, server catches up.
- CSS grid auto-flow handles row packing — no need to set explicit (col, row).

### Removing
- ✕ button in top-right corner of every tile.
- Confirm dialog (`widgets.remove` is mutability=confirm).
- "Reset to default canvas" archives all current and re-installs the starter set.

### AI-driven changes
- AI uses the same op catalog (`widgets.install`, `widgets.move`, `widgets.resize`, `widgets.remove`, `widgets.reset`).
- AI picks sizes per the guidance in Policy.md → "AI sizing guidance".
- After any tool call, AI gives a one-line confirmation ("Installed Sleep widget at 2×1.").

## Family circle

### Membership
- A row in `circle_members` represents a person from your perspective. Self is always present, `is_self=true`.
- Direct add (`circle.add`) is just a row insert in YOUR table — the other person doesn't see it. Use this for non-Nik people you just want to track.
- Invite flow (`circle.createInvite` + `circle.acceptInvite`) creates reciprocal rows on both sides. Use this for real Nik users.

### Privacy
- Each `circle_members` row has `share_tier` (inner/family/kid/caregiver/custom) + optional `custom_cats`.
- `canCircleView(viewer, owner, category, sharing)` is the only allowed gate.
- Default tier on accepted invites is `family`. Owner can change it from CircleScreen → Manage what each person sees.

### Removing
- Soft delete: removing a member just deletes your row. Their copy persists; they can also remove you.

## Habits

### Source-of-truth derivation
- Hydrate.done = `sum(hydration_intakes.ml today) / 250`, capped at target. Updated synchronously by `hydration.log` and `hydration.remove`.
- Sleep 7h+.done = `(sleep_nights.duration_min for last_night) / 60`, capped at target. Updated by `sleep.log`.
- Walk 8k steps.done — will derive from HealthKit when available; manual until then.
- Other habits (Read, Train, Meditate, Stretch) — manual `habits.bump`.

### Scoring
- Each completion fires a `score_events` row via the bridge triggers (`20260426000009_score_recompute.sql`).
- `recompute_user_score(uid)` aggregates and updates the snapshot synchronously.
- Pillar mapping: hydration → health (+2), sleep ≥6h → health (+5), diary → mind (+3), quest done → focus (+round(xp/10)).

## Chat / AI

### Tool catalog
- Built dynamically from the registry by `buildToolCatalog()` ([web/src/lib/llm/tools.ts](../web/src/lib/llm/tools.ts)).
- Derived ops are filtered out — the AI literally has no tool to write profile.streak, score.total, etc.
- Confirm-tag ops require explicit user confirmation in the same turn.

### Tool-use loop
- 4 hops max, then the AI must give a final text answer.
- Every tool result invalidates React Query queries that share the op's namespace prefix → other screens refresh.

### Persistence
- Every user + assistant turn (including tool_calls) is persisted in `chat_messages`.
- `chat.clear` is destructive (mutability=confirm).

## Honesty UX

- Empty states show "—" or a clear CTA ("Write your first entry"), never invented data.
- Vitals always shows "NO HEALTHKIT YET" until permission is granted.
- Family pulse shows "Just you so far. Invite family →" when only self is in the circle.

## Visuals

- Premium-first: glass + gradients + hue accents + tabular-nums (see [Policy.md](Policy.md) → Visual quality).
- Every widget renders meaningfully at every size — 1×1 is intentional, not stripped; 2×2 is hero, not just bigger padding.

## Things that REQUIRE the user (not Claude)

- Cloud Supabase project creation
- Supabase secret provisioning
- App icon design
- Apple Developer enrollment + TestFlight submission
- Privacy policy + terms hosting

See [Production.md](Production.md) for the step-by-step.
