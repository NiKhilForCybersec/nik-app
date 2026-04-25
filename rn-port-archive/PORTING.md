# Porting prototype JSX → React Native (Expo)

The prototype is a React-DOM web app at `/Users/nikhil/NIK/screens/*.jsx` and `/Users/nikhil/NIK/components/*.{js,jsx}`. We're porting to a real Expo (RN) app at `/Users/nikhil/NIK/app/src/`. Follow these rules **strictly** — RN is not the DOM.

## Element mapping

| Prototype (DOM) | RN |
|---|---|
| `<div>` | `<View>` |
| `<span>`, raw text | `<Text>` (ALL text must be inside `<Text>`) |
| `<button onClick>` | `<Pressable onPress>` |
| `onClick` | `onPress` |
| `e.stopPropagation()` | wrap inner Pressable separately; outer onPress fires only if inner doesn't capture |
| `className="glass"` | use the `<Tile>` component from `src/components/Tile` |
| `style={{ background: 'linear-gradient(...)' }}` | use `<LinearGradient>` from `expo-linear-gradient` |
| `style={{ backgroundImage: 'url(...)' }}` | use `<Image source={{uri}}/>` |
| `<svg>...` | use `react-native-svg` (`Svg`, `Circle`, `Path`, `Polyline`, `LinearGradient as SvgLinearGradient`, etc.) |
| `aspect-ratio: 1 / 1` | `aspectRatio: 1` (supported) |
| `display: 'grid', gridTemplateColumns: 'repeat(N, 1fr)'` | flex row with `flexWrap: 'wrap'` and `width: '50%'` etc; or repeated rows |
| CSS `gap` | `gap` is supported in RN 0.71+ — use it freely |

## Forbidden CSS

- **No oklch()** colors anywhere. Use `colors` from `src/theme.ts` or the `hueColor(hue)` helper.
- **No `var(--xxx)`** custom properties.
- **No CSS classes** (`className`).
- **No CSS keyframes / `animation: ...`**. Use `Animated` API or skip the animation in v1.
- **No `cursor`, `userSelect`, `WebkitBackgroundClip`, `backdropFilter`** etc. (web-only)

## Components already built (import from `src/components/`)

- `Tile` — glass card, `<Tile onPress={fn} style={...}>children</Tile>`
- `Chip` — small pill: `<Chip tone="accent|ok|warn|danger|neutral" size="sm|md">TEXT</Chip>`
- `Ring` — SVG progress ring: `<Ring size={48} pct={0.6} hue={280} sw={3}/>`
- `XPBar` — `<XPBar cur={1840} max={2400} level={27}/>`
- `Avatar` — `<Avatar name="Meera" size={34} hue={320} status="online" ring={false}/>`
- `Icon` — `<Icon name="water|book|dumbbell|brain|flame|moon|mic|chevR|chevL|location|..." size={18} color="..."/>`
- `ScreenHeader` — `<ScreenHeader title="Habits" subtitle="DAILY" onBack={fn}/>`
- `VoiceOverlay` — full-screen listening UI

## Theme colors (import from `src/theme.ts`)

```ts
colors.bg          // '#06060e'  base dark
colors.surface     // glass tile bg
colors.hairline    // 1px borders
colors.fg          // primary text
colors.fg2         // secondary
colors.fg3         // tertiary / mono
colors.accent      // '#a78bfa' violet (replaces var(--hue) accent)
colors.accent2     // '#ec4899' pink (gradient pair)
colors.accentSoft  // tinted accent bg
colors.accentBorder
colors.ok, okSoft  // green
colors.warn        // amber
colors.danger      // red
colors.flame       // orange
colors.monoFont    // 'Menlo'

hueColor(hue, l=0.85, c=0.16) // returns hsl() string from prototype hue
```

## Screen template

Every screen must:
1. Be a default export named `XxxScreen`
2. Take props `{ onNav, onBack, onVoice }: NavProps` (from `src/router.ts`)
3. Wrap content in `<ScrollView>` if scrolling, with `contentContainerStyle={{ padding: 16, paddingBottom: 100 }}` (the 100 leaves room for the floating tab bar)
4. Use `<ScreenHeader>` at top if not the home screen
5. Use mock data from `src/data/mock.ts` (extend it if the prototype references something not yet there — copy from `/Users/nikhil/NIK/components/data.js` or `circle-data.js`)

```tsx
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Tile, Chip, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import { MOCK } from '../data/mock';
import type { NavProps } from '../router';

export default function HabitsScreen({ onBack, onNav }: NavProps) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Habits" subtitle="Daily" onBack={onBack}/>
      {/* … */}
    </ScrollView>
  );
}
```

## Mock data

Existing exports in `src/data/mock.ts`:
- `MOCK.user` (User type)
- `MOCK.today` `{ date, weather, location }`
- `MOCK.habits` (Habit[])
- `MOCK.family` (FamilyMember[])

If you need more (quests, tasks, chat history, notifications, meds, diary entries, circle members, score history etc.) — open `/Users/nikhil/NIK/components/data.js` and `/Users/nikhil/NIK/components/circle-data.js`, extract the JS object literal you need, and add it to `mock.ts` with an appropriate type. Match the shape used by the prototype.

## Visual fidelity tradeoffs (acceptable in v1)

- Skip CSS keyframe animations (`fade-up`, `breathe`, `scanlines`) — use static or simple Animated.
- Skip `var(--font-display)` Google fonts — use system + Menlo for mono. (Will be added later via `expo-font`.)
- Background images via Unsplash URLs: replace with `<View style={{ backgroundColor: colors.surfaceStrong }}/>` placeholder for now.
- Replace prototype's custom SVG icons with the `Icon` helper which wraps lucide-react-native.
- HUDCorner brackets — skip in v1, just use plain Tile.

## DON'T

- Don't use `position: 'absolute', inset: 0` — RN doesn't always support `inset` shorthand. Use `top/left/right/bottom: 0`.
- Don't put loose strings (e.g. `"Hello"`) directly in a `<View>` — wrap in `<Text>`.
- Don't write `flex: 'flex-direction: row'`. Use `flexDirection: 'row'`.
- Don't use `boxShadow` strings; use `shadowColor`, `shadowOpacity`, `shadowRadius`, `shadowOffset` (iOS) and `elevation` (Android).
- Don't import from `react-dom` or use `dangerouslySetInnerHTML`.
- Don't worry about pixel-perfect parity with the web prototype. Functional + visually-coherent is the goal for v1.

## Output naming

Each ported screen file: `src/screens/<Name>Screen.tsx`. Default-export `<Name>Screen`.
