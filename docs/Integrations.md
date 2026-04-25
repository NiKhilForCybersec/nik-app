# Integrations — Gmail, WhatsApp, Calendar, HealthKit (as MCP servers)

## Why this is a pillar

The single most powerful thing Nik can do is **stop asking the user to re-enter information that's already in their inbox / messages / calendar.** A movie ticket arrives by email → it should appear on Brief, save to Vault, and be addressable by AI ("when's the movie?") without any manual entry.

We model every external channel as its **own MCP server**, so:
- Each one is composable + can be enabled/disabled per user
- Any LLM (Claude / GPT / Gemini) gets the same powers
- Permissions are scoped per server (revoke Gmail without losing Calendar)
- Standard interface — adding a new integration is mechanical

## The map

| Server | Reads | Writes | Surfaces in app |
|---|---|---|---|
| `nik-mcp-gmail` | recent emails, attachments, search | drafts (with explicit user confirm) | Brief, Vault, Calendar peek, Birthdays, Bills |
| `nik-mcp-messages` | iMessage / SMS threads | reply (with confirm) | Family Circle, Couple, Friends |
| `nik-mcp-whatsapp` | recent chats, group activity | send (with confirm) | Family Circle, Friends, Birthdays |
| `nik-mcp-calendar` | events, free/busy, attendees | create / move events | Brief, Family Ops, Couple, Calendar |
| `nik-mcp-healthkit` | steps, sleep, HR, HRV, workouts | none | Habits, Sleep, Fitness, Score |
| `nik-mcp-photos` | recent photos, on-this-day | none | Vault, Diary |
| `nik-mcp-spotify` | playlists, currently-playing | play / queue | Sleep wind-down, Focus, Brief |
| `nik-mcp-banks` (later) | transactions | none | Money, Bills |

## Example flow — movie ticket email

```
1. User receives an email: "Your IMAX tickets — Inception, Sat 7pm, PVR Forum"
2. nik-mcp-gmail polls (or webhooks) → detects ticket pattern
3. POSTs to nik backend: events.add({
     kind: 'movie_ticket',
     title: 'Inception',
     when: '2026-05-10T19:00:00+05:30',
     where: 'PVR Forum, Bengaluru',
     source: { kind: 'gmail', message_id: '...' }
   })
4. Brief screen surfaces it tomorrow morning
5. Vault auto-saves the email + booking PDF
6. AI can answer: "What's on this weekend?" → "Inception at PVR Forum, Sat 7pm"
7. Family Circle sees if shared
```

No manual entry. No "hey Nik please remember this." It just appears.

## Per-server architecture

Each integration MCP server is its own deployable:

```
packages/
  ├── mcp-nik/             ← exposes Nik's own backend ops (already shipped)
  ├── mcp-nik-gmail/       ← Gmail OAuth + parser + tool catalog
  ├── mcp-nik-calendar/
  ├── mcp-nik-whatsapp/
  ├── mcp-nik-messages/    ← iOS-only, ships inside the iOS app via Capacitor plugin
  └── mcp-nik-healthkit/   ← on-device, runs inside Capacitor
```

The orchestrator (Nik backend) holds the user's per-server OAuth tokens (encrypted) and routes tool calls to the right server. The frontend never speaks MCP directly — it hits the Nik backend, which dispatches.

## Trust zones (matters for privacy)

| Trust zone | Examples | Where it runs |
|---|---|---|
| **On-device** (most private) | HealthKit, Photos, Messages | Inside Capacitor, never leaves the phone unless the user explicitly asks Claude to use it |
| **User-credentialed cloud** | Gmail, Calendar, WhatsApp | Server-side with per-user OAuth; only the user's own data accessible |
| **Public / unauth** | Weather, news | No auth required, cached by default |

The AI sees only what the user allows. Each MCP server publishes its tool catalog at sign-up, the user accepts/declines per server, and the per-(user, server) toggle lives in the privacy matrix alongside the Family Circle one.

## What ships when

| Phase | What |
|---|---|
| **Now** | `nik-mcp-app` (own backend) — shipped |
| **Phase 2** | `nik-mcp-healthkit` (on-device) + `nik-mcp-calendar` (cheapest external win) |
| **Phase 3** | `nik-mcp-gmail` (the killer one for "things you missed") |
| **Phase 4** | `nik-mcp-whatsapp` + `nik-mcp-messages` |
| **Phase 5** | `nik-mcp-spotify`, `nik-mcp-photos`, optional |

## Permission model

Each server's tools declare which privacy categories they touch (`email`, `messages`, `health`, `location`, `photos`, `financial`). The user's per-server consent sets the boundary; the backend enforces server-side; the AI only sees tools whose data the user has shared.

## Related

- [[Architectural Pillars]] (pillar 6)
- [[Registry]]
- [[Architecture]]
- [[Backlog]] — phasing
