/* Aggregate screen manifests — auto-imports every <Name>Screen.manifest.ts
 * so the MCP server / dev overlay / "what does this screen touch" feature
 * can introspect by ScreenId.
 */

import { manifest as home }        from './HomeScreen.manifest';
import { manifest as chat }        from './ChatScreen.manifest';
import { manifest as habits }      from './HabitsScreen.manifest';
import { manifest as fitness }     from './FitnessScreen.manifest';
import { manifest as profile }     from './ProfileScreen.manifest';
import { manifest as more }        from './MoreScreen.manifest';
import { manifest as familyops }   from './FamilyOpsScreen.manifest';
import { manifest as circle }      from './CircleScreen.manifest';
import { manifest as meds }        from './MedsScreen.manifest';
import { manifest as diary }       from './DiaryScreen.manifest';
import { manifest as focus }       from './FocusScreen.manifest';
import { manifest as score }       from './ScoreScreen.manifest';
import { manifest as sleep }       from './SleepScreen.manifest';
import { manifest as money }       from './MoneyScreen.manifest';
import { manifest as brief }       from './BriefScreen.manifest';
import { manifest as vault }       from './VaultScreen.manifest';
import { manifest as errands }     from './ErrandsScreen.manifest';
import { manifest as couple }      from './CoupleScreen.manifest';
import { manifest as kids }        from './KidsScreen.manifest';
import { manifest as onboard }     from './OnboardScreen.manifest';
import { manifest as settings }    from './SettingsScreen.manifest';
import { manifest as quests }      from './QuestsScreen.manifest';
import { manifest as widgets }     from './WidgetsScreen.manifest';
import { manifest as stats }       from './StatsScreen.manifest';
import { manifest as comingsoon }  from './ComingSoonScreen.manifest';

import type { ScreenManifest } from '../lib/screen-manifest';

export const SCREEN_MANIFESTS: Record<string, ScreenManifest> = {
  home, chat, habits, fitness, profile, more,
  familyops, family: circle, circle, meds, diary, focus,
  score, sleep, money, brief, vault, errands,
  couple, kids, onboard, settings,
  quests, widgets, stats, comingsoon,
};

/** All ops referenced by any screen — used by MCP server to expose only
 *  what the user can actually trigger. */
export const REACHABLE_OPS = new Set(
  Object.values(SCREEN_MANIFESTS).flatMap((m) => [...m.reads, ...m.writes]),
);

export const REACHABLE_COMMANDS = new Set(
  Object.values(SCREEN_MANIFESTS).flatMap((m) => m.commands),
);
