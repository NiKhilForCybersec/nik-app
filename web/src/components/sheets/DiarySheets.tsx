/* Nik — Diary compose + detail sheets
   Ported from www/screens/diary-sheets.jsx */

import React, { useState } from 'react';
import { I } from '../icons';
import { Chip } from '../primitives';

// ── Types ──────────────────────────────────────────
type Media = { kind: 'photo' | 'video'; src?: string; caption?: string };
type Voice = { duration: number; transcript?: string };

type DiaryEntryDraft = {
  title?: string;
  text?: string;
  mood?: number;
  tags?: string[];
  media?: Media[];
  voice?: Voice | null;
  weather?: string;
  location?: string;
  pillar?: string;
  score?: number;
  letterToFuture?: string | null;
};

type DiaryEntry = {
  id?: string;
  date?: string;
  dateLabel?: string;
  title?: string;
  text?: string;
  mood?: number;
  tags?: string[];
  media?: Media[];
  voice?: Voice;
  weather?: string;
  location?: string;
  aiPrompt?: string | null;
};

const MOOD_LABELS = ['Rough', 'Low', 'Steady', 'Bright', 'Great', 'Soaring'];
const MOOD_EMOJIS = ['😞','😕','😐','🙂','😊','🤩'];

const AI_DIARY_PROMPTS = [
  'What surprised you today?',
  'Who did you notice today?',
  'What is one thing you would tell tomorrow-you?',
  'When did time bend today — fast or slow?',
  'What is the smallest good thing that happened?',
  'What were you proud of, even if no one saw?',
];

const diaryInputStyle = (): React.CSSProperties => ({ width: '100%', padding: 11, borderRadius: 10, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', color: 'var(--fg)', fontSize: 13, outline: 'none', boxSizing: 'border-box' });

// ── DiaryComposeSheet ──────────────────────────────
type DiaryComposeSheetProps = {
  onClose: () => void;
  onAdd: (entry: DiaryEntryDraft) => void;
  prompt?: string;
};

export const DiaryComposeSheet: React.FC<DiaryComposeSheetProps> = ({ onClose, onAdd, prompt }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [recording, setRecording] = useState(false);
  const [letterToFuture, setLetterToFuture] = useState(false);
  const [futureDate, setFutureDate] = useState('1y');
  const [tagInput, setTagInput] = useState('');
  const [aiAssist, setAiAssist] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ title: string; rewrite: string; tags: string[]; mood: number } | null>(null);

  const STOCK_PHOTOS = [
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=400',
  ];

  const startRec = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setVoice({ duration: 24, transcript: 'Today felt slower in a good way. The light came in around four and I just sat with it.' });
    }, 2200);
  };

  const aiHelp = () => {
    setAiAssist(true);
    setTimeout(() => {
      setAiSuggestion({
        title: title || 'Sat with the afternoon light',
        rewrite: text + (text ? '\n\n' : '') + 'The kind of unhurried moment that I keep meaning to make space for. Note to self: this counts as work too.',
        tags: ['reflection', 'rest'],
        mood: Math.max(mood, 4),
      });
    }, 1100);
  };

  const acceptAi = () => {
    if (!aiSuggestion) return;
    setText(aiSuggestion.rewrite);
    if (!title) setTitle(aiSuggestion.title);
    setTags(Array.from(new Set([...tags, ...aiSuggestion.tags])));
    setMood(aiSuggestion.mood);
    setAiSuggestion(null);
    setAiAssist(false);
  };

  const save = () => {
    if (!text.trim() && !voice && media.length === 0) return;
    onAdd({
      title: title || (text.split('\n')[0].slice(0, 40) || 'Voice memo'),
      text,
      mood,
      tags,
      media,
      voice,
      weather: '☀️ 24°',
      location: 'Bandra · Cafe Zoe',
      pillar: 'mind',
      score: +5,
      letterToFuture: letterToFuture ? futureDate : null,
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--sheet-bg)', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 18, paddingBottom: 28, maxHeight: '94%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'var(--grabber)', borderRadius: 99, margin: '0 auto 14px' }}/>

        {/* Date + mood ring */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>New entry</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>SAT · APR 25 · 14:23</div>
          </div>
          <div onClick={save} className="tap" style={{ padding: '8px 14px', borderRadius: 99, background: (text || voice || media.length) ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))' : 'oklch(1 0 0 / 0.06)', color: (text || voice || media.length) ? '#06060a' : 'var(--fg-3)', fontWeight: 600, fontSize: 12 }}>Save</div>
        </div>

        {prompt && (
          <div style={{ padding: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', borderLeft: '2px solid oklch(0.78 0.16 var(--hue))', marginBottom: 10, fontStyle: 'italic', fontSize: 12, color: 'var(--fg-2)' }}>
            "{prompt}"
          </div>
        )}

        {/* Mood */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>HOW DID TODAY FEEL?</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
            {MOOD_EMOJIS.map((e, i) => (
              <div key={i} onClick={() => setMood(i)} className="tap" style={{ flex: 1, aspectRatio: '1', maxWidth: 48, borderRadius: 10, background: mood === i ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.03)', border: '1px solid ' + (mood === i ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 18, transform: mood === i ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.15s' }}>
                {e}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{MOOD_LABELS[mood]}</div>
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" style={{ ...diaryInputStyle(), fontSize: 16, fontWeight: 500, marginBottom: 8, fontFamily: 'var(--font-display)' }}/>

        {/* Text body */}
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" rows={4} style={{ ...diaryInputStyle(), fontFamily: 'var(--font-body, Inter)', resize: 'vertical', minHeight: 90, lineHeight: 1.5 }}/>

        {/* AI prompt picker */}
        <div style={{ display: 'flex', gap: 5, marginTop: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {AI_DIARY_PROMPTS.slice(0, 4).map((p, i) => (
            <div key={i} onClick={() => setText(t => t + (t ? '\n\n' : '') + p + ' ')} className="tap" style={{ padding: '5px 9px', borderRadius: 99, fontSize: 10, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>
              💭 {p}
            </div>
          ))}
        </div>

        {/* AI rewrite */}
        {!aiSuggestion && (
          <div onClick={aiHelp} className="tap" style={{ padding: 10, borderRadius: 10, marginBottom: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', border: '1px dashed oklch(0.78 0.16 var(--hue) / 0.3)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-2)' }}>
            <I.sparkles size={12} stroke="oklch(0.85 0.14 var(--hue))"/>
            {aiAssist ? <span style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>Nik is thinking…</span> : 'Let Nik help expand this'}
          </div>
        )}
        {aiSuggestion && (
          <div className="glass" style={{ padding: 12, marginBottom: 10, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)' }}>
            <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>NIK SUGGESTION</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{aiSuggestion.title}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4 }}>{aiSuggestion.rewrite}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <div onClick={() => setAiSuggestion(null)} className="tap" style={{ flex: 1, padding: 7, borderRadius: 8, background: 'oklch(1 0 0 / 0.05)', textAlign: 'center', fontSize: 11, color: 'var(--fg-2)' }}>No thanks</div>
              <div onClick={acceptAi} className="tap" style={{ flex: 1, padding: 7, borderRadius: 8, background: 'oklch(0.78 0.16 var(--hue) / 0.3)', color: 'oklch(0.9 0.14 var(--hue))', textAlign: 'center', fontSize: 11, fontWeight: 500 }}>Use this</div>
            </div>
          </div>
        )}

        {/* Voice memo */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>VOICE MEMO</div>
          {!voice && !recording && (
            <div onClick={startRec} className="tap" style={{ padding: 12, borderRadius: 10, border: '1.5px dashed var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
              <I.mic size={14}/> Hold to record (auto-transcribes)
            </div>
          )}
          {recording && (
            <div style={{ padding: 12, borderRadius: 10, background: 'oklch(0.65 0.22 25 / 0.15)', border: '1px solid oklch(0.65 0.22 25 / 0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.65 0.22 25)', animation: 'orb-pulse 1s ease-in-out infinite' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'oklch(0.85 0.18 25)', fontFamily: 'var(--font-mono)' }}>RECORDING…</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 4, height: 16, alignItems: 'center' }}>
                  {[...Array(20)].map((_, i) => <div key={i} style={{ width: 2, height: 4 + Math.random() * 12, background: 'oklch(0.85 0.18 25)', borderRadius: 2, animation: `wave ${0.5 + Math.random() * 0.6}s ease-in-out infinite`, animationDelay: i * 0.05 + 's' }}/>)}
                </div>
              </div>
            </div>
          )}
          {voice && !recording && (
            <div style={{ padding: 10, borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue) / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
                <div style={{ flex: 1, height: 18, display: 'flex', gap: 1, alignItems: 'center' }}>
                  {[...Array(40)].map((_, i) => <div key={i} style={{ flex: 1, height: 4 + Math.sin(i * 0.7) * 6 + Math.random() * 6, background: 'oklch(0.85 0.14 var(--hue) / 0.7)', borderRadius: 1 }}/>)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{voice.duration}s</div>
                <div onClick={() => setVoice(null)} className="tap" style={{ fontSize: 12, color: 'var(--fg-3)' }}>✕</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-2)', fontStyle: 'italic', lineHeight: 1.4 }}>"{voice.transcript}"</div>
            </div>
          )}
        </div>

        {/* Media */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>PHOTOS / VIDEO ({media.length})</div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {media.map((m, i) => (
              <div key={i} style={{ width: 64, height: 64, borderRadius: 8, background: `url(${m.src}) center/cover`, position: 'relative', flexShrink: 0 }}>
                <div onClick={() => setMedia(ms => ms.filter((_, j) => j !== i))} className="tap" style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: 'oklch(0 0 0 / 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✕</div>
              </div>
            ))}
            {STOCK_PHOTOS.filter(s => !media.find(m => m.src === s)).slice(0, 3).map((s, i) => (
              <div key={i} onClick={() => setMedia(ms => [...ms, { kind: 'photo', src: s }])} className="tap" style={{ width: 64, height: 64, borderRadius: 8, background: `url(${s}) center/cover`, opacity: 0.5, flexShrink: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.plus size={16} stroke="#fff"/>
                </div>
              </div>
            ))}
            <div className="tap" style={{ width: 64, height: 64, borderRadius: 8, border: '1.5px dashed var(--hairline-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: 'var(--fg-3)', gap: 3 }}>
              <I.camera size={14}/> Camera
            </div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>TAGS</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map(t => (
              <div key={t} className="tap" onClick={() => setTags(ts => ts.filter(x => x !== t))} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, background: 'oklch(0.78 0.16 var(--hue) / 0.18)', color: 'oklch(0.9 0.14 var(--hue))', display: 'flex', alignItems: 'center', gap: 4 }}>
                #{t} <span style={{ opacity: 0.6 }}>✕</span>
              </div>
            ))}
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput(''); } }} placeholder="+ tag" style={{ flex: 1, minWidth: 80, padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--fg)', fontSize: 11, outline: 'none' }}/>
          </div>
        </div>

        {/* Letter to future self */}
        <div onClick={() => setLetterToFuture(v => !v)} className="tap" style={{ padding: 10, borderRadius: 10, background: letterToFuture ? 'oklch(0.78 0.16 var(--hue) / 0.12)' : 'oklch(1 0 0 / 0.03)', border: '1px solid ' + (letterToFuture ? 'oklch(0.78 0.16 var(--hue) / 0.3)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: letterToFuture ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(1 0 0 / 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#06060a', fontWeight: 700 }}>{letterToFuture ? '✓' : ''}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>Letter to future self</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>Hidden until the date arrives</div>
          </div>
          {letterToFuture && (
            <select onClick={e => e.stopPropagation()} value={futureDate} onChange={e => setFutureDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', color: 'var(--fg)', fontSize: 11 }}>
              <option value="1m">1 month</option>
              <option value="3m">3 months</option>
              <option value="1y">1 year</option>
              <option value="5y">5 years</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// ── DiaryEntrySheet ────────────────────────────────
type DiaryEntrySheetProps = {
  entry: DiaryEntry;
  onClose: () => void;
};

export const DiaryEntrySheet: React.FC<DiaryEntrySheetProps> = ({ entry, onClose }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', backdropFilter: 'blur(16px)', zIndex: 80, overflowY: 'auto' }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className="fade-up" style={{ minHeight: '100%', padding: '60px 20px 40px', maxWidth: '100%' }}>
      <div onClick={onClose} className="tap" style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: 'oklch(1 0 0 / 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff' }}>✕</div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{entry.dateLabel} · {entry.weather || ''}</div>
      {entry.title && <div className="display" style={{ fontSize: 26, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.2, marginBottom: 12, color: 'var(--fg)' }}>{entry.title}</div>}
      {entry.mood !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--fg-2)' }}>
          <span style={{ fontSize: 24 }}>{MOOD_EMOJIS[entry.mood]}</span> {MOOD_LABELS[entry.mood]}
        </div>
      )}
      {entry.text && <div style={{ fontSize: 14, color: 'var(--fg)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>{entry.text}</div>}
      {(entry.media?.length ?? 0) > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: entry.media!.length === 1 ? '1fr' : '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {entry.media!.map((m, i) => (
            <div key={i} style={{ aspectRatio: '1.4', borderRadius: 12, background: `url(${m.src}) center/cover` }}/>
          ))}
        </div>
      )}
      {entry.voice && (
        <div className="glass" style={{ padding: 12, marginBottom: 14, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue) / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>VOICE · {entry.voice.duration}s</div>
          </div>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--fg-2)' }}>"{entry.voice.transcript}"</div>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {entry.tags?.map(t => <Chip key={t}>#{t}</Chip>)}
      </div>
      {entry.location && <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>📍 {entry.location}</div>}
      {entry.aiPrompt && (
        <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', borderLeft: '2px solid oklch(0.78 0.16 var(--hue))' }}>
          <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>NIK NOTICED</div>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--fg)' }}>"{entry.aiPrompt}"</div>
        </div>
      )}
    </div>
  </div>
);
