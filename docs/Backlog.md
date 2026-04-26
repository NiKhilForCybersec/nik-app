# Backlog

What's NOT done. Roughly ordered by likely-next.

## Just shipped (for context)

- ✅ Operations + Commands registry ([[Registry]])
- ✅ Supabase local stack + Habits end-to-end
- ✅ MCP server skeleton at `packages/mcp-nik/`
- ✅ CommandBus for AI-dispatched UI mutations
- ✅ GitHub repo + CI (type-check + build + wiring-check)
- ✅ Per-screen redesigns: Circle, Family Ops, Couple, Kids, Home, Habits, MoreScreen, ComingSoonScreen
- ✅ Per-screen `manifest.ts` pattern + CI verifier (no wiring breaks)
- ✅ `LLMProvider` + `LLMRouter` (SLM-ready) — ChatScreen flows through it; tool calls dispatch through CommandBus (verified: "switch to ghibli theme" flips theme live)
- ✅ `scheduled_intents` + `user_memories` tables + RLS + `intents_tick()` RPC + `intents-tick` Edge Function (the "in 2 weeks remind me X" infrastructure)
- ✅ `intents.schedule / list / cancel` + `memory.save / list / archive` ops in registry

## Near-term (next sprint or two)

### Migrate remaining 20 screens to the registry
Habits is wired end-to-end. Apply the same pattern to: Score, Diary, Family Circle, Family Ops, Meds, Sleep, Money, Brief, Vault, Errands, Couple, Kids, Focus, Fitness, Profile, Settings, Quests, Stats, Widgets, Chat. One PR each, mechanical.

### Per-screen `manifest.ts` + ESLint enforcement
Each screen declares its `reads`, `writes`, `mutations`, `permissions`. Custom ESLint rule fails the build if a screen calls an op not in its manifest. The registry becomes provably consistent.

### dependency-cruiser config
Forbid cross-feature imports. `features/habits/**` may not import `features/score/**`. Codified in `.dependency-cruiser.cjs`, enforced in CI.

### MCP server in production
Right now MCP runs locally as stdio for testing. Move to:
- HTTP transport (Anthropic Messages API `mcp_servers` param)
- Per-user OAuth bearer (so tools run with the user's identity, RLS works)
- Streamable responses

### AI-driven UI commands actually work
Wire the realtime channel: MCP server → Postgres `pending_commands` table → Supabase realtime → device → CommandBus → executed. Then the AI can say "open habits" and the device navigates.

### Auth UI (login + onboarding)
Currently auto-signs-in as a seeded dev user. Real flow:
- Google OAuth via Supabase Auth (enable in `supabase/config.toml`)
- Magic link fallback
- Wire `OnboardScreen` to actual permission requests + identity creation

### Family add-to-circle: tap-to-share (NFC + QR + code)

When two phones are near each other, sender taps "Invite to family" → tap their phones together (NFC) → other phone shows "Add Arjun's family?" → accept → joins the circle. Three fallback layers so it always works:

| Layer | Plugin | Works on |
|---|---|---|
| 1. NFC tap | `@capacitor-community/nfc` | iOS 13+ (read), Android HCE |
| 2. QR scan | `@capacitor-mlkit/barcode-scanning` | every device with a camera |
| 3. 6-digit code | none, just text input | every device, even cracked screens |

Server side (Supabase):
- `circle_invites(token, owner_user_id, expires_at, max_uses, uses)` table
- `circle.createInvite()` → returns `{ token, qrPayload, code }`
- `circle.acceptInvite({ token })` → adds inviter as a circle member, marks token used
- TTL = 5 min, single-use, rate-limited per owner

UI:
- New "Invite a family member" CTA on Circle screen + Settings
- Sheet with all three options visible (NFC pulse animation, QR code, big 6-digit code)
- Receiver-side: `nik://invite?t=...` deep link OR scan-from-camera flow

### Add Android target
```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
```
Should "just work" — same web bundle. Test theme rendering on Material You light/dark.

### Bottom-sheet modals
The prototype has rich modal sheets that are deferred:
- `circle-sheets.jsx` — member detail, privacy editor, view log (currently inlined into `CircleScreen.tsx`)
- `meds-sheets.jsx` — add med, AI med chat, med detail
- `diary-sheets.jsx` — compose entry, view entry detail

Port these into `web/src/components/sheets/` as proper modals. Use `framer-motion` for slide-in transitions (already installed).

### State persistence
Nothing survives an app restart. Add `@capacitor/preferences` for simple key-value, or `@capacitor-community/sqlite` for relational. Persist:
- Selected theme, density, fontPair
- Onboarding-complete flag
- Optimistic mutations queued for sync

### Capacitor plugins for the device features the design demos
| Feature | Plugin | Required by screens |
|---|---|---|
| Geolocation + geofencing | `@capacitor/geolocation` | Home, Errands, Brief, FamilyOps |
| Push notifications | `@capacitor/push-notifications` | Toast, Brief, Meds reminders |
| Camera | `@capacitor/camera` | Diary, Meds (Rx scan), Vault |
| Calendar | `@capacitor-community/date-picker` (or native cap module) | Brief, FamilyOps |
| HealthKit (iOS) | `capacitor-health-kit` (community) | Habits (steps/sleep), Sleep, Fitness |
| Health Connect (Android) | `capacitor-health-connect` (community) | same |
| Microphone | `@capacitor-community/speech-recognition` | Chat, VoiceOverlay |
| Local notifications | `@capacitor/local-notifications` | Meds, Focus alarms |

## Mid-term

### Integrations as MCP servers (the killer use case)

See [[Integrations]] for the full plan. Phasing:

| Phase | Server | Why this order |
|---|---|---|
| Phase 2 | `nik-mcp-healthkit` | On-device, no OAuth complexity, immediate value for Habits/Sleep/Fitness |
| Phase 2 | `nik-mcp-calendar` | Cheapest external win — Brief screen lights up |
| Phase 3 | `nik-mcp-gmail` | The unlock — movie tickets, bills, birthdays auto-surface |
| Phase 4 | `nik-mcp-whatsapp` + `nik-mcp-messages` | Family Circle becomes alive |
| Phase 5 | `nik-mcp-spotify`, `nik-mcp-photos` | Polish |

Each server is its own deployable. Per-user OAuth tokens encrypted. Per-server permission toggles in app settings.

### AI-everywhere UX (in-app Nik AI)

Currently the AI lives in the Chat screen. Expand to:
- Long-press any widget → "ask Nik about this"
- Per-screen "AI assist" button (top-right of every screen header)
- Context-aware suggestions surface as the user moves between screens
- Voice orb reachable from any screen (already exists in shell, expand triggers)

### Backend
No server yet. Need:
- **Auth** — email + magic link or social. Likely Supabase or Clerk for speed.
- **API** — REST or GraphQL. tRPC if both client and server are TS. Hono on Cloudflare Workers is the lightweight pick.
- **Database** — Postgres (Supabase / Neon / RDS). Schema sketched in [[Data Model]].
- **Privacy enforcement** — circle sharing matrix MUST be server-enforced via row-level security (Postgres RLS or app-layer middleware). See [[Decisions]] for proposed model.
- **Sync** — optimistic local mutations + server reconciliation. Replicache or pure mutation queue.
- **AI chat** — Claude API for the chat screen. Stream tokens via SSE. Calendar moves / quest creation are tool-calls.

### Real screens (vs mock data)
Each screen currently reads from `MOCK` constants. When backend lands, swap to `useQuery` or similar (TanStack Query is the standard pick — already used by 90% of React apps for data layer).

### Onboarding
The prototype has an `OnboardScreen` that walks through 8 steps. Currently navigates to home on done but doesn't actually request permissions or persist anything. Wire up:
- Real Capacitor permission requests at the right step
- Save user profile to backend
- Mark onboarding-complete in `Preferences`

### Tests
None yet. Add:
- Vitest + React Testing Library for component tests
- Playwright for E2E in Chrome (works via Vite dev server)
- Native iOS/Android E2E later via Maestro or Detox if sketchier flows accumulate

## Longer-term / "would be nice"

### Custom font self-hosting
Google Fonts CDN works in dev but adds CDN dependency for production / weak network. Switch to `@fontsource/inter`, `@fontsource/fraunces`, etc. Preload in HTML.

### Animations pass
`framer-motion` is installed and unused. CSS keyframes (`fade-up`, `breathe`, `wave-bar`, `xp-fill`, `orb-rotate`, `orb-pulse`) handle most motion already. But for tab transitions, sheet slide-ins, screen swipes — Framer is the right tool.

### Code splitting
Current bundle is 482KB / 122KB gzipped. Acceptable for a launch screen. When we add backend + libs, split per-screen with `React.lazy` and Vite's dynamic import.

### Real router
React Router 7 is installed. When deep linking matters (e.g. `nik://family/meera/health`), swap the state-machine for routes.

### Offline mode
Prototype shows `OfflineBanner` but it's only triggered manually. Wire up real network detection via `@capacitor/network`. Queue mutations locally with IndexedDB or SQLite.

### Performance
First-render is instant (compiled bundle). But the score detail screen has a lot of SVG charts — measure with React Profiler if it gets sluggish.

## Won't-do (intentional)

- **Pixel-perfect parity with the original Claude.ai design preview**. The design's 100% there in the prototype — we ported it as-is. If the design changes, change the JSX, not the architecture.
- **Server-side rendering**. We're a webview app, not a web app. SSR adds complexity for zero benefit here.
- **Native rewrites**. Both RN and pure native were considered and rejected — see [[Decisions/001 — Capacitor over React Native]].

## Related

- [[Architecture]]
- [[Data Model]]
- [[Decisions]]
