# Policy

Single source of truth for invariants the app + AI must respect. When you change a rule here, also update the relevant `SYSTEM_PROMPT` in code and any UI affordance that depends on it.

> Companion: [Rules.md](Rules.md) lists the smaller per-feature behaviour rules. This file holds the load-bearing policies.

---

## Architectural pillars (don't violate)

These are the same rules saved in `~/.claude/.../memory/project_nik_architecture.md`. Mirroring here so non-Claude readers see them.

1. **MCP-first.** Every endpoint (Supabase ops + UI commands) is exposed as an MCP tool via `packages/mcp-nik/`. Registry at `web/src/contracts/`. One source of truth, three consumers (humans, code, LLM).
2. **In-app Nik AI is per-user, aware of everything, can mutate UI.** Themes, widgets, navigation, completing tasks — all wired through `CommandBus` ([web/src/lib/useCommand.tsx](../web/src/lib/useCommand.tsx)).
3. **Pluggable LLM** — Claude / GPT / Gemini callable via the MCP layer.
4. **Clean registers** — per-screen `manifest.ts` enforced by `scripts/check-wiring.mjs` in CI.
5. **No wiring breaks** — Supabase generated types + dependency-cruiser + per-screen manifest. CI fails before drift ships.
6. **Integrations as MCP servers** — Gmail / Messages / WhatsApp / Calendar each their own MCP server. Composable, per-user disable-able.
7. **AI is in every inch of the app**, not just chat — every screen has tap-to-AI, voice orb is reachable everywhere.
8. **Login + onboarding deferable.** Dev auto-signs-in; real Google OAuth is v2.

---

## Mutability tags (op-level policy)

Every op in the registry declares one:
- **direct** — safe, idempotent-ish writes (log a hydration intake, install a widget). AI can call without confirming.
- **derived** — *no tool exists*. The value is computed from other rows (profile.streak, score.total, score.pillars). If the user asks the AI to "set my level", refuse politely + redirect to logging activity.
- **confirm** — destructive (chat.clear, circle.remove, habits.remove, items.remove, widgets.reset, widgets.remove). AI must paraphrase the action back and wait for explicit confirmation in the same turn before calling. Prefer the soft equivalent (items.archive over items.remove) when the user's intent is ambiguous.

---

## Widget grid + sizing

The home canvas is the most-touched surface; the rules here are enforced both in [WidgetsScreen](../web/src/screens/WidgetsScreen.tsx) and in the AI's `SYSTEM_PROMPT` (in WidgetsScreen + ChatScreen).

### Grid
- 2 columns wide. Auto-flows top to bottom.
- Position is a flat integer; widgets.move passes the new index, neighbours shift.

### Sizes
- Every widget has `w ∈ {1, 2}` and `h ∈ {1, 2, 3}`. Six valid shapes:
  - **1×1** — small square. Single hero metric (Streak, Today's events count, Hydration mini).
  - **2×1** — wide. Story / list preview (Active quest, Diary, Next event headline).
  - **1×2** — tall. Vertical metric stack (e.g. Hydration cups stacked vertically).
  - **2×2** — hero. Featured tile spanning a 2-row block (Score with full pillar list, Family with member cards).
  - **1×3** — extra-tall narrow column. Score full pillar list, recent intake timeline.
  - **2×3** — full hero. Maximum density: agenda, full-width habit list, hero score with delta + trend.
- `WIDGET_TYPES[type].allowedSizes = ALL_SIZES` for every type by default — the user can put any widget at any size.
- `recommendedSizes` is the metadata the AI consults when choosing sizes for an install; the resize dock shows all 6 cells fully tappable (no greying — 3-wide and 3×3 were dropped from the system, mobile-friendly bounds).
- `defaultSize` is the suggested initial shape when a widget is installed via tap; AI can override.
- Tier helper `getTier(size)` → 'mini' | 'wide' | 'tall' | 'hero' is the standard branch for widget render code so content scales consistently.

### Per-row layout (auto-flowed by CSS grid + dense packing)
- Two 1×1 → share one row.
- One 2×1 → full row.
- 2×2 → spans two rows in a 2-column block.
- 1×2 / 1×3 → stacks in a column; pairs with another tall in the adjacent column or with multiple 1×1.
- 2×3 → spans 3 rows × 2 cols.
- `gridAutoFlow: row dense` — when a 1×1 hole opens earlier in the canvas, the next 1×1 backfills.

### Interactions (playground)
- **Tap a widget** → selects it. Outline appears in the widget's hue + drag handle (top-left, gradient grip-dots) + ✕ remove (top-right) + edge-drag handles (right + bottom edges).
- **Bottom-floating resize dock** appears whenever a tile is selected — 2×3 mini-grid showing all 6 sizes; tap any cell to resize. Tap ✓ to deselect.
- **Drag the right/bottom edge** → drag past one cell-unit threshold to flip the dimension. rAF-throttled. Optimistic local state so the tile reflows instantly.
- **Drag the handle** → reorder the widget anywhere on the canvas. Tile body itself is not a drag target (so tap-hold doesn't text-select).
- **Tap or drag a library item** → install at end (tap) or at a specific slot (drag).
- **Tap empty grid area** → deselect.

### Tap-to-navigate (Home view)
Every widget on Home opens its dedicated screen on tap, resolved via `widgetNavTarget(widget)` in `web/src/components/widgets/WidgetCanvas.tsx`:
- Base widgets read their navTarget directly from `WIDGET_TYPES[type]`.
- `list_preview` widgets look up `config.kind` in `KIND_TO_SCREEN` (30 entries: reading→reading, bill→bills, plant→plants, etc.).

### AI sizing guidance
Saved in the WidgetsScreen + ChatScreen system prompts so the LLM picks sensible shapes:
- "Make it bigger" / "feature X" → 2×2 or 2×3.
- Standalone simple counters → 1×1 default.
- Lists and stories → 2×1 default; grow to 2×2 / 2×3 when the user wants more preview.
- Vertical info dense tile (intake history, pillar breakdown) → 1×3 or 2×3.
- Always default to `defaultSize` when no size is specified.

---

## Honesty principles

- Every visible metric must come from real activity. No demo seeds. Empty state = honest 0 / "—" / "no data yet".
- Vitals (HealthKit) shows "—" until permission is granted; never fake sine-wave numbers.
- Score is derived from `score_events` via the recompute trigger ([20260426000009_score_recompute.sql](../supabase/migrations/20260426000009_score_recompute.sql)). It updates synchronously when activity logs an event.
- Habits' `done` is derived where possible (Hydrate ← `hydration_intakes`, Sleep ← `sleep_nights.duration_min`); manually bumped otherwise. Never seeded with fake values.
- Streak / level / XP / stats / pillars start at 0 for new users.

---

## Family circle

- Each side independently chooses what to share (tier: Inner / Family / Kids / Caregiver / Custom). Defaults to Family on accepted invites.
- `canCircleView(viewer, owner, category, sharing)` is the only way to decide if a category is visible. Don't render private data without going through it.
- Multi-tenant invite via `circle.createInvite` → 6-digit code + token; `circle.acceptInvite` writes reciprocal rows in one transaction (RLS-safe via SECURITY DEFINER RPC).

---

## Visual quality

From `~/.claude/.../memory/feedback_premium_visual_quality.md`:
- Glass + gradients + hue-themed accents + tabular-nums + density appropriate to size. Never ship a flat or boxy design just to land features faster.
- Compare any new tile side-by-side with the prototype block it replaces. If it looks plainer, iterate.

---

## When this file changes

1. Update the matching `SYSTEM_PROMPT` in code (`WidgetsScreen.tsx`, `ChatScreen.tsx`) so the AI sees the new rule.
2. Update [Rules.md](Rules.md) for the per-feature counterpart.
3. Mirror to memory if the rule is something you want surviving context wipes.
