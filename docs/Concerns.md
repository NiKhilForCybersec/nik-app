# Concerns log

> Running list of concerns / instructions / things-to-fix the user has flagged in chat. Append to the top as they come in. Tick when resolved. **Never delete entries** — keep the history so future sessions can see what the user has cared about.

## How to use

When the user pastes a concern, instruction, or "remember this" note in chat:
1. Add an entry to the top of the **Open** section below
2. Include date (use the current `Today's date is YYYY-MM-DD` from system context), one-line summary, and a brief **Why** so future-Claude doesn't lose the rationale
3. When fixed/done, move to the **Resolved** section with a one-line "Fix:" + commit SHA when relevant
4. Don't delete resolved items — they form the audit trail

This file is auto-loaded into context at session start via the wiki + linked from MEMORY.md, so concerns survive context wipes.

---

## Open

### 2026-04-26 · WidgetsScreen needs full rebuild as AI-powered playground
Currently it's template content (placeholder copy, no real widget management). Required:
- `home_widgets` table + `widgets` contract (list/install/move/resize/configure/remove)
- WIDGET_TYPES registry — one component per type with configSchema (Zod)
- WidgetsScreen as a real **playground**: shows current Home widgets, library to pick from, drag-and-drop reordering, per-widget config form (auto-generated from schema)
- AI prompt input in WidgetsScreen — user types "add a recent intakes widget below hydration" → Chat-style LLM call → `widgets.install` → widget appears
- HomeScreen reads `widgets.list` and renders dynamically (replaces current static bento)
- Same widget render whether placed via UI or via AI Chat
- Granular per-widget config (size 1×1 / 2×1 / 1×2 / 2×2; show/hide elements; goal overrides)
- Widget contract exposed as `widgets.install` to the AI tool catalog so Chat works too
**Plan:** see `~/.claude/.../memory/project_widget_system_plan.md`. **Estimate:** full session, ~3-4 hours.

### 2026-04-26 · Family search across other users (multi-tenant invite)
Current `circle.add` only inserts rows in YOUR circle_members table — the "other person" doesn't know they're in your circle, doesn't share their data back. For real cross-account family:
- `circle_invites` table: { token, owner_user_id, expires_at, max_uses, accepted_by? }
- `circle.createInvite` → returns { token, qrPayload, code }
- `circle.acceptInvite({ token })` → links the two users bidirectionally
- UI: "Invite by code" + QR code display + "Enter code" input + (later) NFC tap-to-share
- Privacy: each side controls what categories they share with the other; default minimal, opt-in to expand
**Plan:** see [Backlog.md](Backlog.md#family-add-to-circle-tap-to-share-nfc--qr--code) — already exists with full architecture. **Estimate:** real session of work, ~3-5 hours.

### 2026-04-26 · MoreScreen tile sub-text is hardcoded
Examples: "Diary · 184 entries · last 2h ago", "Focus Mode · 50 min · deep · forest", "Nik Score · 742 · +28 this week", "Daily Brief · ~4 min · audio · today". All in `web/src/screens/MoreScreen.tsx` `CATEGORIES` config. **Fix:** either (a) replace with stable descriptive text ("audio · curated", "tracker", etc.) or (b) wire each tile to its corresponding op (diary.list count, score.get total, etc.) — option (b) is N more useOp calls on a single screen which is heavy; (a) is the pragmatic fix.

### 2026-04-26 · Streak (42 days), Nik Score (742), pillar values, profile stats — all still seeded
Same class of bug as the habit one. profile.streak / profile.xp / profile.level / profile.stats / score.total / score.delta_7d / score.pillars were seeded at signup to specific demo values so they appear live but are static. **Fix:** strip all "fake real" defaults from the profile + score seed; everything starts at 0/empty until real activity computes them. Score derivation needs the score Edge Function (Layer 2 of agent plan) to actually update from score_events.

### 2026-04-26 · Vitals tile still shows fake numbers (5240 steps + sine HR)
Already labelled "DEMO PREVIEW" but the values themselves are still hardcoded sine waves. Either: (a) zero them out until HealthKit ships, OR (b) compute lightly from existing tables (steps from events.list where source=apple-health, HR from sleep_nights.resting_hr). **Pragmatic for now:** option (a) — show "—" or "no data, connect HealthKit" instead of inventing numbers.

### 2026-04-26 · Family circle: no UI to add / remove members
The `circle.add` and `circle.remove` ops exist, AI can call them via Chat — but the CircleScreen has no `+` button or X-on-member affordance. **Fix:** add minimal UI for both. (User-search across other users' accounts is a separate multi-tenant feature requiring an invite flow — defer.)

### 2026-04-26 · NEED: AI-powered widget playground
Widgets system + dedicated playground page where Nik AI creates widgets on the fly via real LLM call. Two flows for picking: AI suggests + creates OR user manually picks from a library. Must be live, granular, controllable. **This is the project_widget_system_plan.md item — full session of work, saved to memory.**

### 2026-04-26 · Other habit tiles (Read, Sleep, Walk, Train, Meditate, Stretch) showing seeded values, not real activity
Same class of bug as the Hydrate one. Habits' `done` values were seeded at signup (Read 22/30, Sleep 7/7, Walk 5240/8000, Train 60/60, Meditate 0/10) so they LOOK live but are static demo numbers. **Fix:** start every habit at done=0 in seed (honest empty state). Where we have a real source (Sleep ← sleep_nights last night), derive on read like Hydrate does.

### 2026-04-26 · Settings → Widgets: not working, doesn't render dashboard values
WidgetsScreen exists but is template content. User expects: pick widgets in Settings, they live-resize and render the actual dashboard data. Tied to the project_widget_system_plan.md memory. **Fix is the widget system v1 build (from that plan) — not a small fix, real session of work.**

### 2026-04-26 · Source-of-truth mismatch: Home Hydrate (8/8) ≠ Hydration screen (4/8)
Home shows habit.done=8 (capped after auto-bumps), Hydration screen shows 4/8 (count of actual hydration_intakes rows today). Two screens, different denominators, both claiming to be the same metric. **Fix:** make the Hydrate widget on Home derive from hydration.today (single source of truth) so the ring drains correctly when intakes are removed/added.

### 2026-04-26 · Drift panel shows 134 issues (not 13 as I claimed)
My Drift panel browser-side regex must be over-flagging. Reconcile with `node scripts/check-wiring.mjs` which CI uses. **Fix:** align the in-browser drift logic with the CI script exactly.

### 2026-04-26 · Hundreds of hardcoded literals across screens
Hardcoded panel showed 21 last time, user reports hundreds. Likely my heuristic missed a class. Re-tune with stricter "value vs UI text" detection.

### 2026-04-26 · Graph appears hardcoded — not actually live
User suspects the graph is showing static data. **Verify:** the graph should re-render when ops are called (it does via onOpCalls listener) but doesn't show file-change updates. Add HMR-driven re-render. Display last-update timestamp visibly.

### 2026-04-26 · NEED: parallel review agents for each dev skill
"There should be auto agents which trigger along with you writing the code — one for registry, one for database, one for drift — running parallel checks of the code base changes and what's happening." Build a watcher process (Vite plugin or standalone) that runs registry-check + db-schema-check + drift-check + hardcoded-scan + manifest-validation continuously, emits findings to a Watcher panel in dev console. **Why:** static analysis at commit-time is too late; real-time agents catch it as code lands.

### 2026-04-26 · Graph nodes confusingly named — APP vs NIK vs AI · CHAT
"NIK" reads as the AI assistant (which it is in-product) but in the graph it's the master app node. "AI · CHAT" is the actual AI surface. Rename: app master → "APP", AI super-node → "NIK" (the character). **Why:** the user's mental model puts Nik=AI, not Nik=app shell.

### 2026-04-26 · Graph all grey, nothing colored
Health colors only render when ops have been called this session (in-memory ring buffer). Fresh reload → everything dashed-gray "untested." Untested isn't a failure state — should default to neutral kind-color, only grey out when KNOWN-broken. **Why:** the panel looks broken on first load.

### 2026-04-26 · Dev console needs a standalone window
Right now /dev is inside the app — every time you open it you lose the screen you were on. Should be a separate URL/window so you can have the app + dev console side-by-side without navigating away. Same Vite dev server, dedicated entry. **Why:** can't watch the app behave while inspecting it.

### 2026-04-26 · More hardcoded literals across other screens
Hardcoded panel finds 21 suspicious literals in 6 screens (Sleep · 8, Onboard · 7, Fitness · 2, Focus · 2, Profile · 1, Stats · 1) — and likely more once those are reviewed and the false-positive list refines. Sweep all to 0. **Why:** "i need it to be very perfect from the starting stages."

### 2026-04-26 · Home dashboard still has hardcoded text / fake metrics
Audit revealed several hardcoded items the live-data sweep missed: **(a)** hydration tile showing 10/8 (auto-bump exceeds target), **(b)** family pulse line "Kiaan finished homework · Meera added groceries", **(c)** diary preview "Long morning, finally", **(d)** GPS smart card "You're near Nature's Basket", **(e)** live vitals (steps/HR/kcal) are fake sine-wave animations on top of seeded numbers (no HealthKit), **(f)** Focus card "Nik suggests 50 min · deep" is a hardcoded string. **Why:** the user wants nothing on Home that isn't sourced from real DB ops. Each of these needs a contract or a "no data yet" empty state. Also: streak / score / pillar trends *appear* live but the values are seed-defaults — real values require activity-derived computation (handled by the score Edge Function, not built yet).

### 2026-04-26 · UI wiring drift — wrong navigation destinations
Clicking the Hydrate tile on Home navigates to `/habits` (the generic Habits screen) instead of `/hydration` (the dedicated screen). Probably similar miswirings on Sleep / Train / Read / Walk / Meditate tiles. **Why:** as we add new screens, existing on-tap handlers don't know about them and route to a default. Generic problem, not a one-off — needs a navigation registry + dev-console drift panel.

### 2026-04-26 · Home widget ↔ dedicated screen data mismatch
The Hydrate tile on Home shows "8/8 glasses" (from habits table) while the Hydration screen shows ml total + intake history. They should be the same source-of-truth. **Why:** keeps the user's mental model consistent — "what I see on Home is what I see on the screen."

### 2026-04-26 · Generic widget richness
Each Home widget tile should be rich, granular, controllable. User should be able to add/remove/configure widgets via UI AND chat — same render either way. Captured in detail in `~/.claude/.../memory/project_widget_system_plan.md`. **Why:** Home is the daily anchor; needs to feel custom not template.

### 2026-04-26 · Autonomous agent (24/7 loop)
Nik should be a real agent: scheduler, monitoring, knowledge-fresh, "I don't know" honesty, knows boundaries (level/xp/streak are derived not user-set). Layer 1 (mutability tags) ✅ shipped. Layers 2 (scheduler) + 3 (knowledge bundle) pending. Captured in detail in `~/.claude/.../memory/project_autonomous_agent_plan.md`. **Why:** the difference between a chat assistant and an agent.

### 2026-04-26 · Dev console must be plugin-extractable
This dev console (registry + DB + drift + LLM + activity + graph) should later become a connector / agent / npm package other projects can plug in. Build with that lift in mind — keep it modular, keep paths self-contained. **Why:** novel architectural piece worth open-sourcing.

### 2026-04-26 · No mock data anywhere visible to the user
Every visible screen must show live data. SOON tiles must become real. This is non-negotiable for the TestFlight push. **Why:** "i need it to be very perfect from the starting stages."

### 2026-04-26 · OAuth deferred to v2 (not a bug, just a reminder)
Email/password only for v1. AuthScreen has SOON-badged Google/Apple/SAML. Saved as a memory; don't enable unless asked. **Why:** ship v1 fast.

---

## Resolved

### 2026-04-26 · MockLLM in chat → real Anthropic Claude
Was using regex-pattern fallback. Now talks to real api.anthropic.com with OpenAI fallback. Fix: [48bb051](https://github.com/NiKhilForCybersec/nik-app/commit/48bb051).

### 2026-04-26 · AI couldn't actually mutate Nik's data
Tool catalog wasn't passed to LLM. Now full registry exposed; verified habits.create + quests.create + ui.switchTheme via chat. Fix: [23ca640](https://github.com/NiKhilForCybersec/nik-app/commit/23ca640).

### 2026-04-26 · Registry collision dropped 18 ops silently
Spread-merge of contracts overwrote same-name keys (every namespace has `list`/`get`/`create`). Fix: keyed by full dotted name, throws on duplicates. Catalog jumped 28 → 47+. [23ca640](https://github.com/NiKhilForCybersec/nik-app/commit/23ca640).

### 2026-04-26 · Mock data in 4 last screens (Home/Profile/Quests/Chat) + circle.ts
profile + quests contracts built; chat persistence shipped; circle migration; data/circle.ts deleted. Fix: [1af80ab](https://github.com/NiKhilForCybersec/nik-app/commit/1af80ab), [5b0328f](https://github.com/NiKhilForCybersec/nik-app/commit/5b0328f).

### 2026-04-26 · "All those SOON labels"
30 of 33 SOON tiles are now real screens (Phase A items contract + 27 wrapper screens + Hydration). 3 SOON remain: cycle, calendar, [hydration was just done, removing]. Fixes: [c8e9411](https://github.com/NiKhilForCybersec/nik-app/commit/c8e9411), [a893f91](https://github.com/NiKhilForCybersec/nik-app/commit/a893f91), [91c5585](https://github.com/NiKhilForCybersec/nik-app/commit/91c5585).

### 2026-04-26 · AI tries to set derived fields (level=50)
Mutability layer added; AI catalog hides derived writes; system prompt explicitly refuses with redirect to logging activity. Fix: [3089686](https://github.com/NiKhilForCybersec/nik-app/commit/3089686).
