# 001 — Capacitor over React Native

**Date:** 2026-04-25
**Status:** accepted

## Context

We had a Claude-generated React DOM prototype with deep visual fidelity (5 theme universes, oklch colors, glass tiles, custom fonts, scanlines, CSS keyframe animations). Goal: ship it as a real iOS + Android app.

We started by porting to React Native (Expo). 23 screens went through a translation pass: `<div>` → `<View>`, oklch → hsl, CSS classes → StyleSheet, etc.

## Options considered

1. **React Native (Expo)** — true native widgets, deep HealthKit/Health Connect via Expo modules, single codebase, hot reload via Expo Go, hiring pool huge.
2. **Flutter** — pixel-perfect rendering via Impeller, single codebase. Throws away the React prototype, requires learning Dart.
3. **Capacitor** — wraps the existing React DOM app in a native WebView shell. Single codebase. WebView under the hood. Plugin ecosystem for device APIs (less polished than Expo's).
4. **Native (Swift + Kotlin)** — best UX ceiling, most expensive. Two codebases.

## Decision

**Capacitor.**

The visual fidelity bar is the dealbreaker. RN doesn't support oklch, can only approximate backdrop-filter, can't do CSS keyframes for "scanlines" / "breathe" overlays. After porting all 23 screens to RN, the user said the result was "not even 30% of what the design had." That's the ceiling — closing the gap requires significant manual animation + drawing work in Skia.

Capacitor wraps the *actual prototype*. Same React DOM, same CSS, same fonts, same oklch — 100% visual fidelity by construction.

## Consequences

- **WebView, not native widgets.** Animations run on the browser engine, not Skia/Impeller. Fine for our usage (cards, scrolling lists, gradient orbs). Could stutter on cheap Android devices — TBD when we test.
- **Device APIs go through Capacitor plugins** instead of Expo modules. HealthKit/Health Connect plugins exist but are community-maintained — less polished. Likely we'll write a thin native bridge if we need anything advanced.
- **Web-stack DX**: edit `web/src/`, see HMR in the browser, then `cap sync` for mobile. Faster iteration than RN's metro+sim dance.
- **Hiring**: any React/web dev is productive immediately. No RN gotchas to learn.
- **App Store**: Capacitor apps ship to both stores fine. WebView-based apps are common (Instagram for some flows, Slack desktop, every Cordova app ever).

## Related

- [[Decisions/002 — Vite over Babel-in-browser]] — what we did *after* picking Capacitor
- [[Architecture]]
- The abandoned RN port lives at [`rn-port-archive/`](../../rn-port-archive/) for reference
