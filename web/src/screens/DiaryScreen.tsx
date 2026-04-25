/* Nik — Diary screen
   Daily diary with thoughts, photos, videos, voice, mood, AI prompts,
   on-this-day flashbacks, location pinning, AI summary.
*/

import React from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { DiaryComposeSheet, DiaryEntrySheet } from '../components/sheets/DiarySheets';

type Media = { kind: 'photo' | 'video'; src?: string; caption?: string };
type Voice = { duration: number; transcript?: string };
type DiaryEntry = {
  id: string;
  date: string;
  dateLabel: string;
  mood?: number;
  weather?: string;
  location?: string;
  title?: string;
  text?: string;
  media?: Media[];
  tags?: string[];
  aiPrompt?: string | null;
  voice?: Voice;
  pillar?: string;
  score?: number;
};

const MOCK_DIARY: DiaryEntry[] = [
  {
    id: 'd1', date: '2026-04-25', dateLabel: 'Today',
    mood: 4, weather: '☀️ 24°', location: 'Bandra · Cafe Zoe',
    title: 'Long morning, finally',
    text: "Slept past the alarm and didn't feel guilty about it. Aanya drew a dragon at breakfast and named it Pomelo.",
    media: [
      { kind: 'photo', src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', caption: 'Cafe Zoe' },
    ],
    tags: ['family', 'aanya'],
    aiPrompt: 'You named your sleep "earned, not stolen" today. What changed?',
    voice: { duration: 47, transcript: 'Pomelo the dragon eats only mangoes apparently.' },
    pillar: 'mind',
    score: +5,
  },
  {
    id: 'd2', date: '2026-04-24', dateLabel: 'Yesterday',
    mood: 3, weather: '🌧 22°', location: 'Home',
    title: 'Stuck on the spec',
    text: 'The architecture diagram for the new sync engine refuses to land. Three rewrites in. Tomorrow I block 9–11 with no slack.',
    media: [],
    tags: ['work', 'frustration'],
    aiPrompt: null,
    pillar: 'mind',
    score: +3,
  },
  {
    id: 'd3', date: '2026-04-23', dateLabel: 'Wed · Apr 23',
    mood: 5, weather: '☀️ 26°', location: 'Versova Beach',
    title: 'First proper run since the surgery',
    text: '5km without stopping. Lungs sang. Reminded me what the body was for before laptops.',
    media: [
      { kind: 'photo', src: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=400' },
      { kind: 'photo', src: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=400' },
    ],
    tags: ['health', 'milestone'],
    pillar: 'health',
    score: +8,
  },
  {
    id: 'd4', date: '2026-04-22', dateLabel: 'Tue · Apr 22',
    mood: 4, weather: '🌤 25°', location: "Home · Anya's room",
    title: 'Bedtime story #214',
    text: 'Anya asked if grown-ups have favourite stuffed animals. I lied and said no. Pomelo would be embarrassed.',
    tags: ['family', 'kids'],
    media: [],
    pillar: 'family',
    score: +5,
  },
];

const ON_THIS_DAY = [
  { yearsAgo: 1, title: "Anya's 4th birthday", preview: 'She blew out the candles in two attempts and demanded a re-shoot.', date: 'Apr 25, 2025' },
  { yearsAgo: 2, title: 'Quit the agency', preview: 'Last day at Zenith. Drove home with the windows down. Felt like air.', date: 'Apr 25, 2024' },
];

export default function DiaryScreen(_props: ScreenProps) {
  const [entries, setEntries] = React.useState<DiaryEntry[]>(MOCK_DIARY);
  const [composeOpen, setComposeOpen] = React.useState<boolean | { prompt?: string }>(false);
  const [activeEntry, setActiveEntry] = React.useState<any>(null);
  const [filter, setFilter] = React.useState<string>('all');

  const addEntry = (entry: any) => {
    setEntries(es => [{ id: 'd' + Date.now(), date: '2026-04-25', dateLabel: 'Just now', ...entry }, ...es]);
    setComposeOpen(false);
  };

  const filtered = entries.filter(e => {
    if (filter === 'photos') return (e.media || []).some(m => m.kind === 'photo' || m.kind === 'video');
    if (filter === 'voice') return !!e.voice;
    if (filter === 'mood') return (e.mood ?? 0) >= 4;
    return true;
  });

  const last7Mood = entries.slice(0, 7).map(e => e.mood || 3).reverse();
  const avgMood = (last7Mood.reduce((a, b) => a + b, 0) / last7Mood.length).toFixed(1);

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DIARY · 184 ENTRIES</div>
        <div className="display" style={{ fontSize: 26, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case, none)' as any, letterSpacing: 'var(--display-tracking, 0)' as any }}>Your private record</div>
      </div>

      {/* Mood spark + on this day */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>MOOD · 7 DAYS</div>
          <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>{avgMood} <span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400 }}>avg</span></div>
          <MoodSpark values={last7Mood}/>
        </div>
        {ON_THIS_DAY[0] && (
          <div onClick={() => setActiveEntry({ ...ON_THIS_DAY[0], dateLabel: ON_THIS_DAY[0].date, text: ON_THIS_DAY[0].preview })} className="tap" style={{ flex: 1.4, padding: 10, borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.25)' }}>
            <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>ON THIS DAY · {ON_THIS_DAY[0].yearsAgo}Y AGO</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{ON_THIS_DAY[0].title}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-2)', marginTop: 3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ON_THIS_DAY[0].preview}</div>
          </div>
        )}
      </div>

      {/* AI prompt today */}
      <div className="glass fade-up" style={{ padding: 12, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 10, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.25)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I.sparkles size={14} stroke="#06060a"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 3 }}>NIK PROMPT · TODAY</div>
          <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.4, fontStyle: 'italic' }}>"What did you learn this morning that yesterday-you didn't know?"</div>
          <div onClick={() => setComposeOpen({ prompt: 'What did you learn this morning…' })} className="tap" style={{ marginTop: 7, fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Answer this <I.chevR size={9}/>
          </div>
        </div>
      </div>

      {/* Filters + capture row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {[['all', 'All'], ['photos', 'Photos'], ['voice', 'Voice'], ['mood', 'Bright days']].map(([k, l]) => (
          <div key={k} onClick={() => setFilter(k)} className="tap" style={{ padding: '6px 11px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap', background: filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: filter === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{l}</div>
        ))}
      </div>

      {/* Entry timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(e => <EntryCard key={e.id} entry={e} onClick={() => setActiveEntry(e)}/>)}
      </div>

      {/* Compose FAB */}
      <div onClick={() => setComposeOpen(true)} className="tap" style={{ position: 'fixed', right: 'calc(50% - 158px)', bottom: 100, zIndex: 30, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px oklch(0.78 0.16 var(--hue) / 0.5)' }}>
        <I.plus size={22} stroke="#06060a" sw={2.4 as any}/>
      </div>

      {composeOpen && <DiaryComposeSheet onClose={() => setComposeOpen(false)} onAdd={addEntry} prompt={typeof composeOpen === 'object' ? composeOpen?.prompt : undefined}/>}
      {activeEntry && <DiaryEntrySheet entry={activeEntry} onClose={() => setActiveEntry(null)}/>}
    </div>
  );
}

// ── Entry card ─────────────────────────────────────
const EntryCard: React.FC<{ entry: DiaryEntry; onClick: () => void }> = ({ entry, onClick }) => {
  const moods = ['😞', '😕', '😐', '🙂', '😊', '🤩'];
  return (
    <div onClick={onClick} className="glass tap fade-up" style={{ padding: 12, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>{entry.dateLabel}</div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>· {entry.weather}</div>
        <div style={{ flex: 1 }}/>
        {entry.mood !== undefined && <div style={{ fontSize: 14 }}>{moods[entry.mood]}</div>}
      </div>
      {entry.title && <div className="display" style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--fg)' }}>{entry.title}</div>}
      {entry.text && <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.text}</div>}
      {(entry.media?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto' }}>
          {entry.media!.slice(0, 3).map((m, i) => (
            <div key={i} style={{ width: 70, height: 70, borderRadius: 8, background: m.src ? `url(${m.src}) center/cover` : 'oklch(0.3 0.05 var(--hue))', flexShrink: 0, position: 'relative' }}>
              {m.kind === 'video' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 22, height: 22, borderRadius: '50%', background: 'oklch(0 0 0 / 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div></div>}
            </div>
          ))}
          {entry.media!.length > 3 && <div style={{ width: 70, height: 70, borderRadius: 8, background: 'oklch(1 0 0 / 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--fg-2)', flexShrink: 0 }}>+{entry.media!.length - 3}</div>}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
        {entry.location && <span>📍 {entry.location}</span>}
        {entry.voice && <span>· 🎙 {entry.voice.duration}s</span>}
        {entry.tags?.slice(0, 3).map(t => <span key={t}>#{t}</span>)}
        <span style={{ flex: 1 }}/>
        {entry.score && <span style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>+{entry.score} mind</span>}
      </div>
    </div>
  );
};

// ── Mood sparkline ─────────────────────────────────
const MoodSpark: React.FC<{ values: number[] }> = ({ values }) => {
  const w = 140, h = 28;
  const max = 5, min = 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as [number, number];
  });
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={w} height={h} style={{ marginTop: 4, overflow: 'visible' }}>
      <path d={path} fill="none" stroke="oklch(0.78 0.16 var(--hue))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.8" fill={i === points.length - 1 ? 'oklch(0.9 0.18 var(--hue))' : 'oklch(0.78 0.16 var(--hue) / 0.6)'}/>
      ))}
    </svg>
  );
};
