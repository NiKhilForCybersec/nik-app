# 002 — Vite over Babel-in-browser

**Date:** 2026-04-25
**Status:** accepted

## Context

After [[Decisions/001 — Capacitor over React Native|picking Capacitor]], the fastest path was to drop the prototype's `Nik.html` (with `<script type="text/babel" src="...">` tags loading 30 JSX files at runtime via `@babel/standalone`) into Capacitor's `www/` and ship.

This worked — visual fidelity was 100%. But:
- Cold start was 2–4s on the simulator (Babel compiling 30 files at runtime).
- The prototype was using script-tag globals (`window.MOCK = MOCK`, `window.HomeScreen = HomeScreen`) — no module system, no type safety, no IDE autocomplete worth using.
- App Store Review guideline 2.5.6 frowns on apps that download interpreted code at runtime.
- Adding a feature meant editing JSX in a file with no compile-time errors — found at runtime in the simulator.

The user explicitly asked: *"i want a real app working not just rendering html, i want a real app like a react js one proper with advanced features."*

## Options considered

1. **Keep Babel-in-browser**, just optimize.
2. **Vite + React + TypeScript**, refactor the prototype's globals into ES modules.
3. **Next.js**, full SSR-capable framework.
4. **esbuild / Parcel** standalone bundlers.

## Decision

**Vite + React 19 + TypeScript.**

- Vite has the fastest dev experience in 2025/2026 (HMR in <100ms).
- React 19 + TS gives us types, autocomplete, and a real refactoring story.
- Single bundle: 482KB raw / 122KB gzipped, loads instantly in the WebView.
- App Store-safe: no runtime code download, no `eval`-equivalent at startup.
- Same React DOM as the prototype — we ported the JSX as-is, just dropped the `window.X = X` lines and added `import` / `export`.

Skip Next.js — we're a webview SPA, SSR adds complexity for zero benefit. Skip esbuild/Parcel — Vite covers the same ground with a richer ecosystem.

## Migration approach

1. Scaffolded `web/` with Vite's `react-ts` template.
2. Wrote [`web/CONVERSION.md`](../../web/CONVERSION.md) — the rules: keep JSX, keep className, keep oklch styles; just swap globals for ES modules.
3. Set up the foundation files (`themes.ts`, `data/mock.ts`, `data/circle.ts`, `theme/score.ts`, `components/icons.tsx`, `components/primitives.tsx`, `components/shell.tsx`) as typed modules.
4. Wrote `App.tsx` with the same state-machine pattern as the prototype (single `useState<AppState>`).
5. Stubbed all 21 screens so the app compiled.
6. Dispatched 5 parallel conversion agents to port the screens (mostly mechanical: drop window globals, add imports + types).
7. Built (`tsc -b && vite build`) → `dist/`.
8. Pointed `capacitor.config.json`'s `webDir` at `dist`.
9. `cap sync ios`, relaunched, verified visually.

## Consequences

- **Real engineering**: TS catches errors at compile time, autocomplete works, refactors are safe. New features are fast to add.
- **Bundle is one file**: easy to ship, easy to reason about. Code-splitting available later if it grows.
- **HMR in dev**: edit any source file, browser updates in <1s.
- **The original `www/` prototype still exists** but is no longer the source of truth. Kept as a reference for the design.
- **`dist/` is committed** so deploys don't require Node on the build machine. (Re-evaluate when CI lands.)

## Related

- [[Decisions/001 — Capacitor over React Native]]
- [[Architecture]]
- [[Build & Run]]
- [`web/CONVERSION.md`](../../web/CONVERSION.md) — the actual rules used during the migration
