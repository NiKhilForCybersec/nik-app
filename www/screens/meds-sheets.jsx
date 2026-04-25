/* Aether — Meds add/AI/detail sheets */

const SCHEDULE_KINDS = [
  { id: 'daily', label: 'Daily', sub: 'Same time each day' },
  { id: 'every-n-days', label: 'Every N days', sub: 'e.g. every 3 days' },
  { id: 'weekly', label: 'Weekly', sub: 'Pick days of week' },
  { id: 'cycled', label: 'Cycled', sub: 'N on / M off' },
  { id: 'tapered', label: 'Tapered', sub: 'Step down dose' },
  { id: 'course', label: 'Course', sub: 'Antibiotics, etc.' },
  { id: 'prn', label: 'As needed (PRN)', sub: 'Max per day, min gap' },
];

const AddMedSheet = ({ onClose, onAdd }) => {
  const [name, setName] = React.useState('');
  const [dose, setDose] = React.useState('');
  const [kind, setKind] = React.useState('daily');
  const [time, setTime] = React.useState('08:00');
  const [n, setN] = React.useState(3);
  const [days, setDays] = React.useState(['mon']);
  const [onDays, setOnDays] = React.useState(21);
  const [offDays, setOffDays] = React.useState(7);
  const [courseDays, setCourseDays] = React.useState(7);
  const [perDay, setPerDay] = React.useState(3);
  const [maxPerDay, setMaxPerDay] = React.useState(3);
  const [minGap, setMinGap] = React.useState(6);
  const [forWho, setForWho] = React.useState('self');
  const [note, setNote] = React.useState('');

  const DAYS = [['mon','M'],['tue','T'],['wed','W'],['thu','T'],['fri','F'],['sat','S'],['sun','S']];
  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]);

  const buildSchedule = () => {
    switch (kind) {
      case 'daily': return { kind, time };
      case 'every-n-days': return { kind, n: +n, time };
      case 'weekly': return { kind, days, time };
      case 'cycled': return { kind, onDays: +onDays, offDays: +offDays, cycleDay: 1, time };
      case 'tapered': return { kind, currentDose: dose, unit: 'mg', day: 1, totalDays: 14, time };
      case 'course': return { kind, days: +courseDays, perDay: +perDay, courseDay: 1, courseOf: +courseDays, times: ['08:00','14:00','20:00'].slice(0, +perDay) };
      case 'prn': return { kind, maxPerDay: +maxPerDay, minGapHours: +minGap };
    }
  };

  const save = () => {
    if (!name.trim()) return;
    onAdd({
      name, dose: dose || '1 dose',
      icon: 'pill',
      schedule: buildSchedule(),
      for: forWho,
      source: 'manual',
      note: note || undefined,
      nextDose: kind === 'prn' ? 'As needed' : 'Today ' + time,
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.7)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--theme-bg2, oklch(0.14 0.02 260))', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 18, paddingBottom: 36, maxHeight: '92%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'oklch(1 0 0 / 0.2)', borderRadius: 99, margin: '0 auto 14px' }}/>
        <div className="display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--fg)' }}>Add medication</div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Vitamin D3)" style={inputStyle()}/>
          <input value={dose} onChange={e => setDose(e.target.value)} placeholder="Dose" style={inputStyle()}/>
        </div>

        <SectionLabel>FOR</SectionLabel>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['self', 'Me'], ['kiaan', 'Kiaan'], ['anya', 'Anya']].map(([k, l]) => (
            <Pill key={k} active={forWho === k} onClick={() => setForWho(k)}>{l}</Pill>
          ))}
        </div>

        <SectionLabel>SCHEDULE</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, marginBottom: 10 }}>
          {SCHEDULE_KINDS.map(s => (
            <div key={s.id} onClick={() => setKind(s.id)} className="tap" style={{ padding: '8px 10px', borderRadius: 10, background: kind === s.id ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (kind === s.id ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)') }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: kind === s.id ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg)' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Conditional inputs by schedule kind */}
        {kind === 'every-n-days' && (
          <div style={{ marginBottom: 10 }}>
            <SectionLabel>EVERY N DAYS</SectionLabel>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="range" min="2" max="30" value={n} onChange={e => setN(e.target.value)} style={{ flex: 1 }}/>
              <div style={{ minWidth: 80, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'oklch(0.9 0.14 var(--hue))' }}>Every {n} days</div>
            </div>
          </div>
        )}

        {kind === 'weekly' && (
          <div style={{ marginBottom: 10 }}>
            <SectionLabel>DAYS</SectionLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {DAYS.map(([k, l]) => (
                <div key={k} onClick={() => toggleDay(k)} className="tap" style={{ flex: 1, aspectRatio: '1', maxWidth: 40, borderRadius: 9, background: days.includes(k) ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (days.includes(k) ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: days.includes(k) ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{l}</div>
              ))}
            </div>
          </div>
        )}

        {kind === 'cycled' && (
          <div style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NumField label="ON DAYS" value={onDays} onChange={setOnDays} max={60}/>
            <NumField label="OFF DAYS" value={offDays} onChange={setOffDays} max={30}/>
          </div>
        )}

        {kind === 'course' && (
          <div style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NumField label="DAYS TOTAL" value={courseDays} onChange={setCourseDays} max={30}/>
            <NumField label="PER DAY" value={perDay} onChange={setPerDay} max={6} min={1}/>
          </div>
        )}

        {kind === 'prn' && (
          <div style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NumField label="MAX/DAY" value={maxPerDay} onChange={setMaxPerDay} max={8} min={1}/>
            <NumField label="MIN GAP (h)" value={minGap} onChange={setMinGap} max={24} min={1}/>
          </div>
        )}

        {kind !== 'prn' && (
          <div style={{ marginBottom: 10 }}>
            <SectionLabel>TIME</SectionLabel>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle(), colorScheme: 'dark' }}/>
          </div>
        )}

        <SectionLabel>NOTE (optional)</SectionLabel>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. With food" style={{ ...inputStyle(), marginBottom: 14 }}/>

        {/* Preview */}
        <div className="glass" style={{ padding: 11, marginBottom: 12, background: 'oklch(0.78 0.16 var(--hue) / 0.05)', borderColor: 'oklch(0.78 0.16 var(--hue) / 0.2)' }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>PREVIEW</div>
          <div style={{ fontSize: 12, color: 'var(--fg)' }}>
            <b>{name || 'Medication'}</b> · {dose || '1 dose'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            {scheduleLabel(buildSchedule()).toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={onClose} className="tap" style={{ flex: 1, padding: 12, borderRadius: 12, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 13, color: 'var(--fg-2)' }}>Cancel</div>
          <div onClick={save} className="tap" style={{ flex: 2, padding: 12, borderRadius: 12, background: name ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))' : 'oklch(1 0 0 / 0.05)', color: name ? '#06060a' : 'var(--fg-3)', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>Add medication</div>
        </div>
      </div>
    </div>
  );
};

// ── AI Chat sheet for med entry ────────────────────
const AI_EXAMPLES = [
  'Remind me to take B12 every 3 days at 9am',
  'Add iron tablet every Sunday morning',
  'I need to take amoxicillin 500mg three times a day for 7 days',
  'Anya needs Montelukast 4mg every night at 8pm',
  'Add ibuprofen as needed, max 3 a day, 6 hours apart',
];

// Tiny parser to mimic AI extraction
const parseAi = (text) => {
  const t = text.toLowerCase();
  const med = { source: 'voice', icon: 'pill', for: 'self', note: 'Parsed by AI from: "' + text + '"' };
  // name
  const nameMatch = t.match(/(b12|methylcobalamin|vitamin d|d3|iron|multi-?vitamin|amoxicillin|montelukast|ibuprofen|paracetamol|omega-?3|magnesium|zinc|melatonin)/i);
  med.name = nameMatch ? nameMatch[0].replace(/\b\w/g, c => c.toUpperCase()) : 'New supplement';
  // dose
  const doseMatch = t.match(/(\d+\.?\d*)\s*(mg|mcg|iu|ml|g|tab|cap)/i);
  med.dose = doseMatch ? doseMatch[0] : '1 dose';
  // for whom
  if (t.includes('anya')) { med.for = 'anya'; med.name = 'Anya — ' + med.name; }
  else if (t.includes('kiaan')) { med.for = 'kiaan'; med.name = 'Kiaan — ' + med.name; }
  // schedule
  const everyN = t.match(/every (\d+) days?/);
  const timeMatch = t.match(/(\d{1,2})\s*(am|pm)/);
  const time = timeMatch ? (timeMatch[2] === 'pm' && +timeMatch[1] < 12 ? +timeMatch[1] + 12 : +timeMatch[1]).toString().padStart(2, '0') + ':00' : '08:00';
  if (everyN) med.schedule = { kind: 'every-n-days', n: +everyN[1], time };
  else if (t.match(/(every )?sunday/)) med.schedule = { kind: 'weekly', days: ['sun'], time };
  else if (t.match(/(every )?monday/)) med.schedule = { kind: 'weekly', days: ['mon'], time };
  else if (t.match(/(\d+) (times|x) (a |per )?day/)) {
    const n = +t.match(/(\d+) (times|x)/)[1];
    const courseMatch = t.match(/for (\d+) days?/);
    if (courseMatch) med.schedule = { kind: 'course', days: +courseMatch[1], perDay: n, courseDay: 1, courseOf: +courseMatch[1], times: ['08:00','14:00','20:00'].slice(0, n) };
    else med.schedule = { kind: 'daily', time };
  } else if (t.includes('as needed') || t.includes('prn')) {
    const max = (t.match(/max (\d+)/) || [])[1] || 3;
    const gap = (t.match(/(\d+) hours?/) || [])[1] || 6;
    med.schedule = { kind: 'prn', maxPerDay: +max, minGapHours: +gap };
  } else if (t.includes('night') || t.includes('bedtime')) {
    med.schedule = { kind: 'daily', time: '20:00' };
  } else {
    med.schedule = { kind: 'daily', time };
  }
  med.nextDose = med.schedule.kind === 'prn' ? 'As needed' : 'Today ' + (med.schedule.time || '08:00');
  return med;
};

const AiMedChatSheet = ({ onClose, onAdd }) => {
  const [text, setText] = React.useState('');
  const [parsed, setParsed] = React.useState(null);
  const [thinking, setThinking] = React.useState(false);

  const submit = (raw) => {
    const value = raw || text;
    if (!value.trim()) return;
    setThinking(true);
    setParsed(null);
    setTimeout(() => {
      setParsed(parseAi(value));
      setThinking(false);
    }, 900);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.7)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--theme-bg2, oklch(0.14 0.02 260))', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 18, paddingBottom: 36, maxHeight: '88%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'oklch(1 0 0 / 0.2)', borderRadius: 99, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.sparkles size={18} stroke="#06060a"/>
          </div>
          <div>
            <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>Tell Aether</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Describe in plain English, AI builds the schedule</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="e.g. B12 500mcg every 3 days at 9am" style={{ ...inputStyle(), flex: 1 }}/>
          <div onClick={() => submit()} className="tap" style={{ padding: '10px 14px', borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue))', color: '#06060a', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center' }}>Parse</div>
        </div>

        {!parsed && !thinking && (
          <>
            <SectionLabel>TRY AN EXAMPLE</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {AI_EXAMPLES.map((ex, i) => (
                <div key={i} onClick={() => { setText(ex); submit(ex); }} className="tap glass" style={{ padding: 10, fontSize: 12, color: 'var(--fg-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I.mic size={11} stroke="oklch(0.9 0.14 var(--hue))"/>
                  "{ex}"
                </div>
              ))}
            </div>
          </>
        )}

        {thinking && (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>PARSING…</div>
          </div>
        )}

        {parsed && (
          <div className="fade-up">
            <SectionLabel>AETHER UNDERSTOOD</SectionLabel>
            <div className="glass" style={{ padding: 12, marginBottom: 12, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)' }}>
              <div className="display" style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{parsed.name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{parsed.dose}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {scheduleLabel(parsed.schedule).toUpperCase()}
              </div>
              {parsed.for !== 'self' && <Chip tone="accent" size="sm">{parsed.for.toUpperCase()}</Chip>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={() => setParsed(null)} className="tap" style={{ flex: 1, padding: 12, borderRadius: 12, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>Edit / retry</div>
              <div onClick={() => onAdd(parsed)} className="tap" style={{ flex: 2, padding: 12, borderRadius: 12, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', color: '#06060a', fontWeight: 600, fontSize: 12, textAlign: 'center' }}>Add to schedule</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MedDetailSheet = ({ med, onClose, onRemove }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.7)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--theme-bg2, oklch(0.14 0.02 260))', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 18, paddingBottom: 36, maxHeight: '85%', overflowY: 'auto' }}>
      <div style={{ width: 40, height: 4, background: 'oklch(1 0 0 / 0.2)', borderRadius: 99, margin: '0 auto 14px' }}/>
      <div className="display" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{med.name}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 14 }}>{med.dose} · {scheduleLabel(med.schedule)}</div>
      {med.note && <div className="glass" style={{ padding: 10, fontSize: 12, color: 'var(--fg-2)', marginBottom: 12 }}>{med.note}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <div onClick={onClose} className="tap" style={{ flex: 1, padding: 11, borderRadius: 10, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>Close</div>
        <div onClick={onRemove} className="tap" style={{ flex: 1, padding: 11, borderRadius: 10, background: 'oklch(0.65 0.22 25 / 0.15)', border: '1px solid oklch(0.65 0.22 25 / 0.4)', textAlign: 'center', fontSize: 12, color: 'oklch(0.85 0.18 25)' }}>Remove</div>
      </div>
    </div>
  </div>
);

// helpers
const SectionLabel = ({ children }) => <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 5 }}>{children}</div>;
const Pill = ({ active, onClick, children }) => <div onClick={onClick} className="tap" style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, background: active ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (active ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: active ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{children}</div>;
const NumField = ({ label, value, onChange, min = 1, max = 30 }) => (
  <div>
    <SectionLabel>{label}</SectionLabel>
    <input type="number" min={min} max={max} value={value} onChange={e => onChange(e.target.value)} style={inputStyle()}/>
  </div>
);
const inputStyle = () => ({ width: '100%', padding: 10, borderRadius: 10, background: 'oklch(1 0 0 / 0.06)', border: '1px solid var(--hairline)', color: 'var(--fg)', fontSize: 13, fontFamily: 'var(--font-body, Inter)', outline: 'none', boxSizing: 'border-box' });

Object.assign(window, { AddMedSheet, AiMedChatSheet, MedDetailSheet });
