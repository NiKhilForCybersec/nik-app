# Data Model

Current shapes are mock data in `web/src/data/`. When the backend lands, these are what the API needs to return.

## Sources

- [`web/src/data/mock.ts`](../web/src/data/mock.ts) — user, today, habits, quests, tasks, family, chatHistory, notifications
- [`web/src/data/circle.ts`](../web/src/data/circle.ts) — circle members, privacy categories, trust tiers, default sharing matrix, view log, alerts, `canCircleView()`
- [`web/src/theme/score.ts`](../web/src/theme/score.ts) — score pillars, MOCK_SCORE, scoreToRank()

## Core entities

### User
```ts
{
  name: string;            // "Arjun"
  title: string;           // "Rank B Hunter" (theme-relative — see Vocab)
  level: number;           // 27
  xp: number;              // 1840
  xpMax: number;           // 2400
  streak: number;          // 42 (days)
  stats: { STR, INT, DEX, VIT, FOC: number };  // RPG-style stats
}
```

### Habit
```ts
{
  id: string;
  name: string;            // "Hydrate"
  target: number;          // 8
  done: number;            // 6
  unit: string;            // "glasses" / "min" / "steps" / "hrs"
  icon: string;            // "water" — key into the I icon map
  hue: number;             // 200 (OkLCh hue)
  streak: number;
  auto?: boolean;          // true if synced from a device API
  source?: string;         // "Apple Health" / "Cult Fit" / "Kindle" — provenance
}
```

### Quest
```ts
{
  id: string;
  title: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  xp: number;
  status: 'pending' | 'active' | 'done';
  progress?: number;       // 0..1, when active
  auto?: boolean;
  trigger?: string;        // "GPS · Cult Fit"
}
```

### Family member (basic — see Circle for the rich version)
```ts
{
  name: string;
  role: string;            // "Partner" / "Son · 8"
  hue: number;
  status: 'online' | 'away' | 'offline';
  location: string;
  level: number;
  self?: boolean;
}
```

### Notification
```ts
{
  kind: 'gps' | 'family' | 'habit' | 'system';
  title: string;
  body: string;
  time: string;            // "now" / "14m" / "1h"
  action?: string;         // CTA label, optional
}
```

## Circle data (privacy graph)

The richest part of the schema. See [[Screens/Circle]] for UX context.

### CircleMember
```ts
{
  id: string;              // 'arjun', 'meera', 'kiaan', 'mom'
  name: string;
  role: string;
  relation: 'self' | 'partner' | 'kid-young' | 'kid-teen' | 'parent';
  age: number;
  hue: number;
  self?: boolean;
  status: 'online' | 'away' | 'offline';
  location: string;
  lastSeen: string;
  birthday: string;
  bloodType?: string;
  health: {
    sleep: { last, avgWk, deficit?, alert? };
    mood: { today, trend7: string[], alert? };
    steps: number;
    heart?: { resting, hrv? };
    cycle?: { day, phase, next };          // partner-specific
    bp?: { sys, dia, alert? };             // care-recipient
    glucose?: { last, fasting? };          // care-recipient
    streaks: number;
    score: number;
  };
  meds: Array<{ name, dose, adherence: number, alert? }>;
  care: {
    allergies: string[];
    conditions: string[];
    doctors: Array<{ name, spec, last? }>;
    insurance?: string;
    caregiver?: string;
    emergency?: string;
  };
  schedule: Array<{ time, text, kind }>;
  diary: { moodToday, lastEntry };
  teenPrivacy?: boolean;                   // gives teen sub-controls
  careRecipient?: boolean;                 // flag for elderly care UX
}
```

### Privacy matrix

```ts
PRIVACY_CATEGORIES: [
  'health', 'meds', 'mood', 'cycle', 'schedule', 'location', 'care', 'score', 'diary'
]
TRUST_TIERS: [
  'inner',     // partner, parents
  'family',    // siblings, in-laws
  'kid',       // kid sees less detail
  'caregiver', // hired help, doctors
]

DEFAULT_SHARING: { [memberId]: { [category]: TrustTier[] } }
// e.g. arjun.location → ['inner']  means only "inner" tier sees Arjun's location
//      mom.bp       → ['inner', 'caregiver']

canCircleView(viewerId, ownerId, category) → boolean
```

This is the **privacy enforcement** boundary. Backend MUST enforce this server-side; clients never trust each other. See [[Backlog]] for migration plan.

## Score model

### Pillars (4)
```ts
{ id: 'focus' | 'health' | 'mind' | 'family',
  label: string,
  icon: string,
  weight: number,          // 0.30 / 0.25 / 0.25 / 0.20 → sum to 1
  color: number,           // OkLCh hue
  desc: string }
```

### Score state
```ts
{
  total: number;           // 0..1000
  delta7d: number;         // +28
  rank: string;            // "Operative II" (theme vocab-driven)
  nextRank: { name, at: number };
  pillars: {
    [pillarId]: { value, max, weeklyGoal, trend: number[7] };
  };
  todayContribution: number;
  backlog: Array<{
    id, title, missed, cost, makeup, pillar, dismissable?, gentle?
  }>;
  recent: Array<{ ts, delta, source, pillar }>;
}
```

`scoreToRank(score, themeId)` derives rank label from theme vocab (Hunter S/A/B/...., Operative 5/4/3/.../1, etc).

## Implied backend tables (rough)

```
users          — user profile + stats
habits         — per-user, per-day target + done logs
quests         — auto-generated + manual
tasks          — calendar-y items
notifications  — per-user feed
circle_members — membership in someone's circle
circle_sharing — (owner, viewer, category, tier) tuples
score_events   — append-only ledger driving the pillar scores
diary_entries
meds           — schedules + adherence logs
focus_sessions — start/end + distractions
chat_messages
```

See [[Backlog]] for what's deferred and the proposed sync architecture.

## Related

- [[Screens/Index]]
- [[Architecture]]
- [[Backlog]]
