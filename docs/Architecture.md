# Architecture

## The picture

```
   ┌──────────────────────────────────────────────────────────┐
   │                     iOS / Android device                 │
   │  ┌────────────────────────────────────────────────────┐  │
   │  │              Capacitor native shell                │  │
   │  │  (App.app on iOS, .apk on Android)                 │  │
   │  │                                                    │  │
   │  │  ┌────────────────────────────────────────────┐    │  │
   │  │  │   WKWebView / WebView                      │    │  │
   │  │  │                                            │    │  │
   │  │  │   loads dist/index.html ⤵                  │    │  │
   │  │  │     └ /assets/index-*.js                   │    │  │
   │  │  │       (compiled React 19 + TS bundle)      │    │  │
   │  │  │                                            │    │  │
   │  │  │   App.tsx                                  │    │  │
   │  │  │     ├ ThemeProvider (CSS vars)             │    │  │
   │  │  │     ├ TabBar                               │    │  │
   │  │  │     ├ <renderScreen() switch>              │    │  │
   │  │  │     │   ├ HomeScreen                       │    │  │
   │  │  │     │   ├ ChatScreen                       │    │  │
   │  │  │     │   ├ HabitsScreen ... 21 total        │    │  │
   │  │  │     ├ Toast (notifications)                │    │  │
   │  │  │     └ VoiceOverlay (when listening)        │    │  │
   │  │  └────────────────────────────────────────────┘    │  │
   │  │                                                    │  │
   │  │  Capacitor plugins (later):                        │  │
   │  │    @capacitor/geolocation, push-notifications,     │  │
   │  │    camera, preferences ...                         │  │
   │  │    HealthKit / Health Connect (community plugins)  │  │
   │  └────────────────────────────────────────────────────┘  │
   └──────────────────────────────────────────────────────────┘
```

## Layers

### 1. The web app — `web/`

A real Vite + React 19 + TypeScript SPA. Entry: `web/src/main.tsx` → `App.tsx`.

- **Entry HTML** (`web/index.html`) loads Google Fonts and mounts `<div id="root">`.
- **Root** (`web/src/App.tsx`) holds a single `useState<AppState>` with `{ screen, theme, intensity, density, fontPair, persona, listening, notifVisible, ... }`. It renders the active screen via a `switch (state.screen)` block. No router yet — see [[Decisions/003 — State machine instead of router]].
- **Theme system** ([[Themes]]) applies the current theme by writing CSS custom properties to `:root` — switching themes is a re-render-free CSS-var update.
- **Screens** (`web/src/screens/<Name>Screen.tsx`) are default-exported React components taking a common `ScreenProps` (see [[Data Model]]).
- **Primitives** (`web/src/components/primitives.tsx`) house Ring, XPBar, Avatar, Chip, VoiceOrb, Waveform, Toast, etc. — design-system parts.
- **Shell** (`web/src/components/shell.tsx`) houses TabBar, VoiceOverlay, OfflineBanner, EmptyState, SkeletonScreen.
- **Icons** (`web/src/components/icons.tsx`) — `~60` SVG line icons exported as `I.water`, `I.book`, etc.

### 2. The native shell — `ios/`

Standard Capacitor 8 iOS project. Don't edit by hand — `npx cap sync ios` regenerates the relevant bits and copies the latest `dist/` into `ios/App/App/public/`.

The webview loads `index.html` from the bundled `public/` folder at app launch. No runtime download of code (Apple-store compliant).

### 3. The build — `dist/`

Vite output (`tsc -b && vite build`). Contains:
- `index.html` (entry, ~1KB)
- `assets/index-*.js` (compiled bundle, ~480KB raw / 120KB gzipped)
- `assets/index-*.css` (compiled CSS, ~7KB / 2KB gzipped)
- `favicon.svg`, `icons.svg`

Capacitor's `webDir` in `capacitor.config.json` points here.

## What's IN the architecture (running today)

- **Supabase local** (Postgres + Auth + RLS + Realtime + Storage) at `127.0.0.1:54321` via Colima.
- **4 tables**: `profiles`, `habits`, `scheduled_intents`, `user_memories`. All RLS-protected, all CRUD via the registry (`useOp`/`useOpMutation`).
- **Operations + Commands registry** at [`web/src/contracts/`](../web/src/contracts/). Single source of truth for backend ops + UI commands.
- **Per-screen manifests** at `web/src/screens/<Name>Screen.manifest.ts` — declare what each screen reads/writes/dispatches/needs. CI wiring-check job fails the build on drift.
- **MCP server** at [`packages/mcp-nik/`](../packages/mcp-nik/) — auto-registers every operation + command as MCP tools.
- **LLM router** at [`web/src/lib/llm/`](../web/src/lib/llm/) — abstract `LLMProvider` interface, classifier-based router, mock + Anthropic implementations. Future on-device SLM is one new file.
- **CommandBus** at [`web/src/lib/useCommand.tsx`](../web/src/lib/useCommand.tsx) — AI-dispatched UI mutations.
- **Cron worker** at [`supabase/functions/intents-tick/`](../supabase/functions/intents-tick/) — fires scheduled intents on schedule.

## What's NOT in the architecture (yet)

- **Auth UI** — auto-signs-in as a seeded dev user. Real Google OAuth is on the backlog.
- **No state management library** (Redux, Zustand, etc). Single useState in `App.tsx` is enough so far. Will add Context or Zustand when we have async data + sync.
- **No router** — the prototype's state-machine pattern carried over. React Router 7 is installed but unused.
- **No testing** yet. RTL + Vitest would be the natural picks; will add when shipping non-mock features.

## Adjacent / abandoned

- `www/` — the original Babel-in-browser prototype that was the first Capacitor wrap. Kept for visual reference. See [[Decisions/002 — Vite over Babel-in-browser]].
- `rn-port-archive/` — an aborted React Native port. See [[Decisions/001 — Capacitor over React Native]].

## Related notes

- [[Build & Run]] — how to develop and ship
- [[Themes]] — theme universe system explained
- [[Data Model]] — typed shapes & implied backend
- [[Decisions]] — what we picked and why
