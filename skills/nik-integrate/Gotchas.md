# Gotchas (real failures we've hit)

> Anthropic's skill-creator guide says: "Gotchas are the most valuable content in any skill." This file captures the things that broke us so the agent doesn't make the same mistakes when integrating Nik patterns into someone else's app.

## Supabase array-insert null padding

When inserting an array of rows where rows have **different columns**, Supabase pads missing fields with `null`. If a column is `NOT NULL`, the insert fails — even though each row independently looks fine.

**Symptom:** `error: null value in column "X" of relation "Y" violates not-null constraint` even though no row in your code passes null for X.

**Fix:** When seeding multiple rows, **always pass every column for every row**, even if you have to use the schema default. Don't rely on Supabase's per-row column inference.

```ts
// ❌ BAD — row 2 will get null padding for `auto`
await sb.from('habits').insert([
  { user_id, name: 'A', target: 8, done: 6, auto: true },
  { user_id, name: 'B', target: 30, done: 22 },  // missing auto
]);

// ✅ GOOD
await sb.from('habits').insert([
  { user_id, name: 'A', target: 8, done: 6, auto: true },
  { user_id, name: 'B', target: 30, done: 22, auto: false },
]);
```

## Supabase Vector container fails on Colima

Supabase's analytics container (`supabase_vector_*`) wants to mount `/var/run/docker.sock`. Colima exposes it elsewhere → container fails health check → `supabase start` aborts.

**Fix:** Disable analytics in `supabase/config.toml`:
```toml
[analytics]
enabled = false
```
You lose only the local Studio analytics tab. Everything else works.

## React-Query stale data on Auth state change

If `useOp` runs before `useAuth` finishes signing in, you get cached `[]` for 30s (stale time). Fix: include `userId` in the query key + `enabled: ready` flag.

```ts
return useQuery({
  queryKey: [op.name, userId, input],   // ← userId in key
  queryFn: () => op.handler({ sb, userId }, ...),
  enabled: ready,                        // ← gate on auth-ready
});
```

## Vite env vars need a server restart

`import.meta.env.VITE_*` is resolved at server start, not at request time. Editing `.env.local` while `npm run dev` is running → changes don't apply. Restart Vite.

## React + jsx files

If a `.ts` file uses JSX, you get cryptic regex-syntax errors at build (`Unterminated regular expression literal`). Rename to `.tsx`.

## Direct seed of `auth.users` rows is fragile

Inserting test users via SQL `INSERT INTO auth.users` skips the GoTrue auth-flow plumbing (`auth.identities`, refresh tokens, schema validation). Sign-in then fails with `Database error querying schema`.

**Fix:** Always create users via `supabase.auth.signUp({...})` from the client. In dev, do this on first launch and seed user-scoped data afterwards.

## Capacitor + iOS WKWebView caches aggressively

If you rebuild + `cap sync` and the app shows stale content, uninstall + redeploy:
```bash
xcrun simctl uninstall booted com.nik.app
npx cap run ios --no-sync
```

## env.local in production

Don't commit `.env.local`. The repo's `.gitignore` covers it. For prod (Cloud Run / Supabase Cloud), set the same env vars in your hosting platform.

## Cross-feature imports

Nik's wiring-check forbids screens from importing each other's internals. If you need to share something, lift it to `lib/` or `components/` (or `contracts/` if it's a registry-shaped op).

## "It works in dev but not in iOS"

WebKit has subtler quirks than Chromium. Common offenders:
- `inset: 0` is supported but spotty — prefer `top/left/right/bottom: 0`
- `gap` works in flexbox iOS 14.5+; we target newer
- `oklch()` works iOS 15.4+
- `backdrop-filter` is `-webkit-backdrop-filter` for older iOS

## TanStack Query bundle size

TanStack Query is ~10KB gzipped. Worth it. But if your app is *only* doing reads with no caching benefit, plain `fetch` + `useEffect` is fine. Nik uses TanStack because the same query is read by multiple screens (Brief + Home both read `events.list`).

## When the wiring-check passes locally but fails in CI

Usually a missing platform-specific optional dep in `package-lock.json`. Use `npm install --no-audit --no-fund` instead of `npm ci` in your CI workflow (we do).

## Supabase RLS gotcha

`auth.uid()` returns null inside `service_role` queries. If your server-side code (Edge Function, MCP server) needs to query as a user, set the user's JWT via `supabase.auth.setSession(...)` before calling — otherwise RLS won't apply correctly.
