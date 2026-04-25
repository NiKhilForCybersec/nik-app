# Backlog

What's NOT done. Roughly ordered by likely-next.

## Near-term (next sprint or two)

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
