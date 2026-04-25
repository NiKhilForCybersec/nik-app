/* Nik — Fitness screen: coach, library, form guide */
import React from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner, Waveform } from '../components/primitives';

const EXERCISES: Array<Record<string, any>> = [
  { id: 'e1', name: 'Bench Press', group: 'Chest', equip: 'Barbell', difficulty: 'Intermediate', hue: 25, pr: '85kg × 5', last: '2d ago' },
  { id: 'e2', name: 'Back Squat', group: 'Legs', equip: 'Barbell', difficulty: 'Advanced', hue: 280, pr: '120kg × 3', last: '4d ago' },
  { id: 'e3', name: 'Deadlift', group: 'Back', equip: 'Barbell', difficulty: 'Advanced', hue: 220, pr: '140kg × 2', last: '1w ago' },
  { id: 'e4', name: 'Pull-up', group: 'Back', equip: 'Bodyweight', difficulty: 'Intermediate', hue: 150, pr: 'BW+15 × 6', last: '1d ago' },
  { id: 'e5', name: 'Overhead Press', group: 'Shoulders', equip: 'Barbell', difficulty: 'Intermediate', hue: 320, pr: '55kg × 5', last: '3d ago' },
  { id: 'e6', name: 'Romanian Deadlift', group: 'Legs', equip: 'Barbell', difficulty: 'Intermediate', hue: 40, pr: '100kg × 8', last: '4d ago' },
  { id: 'e7', name: 'Dumbbell Row', group: 'Back', equip: 'Dumbbell', difficulty: 'Beginner', hue: 200, pr: '32kg × 10', last: '1d ago' },
  { id: 'e8', name: 'Goblet Squat', group: 'Legs', equip: 'Dumbbell', difficulty: 'Beginner', hue: 180, pr: '28kg × 12', last: '5d ago' },
];

const GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function FitnessScreen({ onNav: _onNav }: ScreenProps) {
  const [tab, setTab] = React.useState('coach'); // coach | library | plan | detail
  const [group, setGroup] = React.useState('All');
  const [selected, setSelected] = React.useState<Record<string, any> | null>(null);
  const [query, setQuery] = React.useState('');

  const filtered = EXERCISES.filter(e =>
    (group === 'All' || e.group === group) &&
    (!query || e.name.toLowerCase().includes(query.toLowerCase()))
  );

  if (selected) return <ExerciseDetail exercise={selected} onBack={() => setSelected(null)}/>;

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>TRAINING · GUIDED BY AI</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Fitness</div>
      </div>

      {/* Live metrics strip (Apple Health) */}
      <div className="glass fade-up" style={{ padding: 12, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', boxShadow: '0 0 6px oklch(0.78 0.15 150)', animation: 'breathe 1.5s infinite' }}/>
          <span style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>APPLE HEALTH · LIVE</span>
        </div>
        <div style={{ flex: 1 }}/>
        {[
          ['HR', '72'],
          ['STEPS', '6.2k'],
          ['KCAL', '480'],
          ['SLEEP', '7.4h'],
        ].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 11, color: 'oklch(0.9 0.14 var(--hue))', fontWeight: 600 }}>{v}</div>
            <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['coach', 'AI Coach'], ['library', 'Library'], ['plan', "Today's Plan"]].map(([id, l]) => (
          <div key={id} onClick={() => setTab(id)} className="tap" style={{
            flex: 1, padding: '8px 10px', borderRadius: 12, textAlign: 'center', fontSize: 12,
            background: tab === id ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
            border: '1px solid ' + (tab === id ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
            color: tab === id ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
          }}>{l}</div>
        ))}
      </div>

      {tab === 'coach' && <CoachTab onOpen={setSelected}/>}
      {tab === 'library' && <LibraryTab group={group} setGroup={setGroup} query={query} setQuery={setQuery} filtered={filtered} onOpen={setSelected}/>}
      {tab === 'plan' && <PlanTab onOpen={setSelected}/>}
    </div>
  );
}

// ── Coach tab (AI chat-style for fitness) ────────────
const CoachTab: React.FC<{ onOpen: (e: Record<string, any>) => void }> = ({ onOpen }) => {
  const [thinking, setThinking] = React.useState(false);
  const [showResult, setShowResult] = React.useState(true);

  const askPerfectForm = () => {
    setShowResult(false);
    setThinking(true);
    setTimeout(() => { setThinking(false); setShowResult(true); }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Prompt you asked */}
      <div className="fade-up" style={{ alignSelf: 'flex-end', maxWidth: '85%', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.25), oklch(0.65 0.22 calc(var(--hue) + 60) / 0.15))', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.3)', fontSize: 13 }}>
        I like bench press — what's the perfect form? Show me.
      </div>

      {thinking ? (
        <div className="glass" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Waveform active bars={5} height={16}/>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>GPT-4o · GENERATING FORM GUIDE…</span>
        </div>
      ) : showResult && (
        <div className="glass fade-up" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
            <span style={{ fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NIK · VIA CHATGPT</span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>2.4s</span>
          </div>

          {/* Animated form demo */}
          <FormAnimation exercise="Bench Press"/>

          <div className="display" style={{ fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>Barbell Bench Press · Perfect form</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>CHEST · PUSH · INTERMEDIATE</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: 1, t: 'Setup', d: 'Lie flat, eyes under the bar. Retract shoulder blades, plant feet firmly.' },
              { n: 2, t: 'Grip', d: 'Hands 1.5x shoulder width, wrists stacked over elbows. Break the bar apart.' },
              { n: 3, t: 'Descent', d: 'Lower to mid-chest with control, elbows at ~70° from torso. 2–3s tempo.' },
              { n: 4, t: 'Press', d: 'Drive up & back toward face. Exhale at the top. Maintain arch & leg drive.' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'oklch(1 0 0 / 0.03)', borderRadius: 10, borderLeft: '2px solid oklch(0.78 0.16 var(--hue))' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue))', color: '#06060a', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Common mistakes */}
          <div style={{ marginTop: 12, padding: 10, background: 'oklch(0.70 0.20 25 / 0.08)', border: '1px solid oklch(0.70 0.20 25 / 0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: 'oklch(0.85 0.15 25)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>AVOID</div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.5 }}>
              <b>Flared elbows</b> (90°) → shoulder stress · <b>Bouncing</b> the bar · <b>Lifting feet</b> → loss of drive
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <div className="tap" style={{ padding: '7px 12px', borderRadius: 99, fontSize: 11, background: 'oklch(0.78 0.16 var(--hue) / 0.2)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', color: 'oklch(0.9 0.14 var(--hue))', fontWeight: 500 }}>
              Add to today's workout
            </div>
            <div onClick={() => onOpen(EXERCISES[0])} className="tap" style={{ padding: '7px 12px', borderRadius: 99, fontSize: 11, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', color: 'var(--fg-2)' }}>
              Full detail →
            </div>
            <div onClick={askPerfectForm} className="tap" style={{ padding: '7px 12px', borderRadius: 99, fontSize: 11, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', color: 'var(--fg-2)' }}>
              Regenerate
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 6 }}>TRY ASKING</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {["Build me a 4-day push/pull/legs", "Why am I plateauing on squat?", "Show deadlift cues", "30-min hotel workout"].map(s => (
          <div key={s} className="tap" style={{ padding: '7px 11px', borderRadius: 99, fontSize: 11, background: 'var(--glass)', border: '1px solid var(--hairline)', color: 'var(--fg-2)' }}>{s}</div>
        ))}
      </div>
    </div>
  );
};

// ── Animated form diagram (CSS-only, not realistic body, abstract HUD) ─
const FormAnimation: React.FC<{ exercise: string }> = ({ exercise }) => (
  <div style={{
    aspectRatio: '16 / 10', borderRadius: 14, position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, oklch(0.20 0.03 260), oklch(0.13 0.02 260))',
    border: '1px solid oklch(0.78 0.16 var(--hue) / 0.3)',
  }}>
    {/* grid */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}/>

    {/* HUD corners */}
    <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>

    {/* Label top-left */}
    <div style={{ position: 'absolute', top: 10, left: 14, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'oklch(0.9 0.14 var(--hue))', letterSpacing: 1.5 }}>CHAT GPT · FORM DEMO</div>
    <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'oklch(0.78 0.15 150)', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', animation: 'breathe 1.2s infinite' }}/>
      LOOPING
    </div>

    {/* Stick figure benching */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 120" width="70%" style={{ overflow: 'visible' }}>
        {/* Bench */}
        <rect x="40" y="82" width="120" height="6" rx="2" fill="oklch(1 0 0 / 0.2)"/>
        <rect x="50" y="88" width="4" height="18" fill="oklch(1 0 0 / 0.2)"/>
        <rect x="146" y="88" width="4" height="18" fill="oklch(1 0 0 / 0.2)"/>
        {/* Body — lying on bench */}
        <g>
          {/* Head */}
          <circle cx="55" cy="75" r="6" fill="none" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          {/* Torso */}
          <line x1="62" y1="77" x2="130" y2="78" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          {/* Hips */}
          <circle cx="130" cy="78" r="2.5" fill="oklch(0.9 0.14 var(--hue))"/>
          {/* Legs */}
          <line x1="130" y1="78" x2="150" y2="85" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          <line x1="150" y1="85" x2="150" y2="110" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          <line x1="130" y1="78" x2="145" y2="88" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          <line x1="145" y1="88" x2="145" y2="110" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="1.5"/>
          {/* Arms — animated */}
          <g style={{ transformOrigin: '80px 77px', animation: 'benchArm 2.4s ease-in-out infinite' }}>
            <line x1="80" y1="77" x2="80" y2="55" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="2"/>
            <line x1="80" y1="55" x2="80" y2="38" stroke="oklch(0.9 0.14 var(--hue))" strokeWidth="2"/>
            {/* Bar */}
            <rect x="45" y="35" width="70" height="3" rx="1.5" fill="oklch(0.95 0.1 var(--hue))"/>
            <circle cx="45" cy="36.5" r="6" fill="oklch(0.6 0.18 var(--hue))"/>
            <circle cx="115" cy="36.5" r="6" fill="oklch(0.6 0.18 var(--hue))"/>
          </g>
        </g>
        {/* Direction arrows (animated glow) */}
        <g style={{ animation: 'breathe 2.4s ease-in-out infinite' }}>
          <path d="M170 50 L170 80" stroke="oklch(0.82 0.17 40)" strokeWidth="1.5" strokeDasharray="3 2" fill="none" markerEnd="url(#arrowH)"/>
        </g>
        <defs>
          <marker id="arrowH" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.82 0.17 40)"/>
          </marker>
        </defs>
      </svg>
    </div>

    <style>{`
      @keyframes benchArm {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(20px) scaleY(0.5); }
      }
    `}</style>

    {/* Form cue overlay */}
    <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
      <span style={{ color: 'oklch(0.82 0.17 40)' }}>◀ ECCENTRIC 2s</span>
      <span style={{ color: 'var(--fg-3)' }}>EXERCISE · {exercise.toUpperCase()}</span>
      <span style={{ color: 'oklch(0.78 0.15 150)' }}>CONCENTRIC 1s ▶</span>
    </div>
  </div>
);

// ── Library tab ──────────────────────────────────────
type LibraryTabProps = {
  group: string;
  setGroup: (g: string) => void;
  query: string;
  setQuery: (q: string) => void;
  filtered: Array<Record<string, any>>;
  onOpen: (e: Record<string, any>) => void;
};
const LibraryTab: React.FC<LibraryTabProps> = ({ group, setGroup, query, setQuery, filtered, onOpen }) => (
  <div>
    {/* Search */}
    <div className="glass" style={{ padding: '6px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 99 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
      <input value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search 240+ exercises…"
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: 12, padding: '6px 0', fontFamily: 'var(--font-body, Inter)' }}/>
      <I.mic size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
    </div>

    {/* Group filter */}
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
      {GROUPS.map(g => (
        <div key={g} onClick={() => setGroup(g)} className="tap" style={{
          padding: '6px 12px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap',
          background: group === g ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
          border: '1px solid ' + (group === g ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'),
          color: group === g ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
        }}>{g}</div>
      ))}
    </div>

    {/* Exercise cards */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {filtered.map(e => (
        <div key={e.id} onClick={() => onOpen(e)} className="glass tap fade-up" style={{ padding: 10, position: 'relative', overflow: 'hidden' }}>
          {/* thumb */}
          <div style={{
            aspectRatio: '4 / 3', borderRadius: 10, marginBottom: 8, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, oklch(0.25 0.05 ${e.hue}), oklch(0.15 0.03 ${e.hue + 40}))`,
            border: `1px solid oklch(0.78 0.16 ${e.hue} / 0.3)`,
          }}>
            <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 7, fontFamily: 'var(--font-mono)', color: `oklch(0.9 0.14 ${e.hue})`, letterSpacing: 1 }}>{e.group.toUpperCase()}</div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.dumbbell size={30} stroke={`oklch(0.9 0.14 ${e.hue})`} sw={1.4}/>
            </div>
            <div style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 7, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: 0.5, padding: '2px 5px', background: 'oklch(0 0 0 / 0.4)', borderRadius: 4 }}>GIF</div>
          </div>
          <div className="display" style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{e.name}</div>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>PR {e.pr} · {e.last}</div>
        </div>
      ))}
    </div>

    {/* Create from AI */}
    <div className="tap" style={{
      marginTop: 12, padding: 14, borderRadius: 14,
      background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.2), oklch(0.65 0.22 calc(var(--hue) + 60) / 0.1))',
      border: '1.5px dashed oklch(0.78 0.16 var(--hue) / 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'oklch(0.9 0.14 var(--hue))', fontSize: 13, fontWeight: 500,
    }}>
      <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
      Ask ChatGPT for a new exercise
    </div>
  </div>
);

// ── Plan tab ─────────────────────────────────────────
const PlanTab: React.FC<{ onOpen: (e: Record<string, any>) => void }> = ({ onOpen }) => {
  const today = [
    { name: 'Bench Press', sets: '5 × 5', weight: '82.5kg', status: 'done', ex: EXERCISES[0] },
    { name: 'Incline DB Press', sets: '4 × 8', weight: '24kg', status: 'active', ex: EXERCISES[0] },
    { name: 'Cable Flyes', sets: '3 × 12', weight: '18kg', status: 'pending', ex: EXERCISES[0] },
    { name: 'Tricep Rope Pushdown', sets: '4 × 10', weight: '28kg', status: 'pending', ex: EXERCISES[0] },
  ];
  return (
    <div>
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 12, position: 'relative', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.15), transparent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>DAY 3 / 7 · PUSH</div>
            <div className="display" style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>Chest & Triceps</div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>4 exercises · ~52 min · 14,200kg volume</div>
          </div>
          <Chip tone="accent" size="md">+180 XP</Chip>
        </div>
        <div style={{ height: 3, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
          <div className="xp-fill" style={{ height: '100%', width: '25%', borderRadius: 99 }}/>
        </div>
      </div>

      {today.map((x, i) => (
        <div key={i} onClick={() => onOpen(x.ex)} className="glass tap fade-up" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: x.status === 'done' ? 0.6 : 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: x.status === 'done' ? 'oklch(0.78 0.15 150 / 0.2)' : x.status === 'active' ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (x.status === 'done' ? 'oklch(0.78 0.15 150 / 0.4)' : x.status === 'active' ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {x.status === 'done' ? <I.check size={14} stroke="oklch(0.85 0.14 150)"/>
              : x.status === 'active' ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue))', animation: 'breathe 1.2s infinite' }}/>
              : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{i+1}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{x.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{x.sets} @ {x.weight}</div>
          </div>
          <I.chevR size={14} stroke="var(--fg-3)"/>
        </div>
      ))}
    </div>
  );
};

// ── Exercise detail (tap a library card) ─────────────
type ExerciseDetailProps = { exercise: Record<string, any>; onBack: () => void };
const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ exercise, onBack }) => {
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div onClick={onBack} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: 'var(--fg-2)', fontSize: 12 }}>
        <I.chevL size={14}/> Library
      </div>

      <div className="display" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1 }}>{exercise.name}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 12 }}>
        <Chip tone="accent" size="md">{exercise.group}</Chip>
        <Chip tone="default" size="md">{exercise.equip}</Chip>
        <Chip tone="warn" size="md">{exercise.difficulty}</Chip>
      </div>

      <FormAnimation exercise={exercise.name}/>

      {/* PR / history */}
      <div className="glass fade-up" style={{ padding: 12, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>PERSONAL BEST</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 600 }}>{exercise.pr}</div>
          </div>
          <Chip tone="ok" size="md">↑ 8% this month</Chip>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
          {[0.3, 0.45, 0.4, 0.55, 0.6, 0.5, 0.7, 0.65, 0.75, 0.8, 0.85, 1].map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${v*100}%`, borderRadius: 3, background: `linear-gradient(180deg, oklch(0.78 0.16 var(--hue) / ${0.3 + v*0.5}), oklch(0.55 0.22 calc(var(--hue) + 60) / ${0.2 + v*0.4}))` }}/>
          ))}
        </div>
      </div>

      <div className="tap" style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', color: '#06060a', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
        Log a set
      </div>
    </div>
  );
};
