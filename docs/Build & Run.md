# Build & Run

Practical commands. Copy-paste friendly.

## First-time setup

```bash
# Already done in this repo, but if you're cloning fresh:
cd web
npm install
cd ..
npm install        # Capacitor deps at root
```

## Develop in the browser (fastest loop)

```bash
cd web
npm run dev
# Open http://localhost:5173
```

Vite HMR — edit any file in `web/src/`, the page hot-updates in <1s.

## Run on iOS simulator

```bash
cd web && npm run build      # tsc + vite build → ../dist/
cd ..                        # back to repo root
npx cap sync ios             # copies dist/ into ios/App/App/public/
xcrun simctl launch B2E27E4D-FB6A-435B-B139-2EFA14CADC3A com.nik.app
```

Or, for a clean rebuild + reinstall:
```bash
cd web && npm run build && cd ..
npx cap run ios --target B2E27E4D-FB6A-435B-B139-2EFA14CADC3A
```

The `B2E27E4D-...` UDID is the local iPhone 17 Pro simulator. List others:
```bash
xcrun simctl list devices available | grep iPhone
```

## Open in Xcode (for native debugging)

```bash
npm run open:ios
```

Xcode opens. Run with ⌘R.

## Take a screenshot of what's on the simulator

```bash
xcrun simctl io booted screenshot /tmp/nik.png
open /tmp/nik.png
```

## Force a fresh load (WebView caches!)

The WebView caches HTML + JS aggressively. If your latest build isn't showing up:
```bash
xcrun simctl uninstall booted com.nik.app
cd web && npm run build && cd ..
npx cap run ios --no-sync
```

## Type-check without building

```bash
cd web
npx tsc --noEmit -p .
```

## Add a Capacitor plugin (e.g. geolocation)

```bash
cd /Users/nikhil/NIK             # repo root, NOT web/
npm install @capacitor/geolocation
npx cap sync ios
# Plugin is now usable in web/src/. Import: import { Geolocation } from '@capacitor/geolocation'
# (Add the import to web/package.json too if you want type completion in VSCode in web/.)
```

For HealthKit / Health Connect, see [[Backlog]].

## Add Android target

```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android   # opens Android Studio
```

## Adding a new screen

1. Create `web/src/screens/FooScreen.tsx` (default export `FooScreen`).
2. Add `'foo'` to the `ScreenId` union in `web/src/App.tsx`.
3. Import `FooScreen` and add a `case 'foo': return <FooScreen {...screenProps} />` in `renderScreen()`.
4. Optionally surface in TabBar: edit `web/src/components/shell.tsx` and add it to `tabs` (always-visible) or `moreItems` (in the More menu).

See [[Architecture]] for the bigger picture, [[Themes]] for adding a theme.

## Related

- [[Architecture]]
- [[Themes]]
- [[Backlog]]
