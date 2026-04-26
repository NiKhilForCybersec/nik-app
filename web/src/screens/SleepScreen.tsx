/* Nik — Sleep & Bedtime ritual */

import React from 'react';
import type { ScreenProps } from '../App';
import { useOp } from '../lib/useOp';
import { sleep as sleepOps, type SleepNight } from '../contracts/sleep';

type SleepStage = 'awake' | 'light' | 'deep' | 'rem';
type StageSeg = { stage: SleepStage; start: number; end: number };
type Dream = { date: string; tag: string; mood: string; text: string };

const FALLBACK = {
  lastNight: { score: 0, hours: 0, deep: 0, rem: 0, light: 0, awake: 0 },
  trend7: [0, 0, 0, 0, 0, 0, 0],
  bedtime: '—', wake: '—',
  goal: 8,
  stages: [] as StageSeg[],
  dreams: [] as Dream[],
};

const fmtNightLabel = (dateStr: string, idx: number) => {
  if (idx === 0) return 'Last night';
  if (idx === 1) return '2 nights ago';
  if (idx < 7)   return `${idx + 1} nights ago`;
  return new Date(dateStr).toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export default function SleepScreen(_props: ScreenProps) {
  const [tab, setTab] = React.useState<'overview' | 'wind-down' | 'dreams' | 'alarm'>('overview');
  const [windDownActive, setWindDownActive] = React.useState(false);

  const nightsQ = useOp(sleepOps.recent, { limit: 14 });
  const nights: SleepNight[] = nightsQ.data ?? [];

  // Compose the existing UI shape from DB rows.
  const last = nights[0];
  const stagesObj = (last?.stages as { minutes?: Record<string, number>; segments?: StageSeg[] } | undefined) ?? {};
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const lastNight = last ? {
    score: last.score ?? 0,
    hours: round1((last.duration_min ?? 0) / 60),
    deep:  round1((stagesObj.minutes?.deep  ?? 0) / 60),
    rem:   round1((stagesObj.minutes?.rem   ?? 0) / 60),
    light: round1((stagesObj.minutes?.light ?? 0) / 60),
    awake: round1((stagesObj.minutes?.awake ?? 0) / 60),
  } : FALLBACK.lastNight;
  const bedtime = last?.asleep_at ? new Date(last.asleep_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : FALLBACK.bedtime;
  const wake    = last?.woke_at   ? new Date(last.woke_at).toLocaleTimeString([],   { hour: '2-digit', minute: '2-digit', hour12: false }) : FALLBACK.wake;
  const trend7 = nights.slice(0, 7).map((n) => n.score ?? 0).reverse();
  const stages: StageSeg[] = (stagesObj.segments as StageSeg[]) ?? FALLBACK.stages;
  const dreams: Dream[] = nights.flatMap((n, i) =>
    (n.dreams ?? []).map((d) => ({
      date: fmtNightLabel(n.night_date, i),
      tag: (d.tags?.[0] ?? 'note') as string,
      mood: (d.mood ?? 'unsaid') as string,
      text: d.text,
    })),
  );
  const s = { lastNight, trend7, bedtime, wake, goal: 8, stages, dreams };

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>SLEEP · LAST NIGHT</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' as any }}>Sleep</div>
      </div>

      {/* Score ring */}
      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="48" cy="48" r="40" fill="none" stroke="var(--hairline)" strokeWidth="6"/>
            <circle cx="48" cy="48" r="40" fill="none" stroke="oklch(0.7 0.15 var(--hue))" strokeWidth="6" strokeDasharray={`${(s.lastNight.score / 100) * 251} 251`} strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 24, fontWeight: 600, color: 'oklch(0.92 0.14 var(--hue))', lineHeight: 1 }}>{s.lastNight.score}</div>
            <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>SCORE</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--fg)' }}>{s.lastNight.hours}h</div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>{s.bedtime} → {s.wake}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, lineHeight: 1.5 }}>
            DEEP <span style={{ color: 'var(--fg)' }}>{s.lastNight.deep}h</span> · REM <span style={{ color: 'var(--fg)' }}>{s.lastNight.rem}h</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 3, background: 'var(--input-bg)', borderRadius: 12 }}>
        {([['overview', 'Stages'], ['wind-down', 'Wind-down'], ['dreams', 'Dreams'], ['alarm', 'Alarm']] as const).map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)} className="tap" style={{ flex: 1, padding: '8px 4px', borderRadius: 9, textAlign: 'center', background: tab === k ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'transparent', color: tab === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)', fontSize: 11, fontWeight: tab === k ? 600 : 400 }}>{l}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Hypnogram */}
          <div className="glass fade-up" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 10 }}>HYPNOGRAM · 7H 24M</div>
            <div style={{ position: 'relative', height: 80 }}>
              {(['awake', 'rem', 'light', 'deep'] as SleepStage[]).map((stage, row) => {
                const y = row * 20;
                const colors: Record<SleepStage, string> = { awake: 'oklch(0.7 0.18 30)', rem: 'oklch(0.7 0.18 var(--hue))', light: 'oklch(0.6 0.12 var(--hue))', deep: 'oklch(0.45 0.15 var(--hue))' };
                return (
                  <div key={stage} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 36, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{stage.toUpperCase()}</div>
                    <div style={{ flex: 1, position: 'relative', height: 14 }}>
                      {s.stages.filter(seg => seg.stage === stage).map((seg, i) => (
                        <div key={i} style={{ position: 'absolute', left: seg.start + '%', width: (seg.end - seg.start) + '%', top: 0, bottom: 0, background: colors[stage], borderRadius: 3 }}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 8, paddingLeft: 42 }}>
              <span>23:15</span><span>02:00</span><span>04:30</span><span>06:45</span>
            </div>
          </div>

          {/* 7 day trend */}
          <div className="glass fade-up" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>LAST 7 NIGHTS</div>
              <div style={{ fontSize: 11, color: 'var(--ok)' }}>+6 vs avg</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
              {s.trend7.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: (v / 100 * 60) + 'px', background: i === 6 ? 'linear-gradient(180deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))' : 'oklch(0.78 0.16 var(--hue) / 0.25)', borderRadius: 4 }}/>
                  <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass fade-up" style={{ padding: 14, background: 'oklch(0.78 0.16 var(--hue) / 0.06)' }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>NIK NOTICED</div>
            <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>Your deep sleep peaks when you're in bed before <b>23:00</b>. You missed that window 3 of the last 7 nights.</div>
          </div>
        </>
      )}

      {tab === 'wind-down' && (
        <>
          <div className="glass fade-up" style={{ padding: 16, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 60% at 50% 100%, oklch(0.5 0.22 var(--hue) / 0.25), transparent 60%)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>STARTS IN 47 MIN</div>
              <div className="display" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>Tonight's wind-down</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[
                  { t: '22:30', label: 'Dim lights to 30%', icon: 'sun' },
                  { t: '22:45', label: 'Last sip of water', icon: 'droplet' },
                  { t: '23:00', label: 'Phone → Do Not Disturb', icon: 'phone' },
                  { t: '23:10', label: '5-min breathing · 4-7-8', icon: 'wind' },
                  { t: '23:15', label: 'Lights out', icon: 'moon' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--input-bg)' }}>
                    <div style={{ fontSize: 10, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', width: 38 }}>{step.t}</div>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--fg)' }}>{step.label}</div>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--hairline-strong)' }}/>
                  </div>
                ))}
              </div>
              <div onClick={() => setWindDownActive(!windDownActive)} className="tap" style={{ padding: 12, borderRadius: 12, background: windDownActive ? 'oklch(0.55 0.18 var(--hue) / 0.2)' : 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', textAlign: 'center', fontWeight: 600, fontSize: 13, color: windDownActive ? 'oklch(0.9 0.14 var(--hue))' : '#06060a' }}>
                {windDownActive ? 'Active · Nik is guiding you' : 'Start now'}
              </div>
            </div>
          </div>

          <div className="glass fade-up" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>SOUNDS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Rain on a tin roof', 'Brown noise', 'Forest at dusk', 'Tibetan bowls'].map(snd => (
                <div key={snd} className="tap" style={{ padding: 10, borderRadius: 10, background: 'var(--input-bg)', fontSize: 11, color: 'var(--fg-2)' }}>{snd}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'dreams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.dreams.map((d, i) => (
            <div key={i} className="glass fade-up" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{d.date.toUpperCase()}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue) / 0.15)', color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{d.tag.toUpperCase()}</div>
                  <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'var(--input-bg)', color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{d.mood.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55, fontFamily: 'var(--font-body, inherit)' }}>{d.text}</div>
            </div>
          ))}
          <div className="tap" style={{ padding: 14, borderRadius: 14, border: '1.5px dashed var(--hairline-strong)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>+ Voice-record this morning's dream</div>
        </div>
      )}

      {tab === 'alarm' && (
        <>
          <div className="glass fade-up" style={{ padding: 18, marginBottom: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>SMART WAKE · 06:30 → 06:50</div>
            <div className="display" style={{ fontSize: 42, fontWeight: 500, color: 'oklch(0.9 0.14 var(--hue))', lineHeight: 1 }}>06:45</div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6 }}>Wakes you in your lightest sleep within the window.</div>
          </div>
          <div className="glass fade-up" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>WAKE WITH</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([['Soft chimes — fade in 3 min', true], ['Birdsong + light increase', false], ['Vibration only', false]] as const).map(([l, on], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, background: 'var(--input-bg)' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg)' }}>{l}</span>
                  <div style={{ width: 32, height: 18, borderRadius: 99, background: on ? 'oklch(0.7 0.15 var(--hue))' : 'var(--hairline-strong)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
