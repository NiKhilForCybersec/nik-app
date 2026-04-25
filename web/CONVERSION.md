# Converting prototype JSX → real React+TS+Vite modules

The prototype at `/Users/nikhil/NIK/www/` is React DOM, but uses script-tag globals (`window.X = X`) and Babel-in-browser. We're converting to a proper Vite + React 19 + TypeScript + React Router app at `/Users/nikhil/NIK/web/`.

**Visual fidelity is the goal.** Don't change CSS or layouts. Just change how modules are wired.

## Source → target

| Prototype | Target |
|---|---|
| `/Users/nikhil/NIK/www/components/data.js` | `/Users/nikhil/NIK/web/src/data/mock.ts` |
| `/Users/nikhil/NIK/www/components/circle-data.js` | `/Users/nikhil/NIK/web/src/data/circle.ts` |
| `/Users/nikhil/NIK/www/components/themes.js` | `/Users/nikhil/NIK/web/src/theme/themes.ts` |
| `/Users/nikhil/NIK/www/components/score.js` | `/Users/nikhil/NIK/web/src/theme/score.ts` |
| `/Users/nikhil/NIK/www/components/icons.jsx` | `/Users/nikhil/NIK/web/src/components/icons.tsx` |
| `/Users/nikhil/NIK/www/components/primitives.jsx` | `/Users/nikhil/NIK/web/src/components/primitives.tsx` |
| `/Users/nikhil/NIK/www/components/shell.jsx` | `/Users/nikhil/NIK/web/src/components/shell.tsx` |
| `/Users/nikhil/NIK/www/screens/<name>.jsx` | `/Users/nikhil/NIK/web/src/screens/<Name>Screen.tsx` (default export named `<Name>Screen`) |

The `*-sheets.jsx` files (circle-sheets, meds-sheets, diary-sheets) are bottom-sheet modals — port to `web/src/components/sheets/<Name>Sheets.tsx` (or skip in v1 if not referenced by a v1 screen).

## Conversion rules — the only real changes

1. **`window.X = X` → `export const X = ...`** at top of file. Remove `window.` references.
2. **Cross-file references** that used to be `window.MOCK.user` become explicit imports: `import { MOCK } from '../data/mock'`.
3. **Add TypeScript types.** Use loose typing where the prototype is dynamic — `Record<string, any>` is OK for mock data shapes; tighten later. For React component props, define a `type Props = { ... }` and annotate.
4. **Component patterns:**
   - The prototype declares components like `const Foo = ({ x, y }) => ...; window.Foo = Foo;`. Convert to: `export const Foo: React.FC<{ x: ...; y: ...}> = ({ x, y }) => ...`.
   - Multiple component exports per file are fine — many prototype files declare helpers alongside the main component.
5. **Keep className strings as-is.** The CSS file is copied verbatim — `glass`, `scanlines`, `xp-fill`, `tap`, `display`, `mono`, etc. all still work.
6. **Keep `style={{ ... }}` inline objects as-is.** Same React DOM. oklch() colors work in browsers + WebView.
7. **Keep CSS variables (`var(--hue)`)** — they're set by `applyTheme` in the ThemeProvider.
8. **Don't change the JSX structure.** Same `<div>`, `<span>`, `<svg>`, etc.

## Imports cheat-sheet (use these in screens)

```ts
import { MOCK } from '../data/mock';
import { CIRCLE } from '../data/circle';
import { THEMES, applyTheme, getTheme, getThemeVocab, type Theme } from '../theme/themes';
import { SCORE_PILLARS, MOCK_SCORE } from '../theme/score';
import { I } from '../components/icons';                        // I.water, I.book, etc
import {
  Ring, XPBar, Avatar, Chip, VoiceOrb, Waveform, HUDCorner,
  Toast, GradientDefs, IOSDevice, AndroidDevice, Placeholder
} from '../components/primitives';
import {
  TabBar, VoiceOverlay, OfflineBanner, EmptyState, SkeletonScreen
} from '../components/shell';
```

## Screens take navigation props

The prototype passed `onNav`, `onVoice`, `dark`, `intensity`, `aesthetic`. Keep that pattern:

```tsx
type ScreenProps = {
  dark?: boolean;
  intensity?: 'soft' | 'medium' | 'full';
  aesthetic?: string;
  onNav: (screen: string) => void;
  onVoice: () => void;
};

export default function HomeScreen({ dark, onNav, onVoice, intensity, aesthetic }: ScreenProps) {
  // ... same body as www/screens/home.jsx, with imports replacing window globals
}
```

Some screens have extra props (e.g. ChatScreen takes `listening`, FocusScreen takes `onExit`, FamilyCircleScreen takes `state` + `setState`). Match the prototype's contract.

## App-level wiring (already exists in App.tsx)

Don't touch `App.tsx` unless you're the foundation agent. Don't touch `main.tsx`. The router + ThemeProvider + state are already wired.

## DON'T

- Don't add new dependencies (we have react, react-dom, react-router-dom, framer-motion).
- Don't change the visual design.
- Don't refactor "while you're in there." Just convert the file.
- Don't drop CSS variables or className strings.
- Don't use `import.meta.glob` or any clever auto-loaders.
- Don't mark a screen as done if it has a TS error or runtime crash.

## Verifying your work

After porting, run from `/Users/nikhil/NIK/web/`:

```bash
npx tsc --noEmit -p . --pretty false
```

Should exit 0. If there are errors involving your file, fix them.

## File-naming convention

Screens: `web/src/screens/<Name>Screen.tsx` with default export named `<Name>Screen`.
- home.jsx → `HomeScreen.tsx` exporting `HomeScreen`
- chat.jsx → `ChatScreen.tsx` exporting `ChatScreen`
- score-detail.jsx → `ScoreScreen.tsx` exporting `ScoreScreen`  
- family-ops.jsx → `FamilyOpsScreen.tsx` exporting `FamilyOpsScreen`
- etc.
