/* Nik — Score Detail Screen
   Full breakdown of the 0-1000 Nik score: pillars, recent events,
   backlog with makeup quests (gentle, non-punishing), trend chart.
*/

import React from 'react';
import type { ScreenProps } from '../App';
import { getTheme } from '../theme/themes';
import { I } from '../components/icons';
import { SCORE_PILLARS } from '../theme/score';
import { useOp } from '../lib/useOp';
import { score as scoreOps } from '../contracts/score';

export default function ScoreScreen({ themeId }: ScreenProps) {
  const snapshotQ = useOp(scoreOps.get, {});
  const recentQ   = useOp(scoreOps.recent, { limit: 20 });
  const backlogQ  = useOp(scoreOps.backlog, {});

  // Compose snapshot + ledger + backlog into the shape the existing UI expects.
  const snap = snapshotQ.data;
  const s: any = {
    total:  snap?.total   ?? 0,
    delta7d: snap?.delta_7d ?? 0,
    rank:   snap?.rank    ?? 'Loading',
    nextRank: snap?.next_rank ? { name: snap.next_rank, at: snap.next_rank_at } : null,
    pillars: snap?.pillars ?? {
      focus:  { value: 0, max: 300, weeklyGoal: 240, trend: [0, 0, 0, 0, 0, 0, 0] },
      health: { value: 0, max: 250, weeklyGoal: 220, trend: [0, 0, 0, 0, 0, 0, 0] },
      mind:   { value: 0, max: 250, weeklyGoal: 200, trend: [0, 0, 0, 0, 0, 0, 0] },
      family: { value: 0, max: 200, weeklyGoal: 170, trend: [0, 0, 0, 0, 0, 0, 0] },
    },
    todayContribution: snap?.today_contribution ?? 0,
    backlog: (backlogQ.data ?? []).map((b) => ({
      id: b.id, title: b.title, missed: b.missed_label, cost: b.cost,
      makeup: b.makeup, pillar: b.pillar, dismissable: b.dismissable, gentle: b.gentle,
    })),
    recent: (recentQ.data ?? []).map((e) => ({
      ts: new Date(e.occurred_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
      delta: e.delta, source: e.source, pillar: e.pillar,
    })),
  };
  const [activePillar, setActivePillar] = React.useState<string | null>(null);
  const t = themeId ? getTheme(themeId) : null;
  const rankPrefix = (t as any)?.vocab?.rankPrefix || 'OPERATIVE';
  const ranks: string[] = (t as any)?.vocab?.priority || ['E', 'D', 'C', 'B', 'A', 'S'];
  const tier = Math.min(ranks.length - 1, Math.floor((s.total ?? 0) / (1000 / ranks.length)));
  const currentRank = ranks[tier];
  const nextRankAt = Math.ceil((tier + 1) * (1000 / ranks.length));
  const pctToNext = Math.min(1, ((s.total ?? 0) - tier * (1000 / ranks.length)) / (1000 / ranks.length));

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>NIK SCORE</div>
        <div className="display" style={{ fontSize: 26, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case, none)' as any, letterSpacing: 'var(--display-tracking, 0)' as any }}>Your standing</div>
      </div>

      {/* Hero score card */}
      <div className="glass fade-up" style={{ padding: 18, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(circle at 30% 20%, oklch(0.78 0.16 var(--hue) / 0.18) 0%, transparent 60%)', pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 4 }}>{rankPrefix} {currentRank}</div>
            <div className="display" style={{ fontSize: 56, fontWeight: 300, fontVariantNumeric: 'tabular-nums', letterSpacing: -2, lineHeight: 1, color: 'oklch(0.94 0.12 var(--hue))' }}>{s.total}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: (s.delta7d ?? 0) > 0 ? 'oklch(0.75 0.18 140)' : 'oklch(0.75 0.18 25)' }}>{(s.delta7d ?? 0) > 0 ? '↗' : '↘'} {Math.abs(s.delta7d ?? 0)}</span> 7-day · +{s.todayContribution} today
            </div>
          </div>
          <div style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
            <svg width="80" height="80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="4"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ringGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - pctToNext)} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: 'drop-shadow(0 0 6px oklch(0.78 0.16 var(--hue) / 0.6))' }}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="display" style={{ fontSize: currentRank.length <= 3 ? 24 : currentRank.length <= 6 ? 13 : 11, fontWeight: 600, color: 'oklch(0.92 0.14 var(--hue))', lineHeight: 1, textTransform: currentRank.length > 3 ? 'uppercase' : 'none', letterSpacing: currentRank.length > 3 ? 0.5 : 0, maxWidth: 70, textAlign: 'center' }}>{currentRank}</div>
              <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{nextRankAt - (s.total ?? 0)} TO NEXT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 10 }}>FOUR PILLARS</div>
        {(SCORE_PILLARS as any[]).map((p) => {
          const data = s.pillars?.[p.id] ?? { value: 0, max: 1, weeklyGoal: 0, trend: [] };
          const pct = data.value / data.max;
          const goalPct = data.weeklyGoal / data.max;
          const onGoal = data.value >= data.weeklyGoal;
          const Ic = I[p.icon];
          return (
            <div key={p.id} onClick={() => setActivePillar(activePillar === p.id ? null : p.id)} className="tap" style={{ padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `oklch(0.78 0.16 ${p.color} / 0.18)`, border: `1px solid oklch(0.78 0.16 ${p.color} / 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Ic && <Ic size={13} stroke={`oklch(0.85 0.16 ${p.color})`}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{p.label}</div>
                    {onGoal && <div style={{ fontSize: 8, color: 'oklch(0.75 0.18 140)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>● ON GOAL</div>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>{p.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 18, fontWeight: 500, color: `oklch(0.9 0.14 ${p.color})`, fontVariantNumeric: 'tabular-nums' }}>{data.value}</div>
                  <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {data.max}</div>
                </div>
              </div>
              {/* progress bar with goal marker */}
              <div style={{ position: 'relative', height: 5, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, overflow: 'visible' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: `linear-gradient(90deg, oklch(0.78 0.16 ${p.color}), oklch(0.65 0.2 ${p.color + 30}))`, borderRadius: 99 }}/>
                <div style={{ position: 'absolute', left: `${goalPct * 100}%`, top: -3, height: 11, width: 1.5, background: 'oklch(1 0 0 / 0.5)' }}/>
              </div>
              {activePillar === p.id && (
                <div className="fade-up" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
                  <PillarTrend trend={data.trend ?? []} color={p.color}/>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.4 }}>
                    Weekly goal: <span style={{ color: 'var(--fg-2)' }}>{data.weeklyGoal}</span> · 7-day trend shown
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Backlog */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>BACKLOG · {(s.backlog ?? []).length}</div>
          <div style={{ fontSize: 10, color: 'oklch(0.75 0.18 140)', fontFamily: 'var(--font-mono)' }}>NO PUNISHMENT</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, marginBottom: 10, padding: 8, background: 'oklch(1 0 0 / 0.03)', borderRadius: 8 }}>
          Missed things go here gently. Score doesn't drop instantly — you have a 24h window. After that, small penalty + a makeup quest worth more.
        </div>
        {(s.backlog ?? []).map((b: any) => {
          const pillar = (SCORE_PILLARS as any[]).find(p => p.id === b.pillar) ?? { color: 200, icon: 'target' };
          const Ic = I[pillar.icon];
          return (
            <div key={b.id} className="fade-up" style={{ padding: 10, borderRadius: 10, background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--hairline)', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `oklch(0.78 0.16 ${pillar.color} / 0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {Ic && <Ic size={10} stroke={`oklch(0.85 0.16 ${pillar.color})`}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{b.title}</div>
                    {b.gentle && <div style={{ fontSize: 7, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1, padding: '1px 5px', borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue) / 0.15)' }}>GRACE</div>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{b.missed} · {b.cost === 0 ? 'no cost yet' : b.cost + ' nik'}</div>
                </div>
                {b.dismissable && <div className="tap" style={{ fontSize: 11, color: 'var(--fg-3)', padding: 2 }}>✕</div>}
              </div>
              <div className="tap" style={{ marginTop: 8, padding: 7, borderRadius: 7, background: 'oklch(0.78 0.16 var(--hue) / 0.1)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'oklch(0.9 0.14 var(--hue))' }}>↺ {b.makeup}</div>
                <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)' }}>DO IT →</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="glass fade-up" style={{ padding: 14 }}>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>RECENT MOVEMENTS</div>
        {(s.recent ?? []).map((r: any, i: number) => {
          const pillar = (SCORE_PILLARS as any[]).find(p => p.id === r.pillar) ?? { color: 200 };
          const positive = r.delta > 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < (s.recent ?? []).length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: `oklch(0.85 0.16 ${pillar.color})` }}/>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--fg-2)' }}>{r.source}</div>
              <div style={{ fontSize: 11, color: positive ? 'oklch(0.85 0.16 140)' : 'oklch(0.85 0.18 25)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{positive ? '+' : ''}{r.delta}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right' }}>{r.ts}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PillarTrend: React.FC<{ trend: number[]; color: number | string }> = ({ trend, color }) => {
  const w = 280, h = 36;
  if (!trend || trend.length === 0) return null;
  const max = Math.max(...trend) * 1.05;
  const min = Math.min(...trend) * 0.95;
  const range = max - min || 1;
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y] as [number, number];
  });
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const fill = `M0,${h} ` + path.slice(1) + ` L${w},${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`gr${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`oklch(0.78 0.16 ${color})`} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={`oklch(0.78 0.16 ${color})`} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#gr${color})`}/>
      <path d={path} fill="none" stroke={`oklch(0.85 0.16 ${color})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 2.5 : 1.5} fill={`oklch(0.9 0.16 ${color})`}/>
      ))}
    </svg>
  );
};
