# Next steps queue

Ordered list of work the user has greenlit. Take them top-to-bottom; each is a self-contained commit (or several). Update **Status** as items land. Don't reorder without user input.

## Queue

### 1. Widgets UI — Phase 2: playground / picker / config [NEXT]
- [ ] WidgetsScreen rebuilt as a real playground: shows current canvas (with reorder + remove handles) + library to add from + per-widget config forms (auto-generated from Zod `configSchema`)
- [ ] AI prompt input at top: user types natural-language widget request → routes through chat LLM → `widgets.install` → widget appears
- [ ] Drag-and-drop reorder (HTML5 drag API, no extra dep)
- [ ] Resize controls (1×1 / 2×1 / 1×2 / 2×2 chips per widget)

### 2. Family multi-tenant invite
- [ ] Migration: `circle_invites { id, owner_user_id, token, code, max_uses, used_count, expires_at, accepted_by_user_id }`
- [ ] Contract: `circle.createInvite() → { token, qrPayload, code }`, `circle.acceptInvite({ tokenOrCode })`
- [ ] On accept: insert reciprocal `circle_members` rows on both sides with default share_tier='family'
- [ ] UI: "Invite by QR + 6-digit code" sheet on CircleScreen
- [ ] Future: NFC tap-to-share via Capacitor plugin (per Backlog.md architecture)

### 3. Score Edge Function
- [ ] Postgres function `recompute_user_score(user_id)` aggregating from `score_events`
- [ ] Edge Function cron (5 min) calling it for active users
- [ ] On user activity (habit done, intake logged, focus session) → enqueue recompute
- [ ] Then `score.total / pillars / delta_7d` become genuinely live (currently honest-zero)

### 4. Production prep
- [ ] Cloud Supabase project + migration push
- [ ] Edge Function `llm-complete` so VITE_ANTHROPIC_API_KEY doesn't ship in the bundle
- [ ] App icon + splash screen
- [ ] Privacy policy + terms (markdown on GitHub Pages)
- [ ] Apple Developer account + first TestFlight build

## Resolved (recent)

### 2026-04-26 · Widgets UI Phase 1 — dynamic Home rendering
12-widget component registry at [web/src/components/widgets/index.tsx](../web/src/components/widgets/index.tsx) + `DynamicWidgetCanvas` in [HomeScreen.tsx](../web/src/screens/HomeScreen.tsx) that auto-seeds defaults via `widgets.reset` on first visit and re-renders on every DB write. AI `widgets.install` from Chat now produces a real widget on Home end-to-end.

### 2026-04-26 · Widget data layer
Migration `home_widgets` + 7-op `widgets` contract shipped in [195886c](https://github.com/NiKhilForCybersec/nik-app/commit/195886c). AI can already install widgets via Chat at the data level.

### 2026-04-26 · MoreScreen tile sub-text
5 lying tiles fixed (Brief / Diary / Focus / Score / Family Circle) — neutral capability subs replaced fake counts. Same commit.

### 2026-04-26 · Profile + score + vitals seed lies
All seeded "demo" values stripped — every visible metric now starts at honest 0 and only fills from real activity. Hydrate / Sleep are derived live; others await manual log or HealthKit.
