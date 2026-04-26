# Privacy Policy

> **DRAFT — replace bracketed placeholders before publishing.**
> Last updated: 2026-04-26

## Who we are

Nik is operated by [Company Name] ("we", "us"). You can reach us at [contact@example.com].

## What data we collect

- **Account data:** email + password hash (Supabase Auth).
- **Profile data:** display name, theme preference, level/XP/streak (derived from your activity).
- **Activity data you log:** habits, hydration intakes, sleep nights, focus sessions, diary entries, quests, family tasks, items (reading list, shopping list, etc.).
- **Family circle:** members you add, their relation/age (you provide), the privacy categories you choose to share with each.
- **Calendar / event data:** events you create. (Future: events ingested from connected integrations like Google Calendar — only after you connect them.)
- **Chat history with Nik AI:** the messages you send and the AI's replies, including which tools it called.
- **Device / health data:** only when HealthKit / Health Connect permission is granted by you, and only the categories you explicitly approve. Stored on-device + on our servers under your account.
- **Location:** only when you grant permission. Used for location-aware suggestions (errands, GPS-aware quests). We do not sell location data.

We do **not** collect: your contacts list (we never read your address book), browsing history, ad identifiers, or any analytics about your usage outside Nik itself.

## Where data lives

- Application database: Supabase (Postgres) hosted in [region]. Each row is row-level-security scoped to your `auth.uid()`; we cannot read your data without explicit support escalation.
- AI inference: prompts are routed via our Edge Function to Anthropic Claude (and optionally OpenAI as fallback). We do not train models on your prompts. Anthropic's data-use policy applies — see anthropic.com/legal.
- Backups: encrypted at rest, retained 30 days.

## What we do with it

- Render your dashboards.
- Power Nik AI suggestions based on the data you've explicitly logged.
- Send notifications you've enabled (reminders, scheduled intents, family pings).
- Compute aggregate metrics (your Nik Score, streaks).

We do **not** sell your data, share it with advertisers, or use it for cross-app tracking.

## Family circle privacy

When you accept an invite into someone else's circle (or vice versa), only the categories explicitly chosen by the data owner are visible to the other side. Tier defaults are: Inner (everything you've shared), Family (health snapshot + schedule + location), Kids (schedule + location), Caregiver (health-focused). You can change tiers or revoke access at any time from the Circle screen.

## Your controls

- **Export:** request a JSON dump of every row tied to your `user_id` at [contact@example.com].
- **Delete:** Profile → Sign out → "Delete account" (or email us). Cascade-deletes all your rows, including chat history.
- **Revoke connections:** remove any circle member at any time; they can't see your data after that point.

## Children

Nik is not directed at children under 13. Don't create accounts for them. The "Kids" trust tier is for kids whose parent owns the parent account and shares limited data — kids do not have their own Nik accounts.

## Changes

We'll update this page when policy changes. Material changes (new data categories, new third parties) get an in-app notice.

## Contact

[contact@example.com]
