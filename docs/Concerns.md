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
