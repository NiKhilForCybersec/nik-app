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
