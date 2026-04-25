/* Nik — Nik Score System
   A holistic 0-1000 score across 4 pillars, plus a backlog of missed tasks
   that don't punish hard but accumulate as gentle nudges + makeup quests.
*/

import { getTheme } from './themes';

export const SCORE_PILLARS = [
  { id: 'focus',  label: 'Focus',  icon: 'target',   weight: 0.30, color: 220, desc: 'Deep work · sessions · attention' },
  { id: 'health', label: 'Health', icon: 'heart',    weight: 0.25, color: 25,  desc: 'Movement · meds · sleep' },
  { id: 'mind',   label: 'Mind',   icon: 'sparkles', weight: 0.25, color: 280, desc: 'Diary · mood · learning' },
  { id: 'family', label: 'Family', icon: 'family',   weight: 0.20, color: 150, desc: 'Time together · ops · pings' },
];

export const MOCK_SCORE: Record<string, any> = {
  total: 742,
  delta7d: +28,
  rank: 'Operative II',
  nextRank: { name: 'Operative I', at: 800 },
  pillars: {
    focus:  { value: 218, max: 300, weeklyGoal: 240, trend: [180, 195, 210, 220, 215, 218, 218] },
    health: { value: 195, max: 250, weeklyGoal: 220, trend: [170, 185, 190, 195, 195, 195, 195] },
    mind:   { value: 184, max: 250, weeklyGoal: 200, trend: [150, 160, 170, 175, 180, 184, 184] },
    family: { value: 145, max: 200, weeklyGoal: 170, trend: [130, 135, 140, 142, 144, 145, 145] },
  },
  todayContribution: 18,
  backlog: [
    { id: 'b1', title: 'Mom\'s call', missed: 'Yesterday', cost: -3, makeup: 'Call mom today (+5)', pillar: 'family', dismissable: true },
    { id: 'b2', title: 'Anya\'s dentist (rebook)', missed: '2 days ago', cost: -2, makeup: 'Book within 48h (+3)', pillar: 'family' },
    { id: 'b3', title: 'Iron tablet (Sun)', missed: 'Sunday', cost: -1, makeup: 'Take tonight (+2)', pillar: 'health' },
    { id: 'b4', title: 'Reading 30min', missed: 'Today', cost: 0, makeup: 'Catch up before bed (+4)', pillar: 'mind', dismissable: true, gentle: true },
  ],
  recent: [
    { ts: '2h ago', delta: +8, source: 'Focus 50min · Spec writing', pillar: 'focus' },
    { ts: '4h ago', delta: +3, source: 'B12 + Multivitamin', pillar: 'health' },
    { ts: '6h ago', delta: +5, source: 'Diary · morning entry', pillar: 'mind' },
    { ts: 'Yest',  delta: -3, source: 'Missed: Call mom',     pillar: 'family' },
    { ts: 'Yest',  delta: +4, source: 'Workout · arms day',   pillar: 'health' },
  ],
};

// Score → rank (Avengers theme uses operatives, others use rank prefix)
export const scoreToRank = (score: number, themeId?: string): { prefix: string; rank: string; tier: number } => {
  const t = themeId ? getTheme(themeId) : null;
  const prefix = t?.vocab?.rankPrefix || 'RANK';
  const ranks = t?.vocab?.priority || ['E','D','C','B','A','S'];
  const tier = Math.min(ranks.length - 1, Math.floor(score / (1000 / ranks.length)));
  return { prefix, rank: ranks[tier], tier };
};
