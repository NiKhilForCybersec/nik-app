# Next steps queue

Ordered list of work the user has greenlit. Take them top-to-bottom; each is a self-contained commit (or several). Update **Status** as items land. Don't reorder without user input.

## Queue

### 1. Per-screen polish (DEFERRED until user signs off)
The user explicitly held off on cloud / TestFlight prep until every
screen is polished (saved as memory `feedback_user_approves_cloud.md`).
What's left:
- [ ] Audit every screen against the prototype + current design intent.
- [ ] Wire any last hardcoded literals (sleep, onboard, fitness, focus,
      profile, stats — see Concerns.md).
- [ ] Resolve open dev-console concerns (drift counter, hardcoded scan
      tuning, graph colours, standalone window). These live in
      `~/nik-dev-infra/` per the separated dev-infra memory note.

### 2. Production prep (DON'T START until user gives explicit go)
Code is ready in `supabase/functions/llm-complete/` + `docs/Production.md`.
Out-of-code steps (cloud Supabase project, secret provisioning, app
icon, Apple Dev enrollment, TestFlight) wait for user approval.

## Resolved (recent)

### 2026-04-26 · Widget tap-navigation wired end-to-end
Every widget on Home (incl. all 30 list_preview kind presets + streak_counter) navigates to its dedicated screen on tap via `widgetNavTarget()`. Verified end-to-end: tap HYDRATION → /hydration; tap LEARNING → /learning. [9dc18cb](https://github.com/NiKhilForCybersec/nik-app/commit/9dc18cb).

### 2026-04-26 · Shared `<WidgetCanvas>` — Home + playground render 1:1
Extracted `ReadOnlyCanvas` + `EditCanvasInner` + `widgetNavTarget` into `web/src/components/widgets/WidgetCanvas.tsx`. Both screens now share grid styles + tile rendering byte-for-byte; only edit affordances differ. [60f2538](https://github.com/NiKhilForCybersec/nik-app/commit/60f2538).

### 2026-04-26 · Widget playground polish — drag handle + grey 3×3 + tier-based content + 2-col mobile + smooth drag
After multiple rounds: dedicated drag handle (top-left grip), no whole-tile drag (no text-select), bottom-floating resize dock (2×3 = 6 cells), greyed only 3×3 then later dropped 3-wide entirely (mobile too cramped). Grid is now 2 cols × 1-3 rows. Edge-drag rAF-throttled with optimistic local state. Every widget renders richer content as size grows (mini → wide → tall → hero). [902ae9f](https://github.com/NiKhilForCybersec/nik-app/commit/902ae9f), [952aff6](https://github.com/NiKhilForCybersec/nik-app/commit/952aff6), [6baf8ed](https://github.com/NiKhilForCybersec/nik-app/commit/6baf8ed), [95a0790](https://github.com/NiKhilForCybersec/nik-app/commit/95a0790), [efdbbfd](https://github.com/NiKhilForCybersec/nik-app/commit/efdbbfd).

### 2026-04-26 · Widget library 33+ presets · premium cards · 3-row scroll
14 base widget types + 30 ItemKind presets (Reading, Bills, Plants, Birthdays, etc.); library is a horizontally scrollable 3-row carousel with icon-disc cards, ambient halos, hue gradients. [e2acf2a](https://github.com/NiKhilForCybersec/nik-app/commit/e2acf2a), [d67cfb5](https://github.com/NiKhilForCybersec/nik-app/commit/d67cfb5).

### 2026-04-26 · Score Edge Function (live recompute via triggers)
`recompute_user_score(uid)` SQL function + bridge triggers on hydration intakes, sleep nights, diary entries, and quest completions. Snapshot updates synchronously when activity logs an event. Edge Function cron isn't required for v1 — triggers cover the use case in-DB. [8ea7bc8](https://github.com/NiKhilForCybersec/nik-app/commit/8ea7bc8).

### 2026-04-26 · Production prep code (DEPLOY DEFERRED until user approves)
`supabase/functions/llm-complete/index.ts` (Anthropic + OpenAI proxy, normalised tool-use), `docs/Production.md` checklist, `docs/legal/privacy.md` + `docs/legal/terms.md` skeletons. Out-of-code steps wait for user go. [b61ec6d](https://github.com/NiKhilForCybersec/nik-app/commit/b61ec6d).

### 2026-04-26 · Family multi-tenant invite — QR/code + reciprocal accept
[b90faf6](https://github.com/NiKhilForCybersec/nik-app/commit/b90faf6). Two real users can invite each other into their circles via 6-digit code or token; SECURITY DEFINER RPC writes reciprocal rows in one transaction. NFC tap waits for the Capacitor mobile build.

### 2026-04-26 · Family multi-tenant invite — QR/code + reciprocal accept
[b90faf6](https://github.com/NiKhilForCybersec/nik-app/commit/b90faf6). Two real users can invite each other into their circles via 6-digit code or token; SECURITY DEFINER RPC writes reciprocal rows in one transaction. NFC tap waits for the Capacitor mobile build.

### 2026-04-26 · Widget playground rebuilt + premium widget visuals + Home as widget canvas
[266f930](https://github.com/NiKhilForCybersec/nik-app/commit/266f930) (visuals + Home strip), [39df320](https://github.com/NiKhilForCybersec/nik-app/commit/39df320) (@dnd-kit playground). All widget components upgraded with gradients/animations/density; Home is now greeting + HUD + DynamicWidgetCanvas only; playground supports tap-hold drag-reorder, library tap-or-drag-to-add, tap-cycle resize, ✕ remove, AI prompt.

### 2026-04-26 · Strip all demo seed data
[bbf4c54](https://github.com/NiKhilForCybersec/nik-app/commit/bbf4c54). seedOnce() seeds STRUCTURE only (profile, habits, self circle row, score snapshot at zero). Stripped Arjun name auto-derive. New users land on honest empty state.

### 2026-04-26 · Widgets UI Phase 1 — dynamic Home rendering
12-widget component registry at [web/src/components/widgets/index.tsx](../web/src/components/widgets/index.tsx) + `DynamicWidgetCanvas` in [HomeScreen.tsx](../web/src/screens/HomeScreen.tsx) that auto-seeds defaults via `widgets.reset` on first visit and re-renders on every DB write. AI `widgets.install` from Chat now produces a real widget on Home end-to-end.

### 2026-04-26 · Widget data layer
Migration `home_widgets` + 7-op `widgets` contract shipped in [195886c](https://github.com/NiKhilForCybersec/nik-app/commit/195886c). AI can already install widgets via Chat at the data level.

### 2026-04-26 · MoreScreen tile sub-text
5 lying tiles fixed (Brief / Diary / Focus / Score / Family Circle) — neutral capability subs replaced fake counts. Same commit.

### 2026-04-26 · Profile + score + vitals seed lies
All seeded "demo" values stripped — every visible metric now starts at honest 0 and only fills from real activity. Hydrate / Sleep are derived live; others await manual log or HealthKit.
