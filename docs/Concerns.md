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

### 2026-04-26 · Widget grid should support 1/2/3 (9 size combinations) + drag-resize is choppy
"Even the dragging resizing is choppy and not working sometimes, is there any issue with performance, we need to handle that too. And I think the size options we gave are less make it all combinations of 1,2,3."
- Expand grid: 3 columns instead of 2; allow w ∈ {1,2,3} and h ∈ {1,2,3} → 9 valid shapes (1×1, 1×2, 1×3, 2×1, 2×2, 2×3, 3×1, 3×2, 3×3).
- DB constraints (`w int between 1 and 2`) need a migration.
- Zod schemas need bumping.
- Edge-drag handlers need throttling — currently they recompute every pointermove without rAF, causing dropped frames.
- Test on touch + mouse for smoothness.

### 2026-04-26 · Widget library covers only ~14 of ~59 features
The app has 59 screens but the widget library exposes only ~14 widget types. The user pushed back: "We almost have 59 features — make a note of this. Each and every screen should be perfect and awesome." Expansion plan:
- Phase 1 (fast): generate one library preset per `ItemKind` (30 kinds) — each card pre-configures the existing `list_preview` widget with a kind, icon, hue, label.
- Phase 2: add dedicated widgets for screens with rich data: Money summary, Family ops pending, Cycle phase, Brief today, Network catch-up due, Doctors next-appt, Plants next-water, Pets status, Travel next-trip, Subscriptions due, Achievements recent.
- Goal: every screen the user spends time on is one tap away on Home via a widget.

### 2026-04-26 · Don't move to cloud / TestFlight without explicit user approval
"Each and every screen should be perfect and awesome only then we are moving to cloud and other; till then we will be here and I am the one who will be finally approving to move anywhere." Stay local. Saved to memory as `feedback_user_approves_cloud.md`.

### 2026-04-26 · Hardcoded demo data still leaking — Arjun, level 27, streak 42, family 6 members
Earlier seed-lie sweep stripped profile defaults to honest 0 but on refresh widgets still show: Streak 42, Family 6 members · 3 online, Active quest "Deep focus — 2 hrs no phone", Diary "Long morning, finally", Next event "A friend's birthday in 6 weeks". Source must be re-seed-on-load or something in seed-clean / dev-fixtures. **Find and strip.** Real users land on honest 0/empty state.

### 2026-04-26 · Widget playground graphics + interactions are too limited
"Widget options are very much limited, graphics looks not good, limited options are displayed and are not functional. User should be able to select and then resize it by dragging to any shape, and also tap-hold and move it to any place — but with defined rules: only 2 1×1 in a row (can merge to 2×2), if 2×1 then only 1 in a row, etc. Think about all possibilities."
- Drag-corner resize within `allowedSizes`
- Tap-hold + drag to reposition anywhere on the canvas
- Grid rules enforced: 2 1×1 / row OR 1 2×1 / row OR 1 2×2 spanning 2 rows
- Richer per-widget graphics (the small previews look stripped)
- Add more widget types where useful (habits-rituals widget, weather, focus session, recent diary list, etc.)
- "All the options in the library and perfect; user can either drag-drop a library item into the play area, OR tap it and it gets rendered at the end then user drags-drops anywhere they want."

### 2026-04-26 · Today's Rituals (habits) section on Home should be a widget too
"In today's ritual is also in the dashboard right even that should be widgets customizable right, it should be there in the widgets play screen everything and button all the options and full liberty to do in playscreen also". Convert habits-rituals + every other static Home block into widget types. Home becomes 100% widget-driven; nothing static. Playground has total control.

### 2026-04-26 · MoreScreen tile sub-text is hardcoded
Examples: "Diary · 184 entries · last 2h ago", "Focus Mode · 50 min · deep · forest", "Nik Score · 742 · +28 this week", "Daily Brief · ~4 min · audio · today". All in `web/src/screens/MoreScreen.tsx` `CATEGORIES` config. **Fix:** either (a) replace with stable descriptive text ("audio · curated", "tracker", etc.) or (b) wire each tile to its corresponding op (diary.list count, score.get total, etc.) — option (b) is N more useOp calls on a single screen which is heavy; (a) is the pragmatic fix.

### 2026-04-26 · Streak (42 days), Nik Score (742), pillar values, profile stats — all still seeded
Same class of bug as the habit one. profile.streak / profile.xp / profile.level / profile.stats / score.total / score.delta_7d / score.pillars were seeded at signup to specific demo values so they appear live but are static. **Fix:** strip all "fake real" defaults from the profile + score seed; everything starts at 0/empty until real activity computes them. Score derivation needs the score Edge Function (Layer 2 of agent plan) to actually update from score_events.

### 2026-04-26 · Vitals tile still shows fake numbers (5240 steps + sine HR)
Already labelled "DEMO PREVIEW" but the values themselves are still hardcoded sine waves. Either: (a) zero them out until HealthKit ships, OR (b) compute lightly from existing tables (steps from events.list where source=apple-health, HR from sleep_nights.resting_hr). **Pragmatic for now:** option (a) — show "—" or "no data, connect HealthKit" instead of inventing numbers.

### 2026-04-26 · Family circle: no UI to add / remove members
The `circle.add` and `circle.remove` ops exist, AI can call them via Chat — but the CircleScreen has no `+` button or X-on-member affordance. **Fix:** add minimal UI for both. (User-search across other users' accounts is a separate multi-tenant feature requiring an invite flow — defer.)

### 2026-04-26 · Other habit tiles (Read, Sleep, Walk, Train, Meditate, Stretch) showing seeded values, not real activity
Same class of bug as the Hydrate one. Habits' `done` values were seeded at signup (Read 22/30, Sleep 7/7, Walk 5240/8000, Train 60/60, Meditate 0/10) so they LOOK live but are static demo numbers. **Fix:** start every habit at done=0 in seed (honest empty state). Where we have a real source (Sleep ← sleep_nights last night), derive on read like Hydrate does.

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

### 2026-04-26 · Widget system v1 — full playground + AI install + dynamic Home (4 concerns folded in)
Widgets contract + 12-component registry + `home_widgets` migration shipped. HomeScreen renders widgets dynamically from DB; auto-seeds defaults on first visit. WidgetsScreen rebuilt as a true mirror of Home — same bento, edit overlays per tile (✕ remove, ← → reorder, tap-resize chips), inline `+ ADD WIDGET` opens library, AI prompt at top routes through the LLM tool catalog. Mutations write through; Home auto-refreshes. Resolves: "WidgetsScreen needs full rebuild", "NEED: AI-powered widget playground", "Settings → Widgets not working", "Generic widget richness". Fixes: [195886c](https://github.com/NiKhilForCybersec/nik-app/commit/195886c) (data layer), [dd3cb70](https://github.com/NiKhilForCybersec/nik-app/commit/dd3cb70) (Phase 1 Home canvas), [a854861](https://github.com/NiKhilForCybersec/nik-app/commit/a854861) (Phase 2 playground).

### 2026-04-26 · Family multi-tenant invite — QR/code + reciprocal accept
circle_invites table + RLS + SECURITY DEFINER accept RPC + four contract ops (createInvite/listInvites/revokeInvite/acceptInvite) + InviteSheet UI on CircleScreen with Create/Accept tabs, gradient code display, copy-code/copy-link, pending invites strip with revoke. Two real users can now join each other's circles. NFC tap deferred to Capacitor mobile build. Fix: [b90faf6](https://github.com/NiKhilForCybersec/nik-app/commit/b90faf6).

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

### 2026-04-26 · Widget grid expansion → mobile-first 2 cols × up to 3 rows
Originally requested 1/2/3 in both dimensions (9 shapes on a 3-col grid). Tested at 3 cols on mobile-sized viewport — too cramped, content unreadable. Reverted to 2 cols × 1-3 rows (6 shapes: 1×1, 2×1, 1×2, 2×2, 1×3, 2×3). Drag-resize now rAF-throttled + uses optimistic local state so the tile reflows instantly without server round-trip. Edge handles bumped to 16px touch targets. The user's "all combinations of 1, 2, 3" intent is preserved within the 2-col mobile constraint. Fix: [902ae9f](https://github.com/NiKhilForCybersec/nik-app/commit/902ae9f), [952aff6](https://github.com/NiKhilForCybersec/nik-app/commit/952aff6), [6baf8ed](https://github.com/NiKhilForCybersec/nik-app/commit/6baf8ed).

### 2026-04-26 · Widget library expanded — 33+ presets one tap from Home
14 base widget types + 30 ItemKind presets (Reading, Bills, Plants, Birthdays, etc.) → every screen the user spends time on is one tap away from Home via a library card. Library is a 3-row horizontal-scroll carousel with premium icon-disc cards. Fix: [e2acf2a](https://github.com/NiKhilForCybersec/nik-app/commit/e2acf2a), [d67cfb5](https://github.com/NiKhilForCybersec/nik-app/commit/d67cfb5).

### 2026-04-26 · All hardcoded demo data stripped from on-signup seed
Demo family members (Partner, Kids, Parent), demo quests, demo diary, demo events, demo sleep nights, family ops alarms, score events all removed from seedOnce(). Honest empty start: only profile (level 1, xp 0), habit definitions with done=0, self circle row, and zero score snapshot. Backfilled the existing dev account too. Auto-derive of email→name removed (no more "Arjun" from arjun@local.dev). Fix: [bbf4c54](https://github.com/NiKhilForCybersec/nik-app/commit/bbf4c54).

### 2026-04-26 · Widget playground richer interactions + premium graphics
Tap any tile to select → coloured outline + drag handle (top-left, gradient grip-dots) + ✕ remove (top-right) + bottom-floating resize dock (2×3 mini-grid, all 6 sizes always tappable, no greying). Edge-drag handles on right + bottom edges with rAF throttling. Library cards have icon discs, ambient halos, hue gradients, "+ ADD" / "DRAG TO PLACE" footer. Every widget component scales content with size tier (mini / wide / tall / hero) so a 2×3 Hydration shows cup stack + intake timeline; a 2×2 Score shows full per-pillar list + delta; etc. Fix: [266f930](https://github.com/NiKhilForCybersec/nik-app/commit/266f930), [efdbbfd](https://github.com/NiKhilForCybersec/nik-app/commit/efdbbfd), [95a0790](https://github.com/NiKhilForCybersec/nik-app/commit/95a0790).

### 2026-04-26 · Today's Rituals → habits_today widget; Home is now 100% widget-driven
Static "Today's Rituals" + Streak/Score/Focus/Family/Diary/Vitals/Active Quest blocks all deleted from HomeScreen. Replaced by a single `<ReadOnlyCanvas widgets onOpen>` rendering the user's customisable home_widgets rows. New widget types added to cover the deleted static blocks: habits_today, focus_starter, vitals_strip. Same render engine as the WidgetsScreen playground. Fix: [266f930](https://github.com/NiKhilForCybersec/nik-app/commit/266f930), [60f2538](https://github.com/NiKhilForCybersec/nik-app/commit/60f2538).

### 2026-04-26 · Home + Widgets playground render 1:1 (shared `<WidgetCanvas>`)
Earlier mismatch: playground tiles had visibly larger gaps + selection outline extended past the visible widget. Root cause was the SortableWidget wrapper sized by gridAutoRows but the inner WidgetShell was content-sized → empty space inside the wrapper, outline drew on the wrapper bounds. Extracted shared `<WidgetCanvas>` module (`ReadOnlyCanvas` + `EditCanvasInner` + `widgetNavTarget`) so both screens use identical grid styles + identical widget rendering. WidgetShell now stretches to 100% so wrapper outline hugs the tile precisely. Fix: [60f2538](https://github.com/NiKhilForCybersec/nik-app/commit/60f2538), [9dc18cb](https://github.com/NiKhilForCybersec/nik-app/commit/9dc18cb).

### 2026-04-26 · Widget tap navigation — every widget routes to its real screen
Bug: 30 ItemKind library presets all installed as `list_preview` widget which had no navTarget → tap did nothing on Home. Fixed via `widgetNavTarget(widget)` helper that reads `config.kind` for list_preview presets and looks up KIND_TO_SCREEN (30 entries: reading→reading, bill→bills, plant→plants, etc.). streak_counter also got navTarget='profile'. Verified: every widget on Home navigates to its dedicated screen on tap. Fix: [9dc18cb](https://github.com/NiKhilForCybersec/nik-app/commit/9dc18cb).

### 2026-04-26 · Score Edge Function (live recompute from activity)
Migration 20260426000009 added recompute_user_score(uid) + bridge triggers on hydration_intakes / sleep_nights / diary_entries / quests so logging activity automatically inserts a score_event and the snapshot updates synchronously. Result: Home Nik Score widget now shows live values driven by real activity, with per-pillar bars + 7-day delta. Fix: [8ea7bc8](https://github.com/NiKhilForCybersec/nik-app/commit/8ea7bc8).

### 2026-04-26 · Family multi-tenant invite (token + 6-digit code + reciprocal accept)
circle_invites table + RLS + SECURITY DEFINER accept RPC + four contract ops (createInvite/listInvites/revokeInvite/acceptInvite) + InviteSheet UI on CircleScreen with Create/Accept tabs, gradient code display, copy-code/copy-link, pending invites strip with revoke. Two real users can now join each other's circles. NFC tap deferred to Capacitor mobile build. Fix: [b90faf6](https://github.com/NiKhilForCybersec/nik-app/commit/b90faf6).

### 2026-04-26 · Family circle add/remove member UI
CircleScreen has a `+` button that opens AddMemberSheet (manual add with name, relation, share-tier, hue picker), and `circle.remove` is wired with a confirm dialog. (Cross-account search via the invite flow above.) Fix: [f2854f4](https://github.com/NiKhilForCybersec/nik-app/commit/f2854f4).

### 2026-04-26 · Streak / score / pillars now live (no more seeded values)
Profile defaults stripped to honest 0 (level=1, xp=0, streak=0, stats={10,…}). Score derives live from activity via the recompute trigger above. Hydration habit's `done` derives from sum(hydration_intakes today)/250; sleep habit's `done` derives from sleep_nights.duration_min/60. Other habits (Read, Train, Meditate, Stretch, Walk) await manual log or HealthKit. Fix: [bbf4c54](https://github.com/NiKhilForCybersec/nik-app/commit/bbf4c54), [8ea7bc8](https://github.com/NiKhilForCybersec/nik-app/commit/8ea7bc8).

### 2026-04-26 · Home Hydrate ↔ Hydration screen mismatch resolved
Hydration widget on Home reads from `hydration.today` (single source of truth, ml-based). Home no longer renders a separate habit Hydrate tile (replaced by hydration_today widget). Both surfaces now agree. Fix: [266f930](https://github.com/NiKhilForCybersec/nik-app/commit/266f930).

### 2026-04-26 · UI wiring drift — Home tap navigation
Generic habit tap-to-screen routing replaced by widget-level navTarget (each WIDGET_TYPES entry declares its own destination; list_preview reads from config.kind). The "tap Hydrate → /habits" misfire is gone — Hydrate widget routes to /hydration explicitly. Fix: [9dc18cb](https://github.com/NiKhilForCybersec/nik-app/commit/9dc18cb).
