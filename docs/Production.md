# Production prep — what's done, what's left

Living checklist for getting Nik from local dev → cloud Supabase → TestFlight.
Tick items as you complete them.

## What ships in code today

- [x] LLM proxy Edge Function at `supabase/functions/llm-complete/index.ts` — accepts the same payload the web client used to send to `api.anthropic.com` directly, but adds the API key server-side. Handles Anthropic + OpenAI, tool-use round-trips, normalized response.
- [x] Web client (`web/src/lib/llm/anthropic.ts`) already routes through the proxy by default. `VITE_ANTHROPIC_DIRECT=1` is the dev escape hatch.
- [x] All migrations are idempotent (`if not exists`, `drop ... if exists`) — safe to push to a fresh cloud DB.
- [x] Honest empty seed: new users get profile + habits + self circle row + zero score snapshot. No demo lies.

## What you need to do (out of code)

### 1. Cloud Supabase project
1. `supabase login`
2. `supabase projects create nik-prod` (or use the dashboard)
3. `supabase link --project-ref <ref>`
4. `supabase db push` — applies every migration in `supabase/migrations/` in order
5. `supabase functions deploy llm-complete`
6. `supabase functions deploy intents-tick` (for scheduled-tasks worker)

### 2. Set Edge Function secrets
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...   # optional fallback
```

### 3. Web env for production build
Create `web/.env.production`:
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
# Do NOT set VITE_ANTHROPIC_API_KEY — the proxy holds it.
```

### 4. App icon + splash
- Drop a 1024×1024 PNG at `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
- Run `npx capacitor-assets generate --iconBackgroundColor "#06060a" --iconBackgroundColorDark "#06060a"` to regenerate every size
- For splash, drop a 2732×2732 at `resources/splash.png` and run `npx capacitor-assets generate --splashBackgroundColor "#06060a"`

### 5. Privacy policy + terms
The skeletons below are at `docs/legal/`. Fill in the company name + contact email, host them at GitHub Pages or any static URL, and reference the URLs in App Store Connect.
- `docs/legal/privacy.md`
- `docs/legal/terms.md`

### 6. Apple Developer account + first TestFlight build
1. Enroll at developer.apple.com (~$99/yr).
2. Open the Xcode project: `npm run open:ios`
3. In Signing & Capabilities, set your Team and a unique Bundle Identifier (`com.<your>.nik`).
4. Product → Archive → distribute via TestFlight.
5. Add yourself as an internal tester in App Store Connect.

### 7. Android (post-iOS)
- `npm i @capacitor/android && npx cap add android`
- Open in Android Studio, build, sign, push to Play Console internal testing.

## Pre-launch sanity checks

Run these locally before each TestFlight build:

```bash
cd /Users/nikhil/NIK
node scripts/check-wiring.mjs              # manifests in sync with JSX
node scripts/build-inventory.mjs           # docs/Inventory.generated.md fresh
cd web && npx tsc --noEmit -p . && npx vite build
npx cap sync ios
xcrun simctl uninstall booted com.nik.app && npx cap run ios --no-sync
```

## Known SOON / V2 items

- Google / Apple / SAML OAuth (deferred per `project_oauth_deferred.md`)
- HealthKit / Health Connect plugin wiring (vitals_strip widget shows "—" until then)
- NFC tap-to-share on circle invites (Capacitor plugin, mobile-only)
- Push notifications + scheduled-task push delivery
- Edge Function cron for daily score decay / streak rollover
