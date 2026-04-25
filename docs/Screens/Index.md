# Screens — Index

21 screens, grouped by domain. Each links to a per-screen note (where it exists) with purpose, key data, interactions, and device-API needs.

## Core / Navigation

| ID | File | Purpose |
|---|---|---|
| `home` | [`HomeScreen.tsx`](../../web/src/screens/HomeScreen.tsx) | Live dashboard — greeting, HUD, score, focus, GPS card, habits, family, vitals, ask-Nik |
| `chat` | [`ChatScreen.tsx`](../../web/src/screens/ChatScreen.tsx) | AI conversation: voice + text. Suggests/executes actions |
| `more` | [`MoreScreen.tsx`](../../web/src/screens/MoreScreen.tsx) | Grid hub of all secondary screens |
| `brief` | [`BriefScreen.tsx`](../../web/src/screens/BriefScreen.tsx) | Morning audio summary — schedule, weather, nudges, reading queue |

## Productivity

| ID | File | Purpose |
|---|---|---|
| `habits` | [`HabitsScreen.tsx`](../../web/src/screens/HabitsScreen.tsx) | Daily ritual tracking with rings + auto-sync from devices |
| `focus` | [[Screens/Focus]] | Deep-work timer, distraction log, forest growth visualization |
| `errands` | [`ErrandsScreen.tsx`](../../web/src/screens/ErrandsScreen.tsx) | Location-aware task routing |
| `score` | [[Screens/Score]] | Pillar breakdown of the 0–1000 wellness score |

## Health

| ID | File | Purpose |
|---|---|---|
| `fitness` | [`FitnessScreen.tsx`](../../web/src/screens/FitnessScreen.tsx) | Coach, exercise library, AI form guides |
| `meds` | [`MedsScreen.tsx`](../../web/src/screens/MedsScreen.tsx) | Medication scheduler + adherence |
| `sleep` | [`SleepScreen.tsx`](../../web/src/screens/SleepScreen.tsx) | Sleep score, hypnogram, dream log |

## Mind & Reflection

| ID | File | Purpose |
|---|---|---|
| `diary` | [`DiaryScreen.tsx`](../../web/src/screens/DiaryScreen.tsx) | Daily journaling — text, photos, voice, AI prompts |

## Family & Care

| ID | File | Purpose |
|---|---|---|
| `circle` / `family` | [[Screens/Circle]] | Multi-member view, privacy matrix, alerts |
| `familyops` | [`FamilyOpsScreen.tsx`](../../web/src/screens/FamilyOpsScreen.tsx) | Co-parent task assignment, alarm clusters |
| `couple` | [`CoupleScreen.tsx`](../../web/src/screens/CoupleScreen.tsx) | Shared notes with partner, gratitude, agreements |
| `kids` | [`KidsScreen.tsx`](../../web/src/screens/KidsScreen.tsx) | Simplified view for children |

## Money & Memory

| ID | File | Purpose |
|---|---|---|
| `money` | [`MoneyScreen.tsx`](../../web/src/screens/MoneyScreen.tsx) | Budgets, bills, recent transactions |
| `vault` | [`VaultScreen.tsx`](../../web/src/screens/VaultScreen.tsx) | Photos, voice notes, on-this-day flashbacks |

## Settings & Onboarding

| ID | File | Purpose |
|---|---|---|
| `settings` | [`SettingsScreen.tsx`](../../web/src/screens/SettingsScreen.tsx) | Account, theme picker, integrations, notifications |
| `profile` | [`ProfileScreen.tsx`](../../web/src/screens/ProfileScreen.tsx) | User card, level/XP, connected services |
| `onboard` | [`OnboardScreen.tsx`](../../web/src/screens/OnboardScreen.tsx) | 8-step setup flow |

## Adding to the registry

See [[Build & Run]] → "Adding a new screen" for the wiring steps.

## Related

- [[Architecture]]
- [[Data Model]]
- [[Themes]]
