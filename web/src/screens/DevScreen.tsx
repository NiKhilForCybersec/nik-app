/* Nik — Developer console.
 *
 * DEV-ONLY safety net. Visible only when `import.meta.env.DEV` is true,
 * never ships in production builds. Pivots on the contract registry —
 * every panel either reads the registry or annotates it with live state
 * (last-call status, manifest drift, DB row counts, LLM cost).
 *
 * Panels:
 *   Registry · DB · Drift · Health · LLM · Activity · Graph (placeholder)
 */

import React from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';
import { supabase } from '../lib/supabase';
import { llm, type LLMCallRecord } from '../lib/llm';
import {
  getOpRegistry, getCmdRegistry,
  recentOpCalls, onOpCalls, executeToolCall,
  type OpCallRecord,
} from '../lib/llm/tools';
import { useCommand } from '../lib/useCommand';
import { useAuth } from '../lib/auth';
import { zodToJsonSchema } from '../lib/llm/zodToJsonSchema';

type PanelId = 'registry' | 'db' | 'drift' | 'health' | 'llm' | 'feed' | 'graph';

const PANELS: { id: PanelId; label: string; icon: keyof typeof I }[] = [
  { id: 'registry', label: 'Registry', icon: 'sparkle' },
  { id: 'db',       label: 'Database', icon: 'grid'   },
  { id: 'drift',    label: 'Drift',    icon: 'check'  },
  { id: 'health',   label: 'Health',   icon: 'heart'  },
  { id: 'llm',      label: 'LLM',      icon: 'mic'    },
  { id: 'feed',     label: 'Activity', icon: 'flame'  },
  { id: 'graph',    label: 'Graph',    icon: 'globe'  },
];

export default function DevScreen(_p: ScreenProps) {
  const [tab, setTab] = React.useState<PanelId>('registry');

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          DEV CONSOLE · LOCAL ONLY · NEVER SHIPS
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
          What's actually happening
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {PANELS.map((p) => {
          const Ic = I[p.icon];
          const active = tab === p.id;
          return (
            <div key={p.id} onClick={() => setTab(p.id)} className="tap" style={{
              padding: '7px 12px', borderRadius: 99, fontSize: 12, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
              background: active ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
              border: '1px solid ' + (active ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
              color: active ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
            }}>
              <Ic size={12} stroke={active ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)'} />
              {p.label}
            </div>
          );
        })}
      </div>

      {tab === 'registry' && <RegistryPanel />}
      {tab === 'db'       && <DbPanel />}
      {tab === 'drift'    && <DriftPanel />}
      {tab === 'health'   && <HealthPanel />}
      {tab === 'llm'      && <LLMPanel />}
      {tab === 'feed'     && <FeedPanel />}
      {tab === 'graph'    && <GraphPanel />}
    </div>
  );
}

// ── Registry ────────────────────────────────────────────────

function useOpCallsLive() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => onOpCalls(force), []);
  return recentOpCalls();
}

function RegistryPanel() {
  const ops = React.useMemo(() => Array.from(getOpRegistry().values()), []);
  const cmds = React.useMemo(() => Array.from(getCmdRegistry().values()), []);
  const calls = useOpCallsLive();
  const [filter, setFilter] = React.useState('');
  const [openName, setOpenName] = React.useState<string | null>(null);

  const lastByName = React.useMemo(() => {
    const m = new Map<string, OpCallRecord>();
    for (const c of calls) {
      if (!m.has(c.name)) m.set(c.name, c);
    }
    return m;
  }, [calls]);

  const all = React.useMemo(
    () => [
      ...ops.map((o) => ({ kind: 'op' as const, name: o.name, description: o.description })),
      ...cmds.map((c) => ({ kind: 'cmd' as const, name: c.name, description: c.description })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
    [ops, cmds],
  );

  const filtered = filter
    ? all.filter((x) => x.name.toLowerCase().includes(filter.toLowerCase()))
    : all;

  const exportCatalog = () => {
    const catalog = {
      generatedAt: new Date().toISOString(),
      operations: ops.map((o) => ({
        name: o.name,
        description: o.description,
        kind: o.kind,
        permissions: o.permissions,
        tags: o.tags,
        inputSchema: zodToJsonSchema(o.input as never),
      })),
      commands: cmds.map((c) => ({
        name: c.name,
        description: c.description,
        permissions: c.permissions,
        tags: c.tags,
        inputSchema: zodToJsonSchema(c.input as never),
      })),
    };
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nik-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="glass" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, borderRadius: 12 }}>
        <I.search size={14} stroke="var(--fg-3)" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`${all.length} registered…`}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: 13 }} />
        <div onClick={exportCatalog} className="tap" title="Download catalog as JSON for external consumers (Telegram bot, plugins, etc.)" style={{
          padding: '5px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          background: 'oklch(0.78 0.16 var(--hue) / 0.15)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)',
          color: 'oklch(0.9 0.14 var(--hue))', whiteSpace: 'nowrap',
        }}>EXPORT JSON</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((x) => {
          const last = lastByName.get(x.name);
          const opened = openName === x.name;
          return (
            <div key={x.name} className="glass" style={{ padding: 10, borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <div onClick={() => setOpenName(opened ? null : x.name)} className="tap"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 8, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
                  background: x.kind === 'cmd' ? 'oklch(0.78 0.16 280 / 0.18)' : 'oklch(0.78 0.16 var(--hue) / 0.18)',
                  color: x.kind === 'cmd' ? 'oklch(0.9 0.14 280)' : 'oklch(0.9 0.14 var(--hue))',
                }}>{x.kind.toUpperCase()}</span>
                <span style={{ color: 'var(--fg)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                {last ? (
                  <span style={{ fontSize: 9, color: last.ok ? 'oklch(0.85 0.15 150)' : 'oklch(0.85 0.18 25)' }}>
                    {last.ok ? '✓' : '✗'} {ago(last.at)}
                  </span>
                ) : (
                  <span style={{ fontSize: 9, color: 'var(--fg-3)' }}>never</span>
                )}
              </div>
              {opened && (
                <InvokeForm name={x.name} kind={x.kind} description={x.description} onClose={() => setOpenName(null)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InvokeForm({ name, kind, description, onClose }: { name: string; kind: 'op' | 'cmd'; description: string; onClose: () => void }) {
  const reg = kind === 'op' ? getOpRegistry().get(name) : getCmdRegistry().get(name);
  const schema = reg ? (zodToJsonSchema(reg.input as never) as { properties?: Record<string, { type?: string; description?: string }>; required?: string[] }) : { properties: {} };
  const [args, setArgs] = React.useState<Record<string, unknown>>({});
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; data?: unknown; error?: string } | null>(null);
  const dispatch = useCommand();
  const { userId } = useAuth();

  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await executeToolCall(
        { id: 'dev', name: name.replace(/\./g, '__'), arguments: args },
        { userId, dispatch, source: 'dev' },
      );
      setResult({ ok: !r.error, data: r.result, error: r.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--hairline)' }}>
      <div style={{ fontSize: 10, color: 'var(--fg-2)', marginBottom: 8, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
        {description}
      </div>
      {Object.entries(props).map(([key, def]) => (
        <div key={key} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', marginBottom: 2 }}>
            {key} {required.has(key) ? <span style={{ color: 'oklch(0.85 0.18 25)' }}>*</span> : null} <span style={{ opacity: 0.6 }}>· {def.type ?? 'any'}</span>
          </div>
          <input
            value={String(args[key] ?? '')}
            onChange={(e) => {
              const v = e.target.value;
              const t = def.type;
              const parsed = t === 'integer' || t === 'number'
                ? (v === '' ? undefined : Number(v))
                : t === 'boolean'
                ? v === 'true'
                : v === '' ? undefined : v;
              setArgs((x) => ({ ...x, [key]: parsed }));
            }}
            placeholder={def.description ?? key}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--hairline)',
              background: 'oklch(1 0 0 / 0.04)', color: 'var(--fg)', fontSize: 11, fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <div onClick={submit} className="tap" style={{
          flex: 1, padding: '6px 10px', borderRadius: 6, textAlign: 'center', fontSize: 11,
          background: busy ? 'oklch(1 0 0 / 0.06)' : 'oklch(0.78 0.16 var(--hue) / 0.25)',
          color: 'oklch(0.9 0.14 var(--hue))', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)',
          fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
        }}>{busy ? 'INVOKING…' : 'INVOKE'}</div>
        <div onClick={onClose} className="tap" style={{
          padding: '6px 10px', borderRadius: 6, textAlign: 'center', fontSize: 11,
          background: 'oklch(1 0 0 / 0.04)', color: 'var(--fg-2)', border: '1px solid var(--hairline)',
          fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
        }}>CLOSE</div>
      </div>
      {result && (
        <pre style={{
          marginTop: 8, padding: 8, borderRadius: 6, background: result.ok ? 'oklch(0.78 0.15 150 / 0.08)' : 'oklch(0.78 0.18 25 / 0.08)',
          border: '1px solid ' + (result.ok ? 'oklch(0.78 0.15 150 / 0.3)' : 'oklch(0.78 0.18 25 / 0.3)'),
          fontSize: 10, color: 'var(--fg)', maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{result.ok ? JSON.stringify(result.data, null, 2) : result.error}</pre>
      )}
    </div>
  );
}

// ── DB inspector ────────────────────────────────────────────

const TABLES = [
  'profiles', 'habits', 'quests', 'events', 'integrations',
  'diary_entries', 'user_scores', 'score_events', 'score_backlog',
  'sleep_nights', 'family_tasks', 'family_alarms',
  'scheduled_intents', 'user_memories',
  'chat_messages', 'circle_members', 'items',
];

function DbPanel() {
  const [counts, setCounts] = React.useState<Record<string, number | string>>({});
  const [open, setOpen] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<unknown[] | null>(null);

  React.useEffect(() => {
    void Promise.all(TABLES.map(async (t) => {
      const { count, error } = await supabase.from(t).select('*', { head: true, count: 'exact' });
      return [t, error ? `err` : (count ?? 0)] as const;
    })).then((entries) => setCounts(Object.fromEntries(entries)));
  }, []);

  const inspect = async (t: string) => {
    setOpen(t); setRows(null);
    const { data } = await supabase.from(t).select('*').limit(20);
    setRows(data ?? []);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {TABLES.map((t) => (
        <div key={t} className="glass" style={{ padding: 10, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <div onClick={() => inspect(t)} className="tap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, color: 'var(--fg)' }}>{t}</span>
            <span style={{ color: counts[t] === 'err' ? 'oklch(0.85 0.18 25)' : 'var(--fg-3)' }}>{counts[t] ?? '…'}</span>
          </div>
          {open === t && (
            <pre style={{ marginTop: 6, padding: 6, borderRadius: 4, background: 'oklch(1 0 0 / 0.03)', maxHeight: 280, overflow: 'auto', fontSize: 9, color: 'var(--fg-2)' }}>
              {rows ? JSON.stringify(rows, null, 2) : 'loading…'}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Manifest drift (port of check-wiring.mjs) ──────────────

const screenSources = import.meta.glob('/src/screens/*Screen.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const manifestSources = import.meta.glob('/src/screens/*Screen.manifest.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const RE = {
  useOp: /useOp\(\s*([\w.]+)/g,
  useMutation: /useOpMutation\(\s*([\w.]+)/g,
  useDispatch: /useDispatch\(\s*([\w.]+)/g,
};

function extractFromManifest(src: string, listName: string): Set<string> {
  const re = new RegExp(`${listName}\\s*:\\s*\\[([^\\]]*)\\]`, 's');
  const m = src.match(re);
  if (!m) return new Set();
  const ids = m[1].match(/[\w.]+/g) ?? [];
  return new Set(ids.filter((id) => /^[a-zA-Z_$]/.test(id)));
}

function DriftPanel() {
  const issues = React.useMemo(() => {
    const out: { screen: string; level: 'error' | 'warning'; msg: string }[] = [];
    for (const [path, src] of Object.entries(screenSources)) {
      const screen = path.split('/').pop()!;
      const manifestPath = path.replace(/\.tsx$/, '.manifest.ts');
      const mSrc = manifestSources[manifestPath];
      if (!mSrc) {
        out.push({ screen, level: 'error', msg: 'missing sibling manifest' });
        continue;
      }
      const declared = {
        reads: extractFromManifest(mSrc, 'reads'),
        writes: extractFromManifest(mSrc, 'writes'),
        commands: extractFromManifest(mSrc, 'commands'),
      };
      const used = {
        reads: [...src.matchAll(RE.useOp)].map((m) => m[1]),
        writes: [...src.matchAll(RE.useMutation)].map((m) => m[1]),
        commands: [...src.matchAll(RE.useDispatch)].map((m) => m[1]),
      };
      const kinds = ['reads', 'writes', 'commands'] as const;
      for (const k of kinds) {
        for (const u of used[k]) {
          const tail = u.split('.').slice(-1)[0];
          const declaredTails = [...declared[k]].map((d) => d.split('.').slice(-1)[0]);
          if (!declaredTails.includes(tail) && !declared[k].has(u)) {
            out.push({ screen, level: 'error', msg: `uses ${k}.${u} but manifest doesn't declare it` });
          }
        }
        for (const d of declared[k]) {
          const tail = d.split('.').slice(-1)[0];
          const usedTails = used[k].map((u) => u.split('.').slice(-1)[0]);
          if (!usedTails.includes(tail) && !used[k].includes(d)) {
            out.push({ screen, level: 'warning', msg: `manifest declares ${k}.${d} but JSX never uses it` });
          }
        }
      }
    }
    return out;
  }, []);

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Chip tone={errors.length ? 'danger' : 'ok'} size="sm">{errors.length} ERRORS</Chip>
        <Chip tone={warnings.length ? 'warn' : 'default'} size="sm">{warnings.length} WARNINGS</Chip>
        <Chip tone="default" size="sm">{Object.keys(screenSources).length} SCREENS</Chip>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {issues.length === 0 && (
          <div className="glass" style={{ padding: 14, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            ✓ NO DRIFT
          </div>
        )}
        {issues.map((i, idx) => (
          <div key={idx} className="glass" style={{ padding: 8, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: i.level === 'error' ? 'oklch(0.85 0.18 25)' : 'oklch(0.85 0.16 60)' }}>
            <b style={{ color: 'var(--fg-2)' }}>{i.screen}</b> · {i.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Health checks ───────────────────────────────────────────

function HealthPanel() {
  const [supa, setSupa] = React.useState<'?' | 'ok' | 'err'>('?');
  const [hasAnthropic, hasOpenAI] = [
    Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY),
    Boolean(import.meta.env.VITE_OPENAI_API_KEY),
  ];
  const [providerStatus, setProviderStatus] = React.useState<Record<string, 'ok' | 'err' | '?'>>({});

  React.useEffect(() => {
    void supabase.from('profiles').select('id', { head: true, count: 'exact' }).then(({ error }) =>
      setSupa(error ? 'err' : 'ok'),
    );
    // Use the live LLM call log to infer recent provider health.
    const recent = llm.recentCalls();
    const out: Record<string, 'ok' | 'err' | '?'> = {};
    for (const r of recent.slice(0, 20)) {
      if (!out[r.provider]) out[r.provider] = r.ok ? 'ok' : 'err';
    }
    setProviderStatus(out);
  }, []);

  const checks: { name: string; status: 'ok' | 'err' | '?'; note?: string }[] = [
    { name: 'Supabase REST', status: supa, note: import.meta.env.VITE_SUPABASE_URL },
    { name: 'Anthropic key', status: hasAnthropic ? (providerStatus.anthropic ?? '?') : 'err', note: hasAnthropic ? 'set' : 'missing' },
    { name: 'OpenAI key', status: hasOpenAI ? (providerStatus.openai ?? '?') : 'err', note: hasOpenAI ? 'set' : 'missing' },
    { name: 'MCP server', status: '?', note: 'stdio only — run `npx @modelcontextprotocol/inspector packages/mcp-nik`' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {checks.map((c) => (
        <div key={c.name} className="glass" style={{ padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: c.status === 'ok' ? 'oklch(0.78 0.15 150)' : c.status === 'err' ? 'oklch(0.85 0.18 25)' : 'oklch(0.78 0.05 60)',
            boxShadow: c.status === 'ok' ? '0 0 6px oklch(0.78 0.15 150)' : 'none',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--fg)' }}>{c.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note}</div>
          </div>
          <span style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{c.status.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ── LLM call log ────────────────────────────────────────────

function LLMPanel() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => llm.onCalls(force), []);
  const calls = llm.recentCalls();

  const totals = calls.reduce(
    (a, c) => ({
      input: a.input + (c.inputTokens ?? 0),
      output: a.output + (c.outputTokens ?? 0),
      n: a.n + 1,
      err: a.err + (c.ok ? 0 : 1),
      latency: a.latency + (c.latencyMs ?? 0),
    }),
    { input: 0, output: 0, n: 0, err: 0, latency: 0 },
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <Stat label="CALLS" value={String(totals.n)} />
        <Stat label="ERRORS" value={String(totals.err)} bad={totals.err > 0} />
        <Stat label="IN TOK" value={totals.input.toLocaleString()} />
        <Stat label="OUT TOK" value={totals.output.toLocaleString()} />
      </div>
      {calls.length === 0 && (
        <div className="glass" style={{ padding: 14, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          NO CALLS YET — try Chat
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {calls.map((c) => <LLMRow key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function LLMRow({ c }: { c: LLMCallRecord }) {
  return (
    <div className="glass" style={{ padding: 8, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
        <span style={{ color: c.ok ? 'oklch(0.85 0.15 150)' : 'oklch(0.85 0.18 25)' }}>{c.ok ? '✓' : '✗'}</span>
        <span style={{ color: 'var(--fg-2)' }}>{c.provider}/{c.model}</span>
        <span style={{ color: 'var(--fg-3)' }}>· {c.complexity}</span>
        <span style={{ color: 'var(--fg-3)' }}>· {c.latencyMs ?? '?'}ms</span>
        {c.toolCallCount > 0 && <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>· {c.toolCallCount} tool calls</span>}
        <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>{ago(c.startedAt)}</span>
      </div>
      <div style={{ color: 'var(--fg-2)', marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 11 }}>
        <b style={{ color: 'var(--fg-3)' }}>→</b> {c.preview}
      </div>
      {c.responsePreview && (
        <div style={{ color: 'var(--fg)', marginTop: 2, fontFamily: 'var(--font-body)', fontSize: 11 }}>
          <b style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>←</b> {c.responsePreview}
        </div>
      )}
      {c.error && <div style={{ color: 'oklch(0.85 0.18 25)', marginTop: 2 }}>{c.error}</div>}
    </div>
  );
}

// ── Activity feed (Supabase realtime) ──────────────────────

const FEED_TABLES = ['chat_messages', 'items', 'quests', 'circle_members', 'diary_entries', 'habits', 'score_events'];

type FeedEvent = { id: string; at: number; table: string; eventType: string; row: Record<string, unknown> };

function FeedPanel() {
  const [events, setEvents] = React.useState<FeedEvent[]>([]);

  React.useEffect(() => {
    const channels = FEED_TABLES.map((t) =>
      supabase.channel(`dev:${t}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          setEvents((es) => [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), table: t, eventType: payload.eventType, row: (payload.new ?? payload.old) ?? {} },
            ...es,
          ].slice(0, 100));
        })
        .subscribe(),
    );
    return () => { for (const c of channels) void supabase.removeChannel(c); };
  }, []);

  return (
    <div>
      <div className="glass" style={{ padding: 10, borderRadius: 8, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        WATCHING: {FEED_TABLES.join(', ')}
      </div>
      {events.length === 0 && (
        <div className="glass" style={{ padding: 14, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          NO EVENTS — make a change in another panel
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.map((e) => (
          <div key={e.id} className="glass" style={{ padding: 8, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{
                fontSize: 8, padding: '1px 5px', borderRadius: 3,
                background: e.eventType === 'INSERT' ? 'oklch(0.78 0.15 150 / 0.18)' : e.eventType === 'DELETE' ? 'oklch(0.78 0.18 25 / 0.18)' : 'oklch(0.78 0.16 var(--hue) / 0.18)',
                color: e.eventType === 'INSERT' ? 'oklch(0.85 0.15 150)' : e.eventType === 'DELETE' ? 'oklch(0.85 0.18 25)' : 'oklch(0.9 0.14 var(--hue))',
              }}>{e.eventType}</span>
              <span style={{ color: 'var(--fg)' }}>{e.table}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>{ago(e.at)}</span>
            </div>
            <div style={{ color: 'var(--fg-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewRow(e.row)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function previewRow(r: Record<string, unknown>): string {
  const keys = ['title', 'name', 'kind', 'role', 'content', 'status'];
  for (const k of keys) {
    if (typeof r[k] === 'string') return `${k}=${(r[k] as string).slice(0, 60)}`;
  }
  return Object.keys(r).slice(0, 4).join(', ');
}

// ── Graph (Cytoscape force-directed, free-play canvas) ────

const NODE_COLORS = {
  op:      { bg: 'oklch(0.78 0.16 220)', border: 'oklch(0.65 0.20 220)', label: 'OPS' },
  cmd:     { bg: 'oklch(0.78 0.16 280)', border: 'oklch(0.65 0.20 280)', label: 'COMMANDS' },
  screen:  { bg: 'oklch(0.78 0.16 60)',  border: 'oklch(0.65 0.20 60)',  label: 'SCREENS' },
  table:   { bg: 'oklch(0.78 0.16 150)', border: 'oklch(0.65 0.20 150)', label: 'TABLES' },
} as const;

type GraphNodeKind = keyof typeof NODE_COLORS;

function GraphPanel() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [filter, setFilter] = React.useState<Record<GraphNodeKind, boolean>>({
    op: true, cmd: true, screen: true, table: true,
  });

  React.useEffect(() => {
    if (!containerRef.current) return;
    let cy: { destroy: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      const cytoscape = (await import('cytoscape')).default;
      const fcose = (await import('cytoscape-fcose')).default;
      cytoscape.use(fcose as never);
      if (cancelled || !containerRef.current) return;

      const ops = Array.from(getOpRegistry().values());
      const cmds = Array.from(getCmdRegistry().values());
      const screens = Object.keys(screenSources).map((p) => p.split('/').pop()!.replace(/\.tsx$/, ''));

      // Tables come from the static list used by DbPanel.
      const tables = TABLES;

      // Build edges:
      //  - screen → op via manifest reads / writes
      //  - screen → cmd via manifest commands
      //  - op   → table via heuristic regex on the op handler source
      const edges: { source: string; target: string; kind: string }[] = [];

      for (const [path, src] of Object.entries(manifestSources)) {
        const screen = path.split('/').pop()!.replace(/\.manifest\.ts$/, '');
        const reads = extractFromManifest(src, 'reads');
        const writes = extractFromManifest(src, 'writes');
        const cmds_ = extractFromManifest(src, 'commands');
        for (const r of reads) {
          const tail = r.split('.').slice(-1)[0];
          const op = ops.find((o) => o.name.endsWith('.' + tail));
          if (op) edges.push({ source: `screen:${screen}`, target: `op:${op.name}`, kind: 'reads' });
        }
        for (const w of writes) {
          const tail = w.split('.').slice(-1)[0];
          const op = ops.find((o) => o.name.endsWith('.' + tail));
          if (op) edges.push({ source: `screen:${screen}`, target: `op:${op.name}`, kind: 'writes' });
        }
        for (const c of cmds_) {
          const tail = c.split('.').slice(-1)[0];
          const cmd = cmds.find((cc) => cc.name.endsWith('.' + tail));
          if (cmd) edges.push({ source: `screen:${screen}`, target: `cmd:${cmd.name}`, kind: 'commands' });
        }
      }

      // Best-effort op → table edge: scan handler source via Function.toString().
      // This is dev-only inspection; misses programmatic table names but
      // catches the common .from('habits') pattern.
      for (const op of ops) {
        const src = (op.handler as { toString: () => string }).toString();
        for (const table of tables) {
          const re = new RegExp(`\\bfrom\\(['"\`]${table}['"\`]\\)`);
          if (re.test(src)) edges.push({ source: `op:${op.name}`, target: `table:${table}`, kind: 'queries' });
        }
      }

      const nodes: { id: string; label: string; kind: GraphNodeKind }[] = [
        ...(filter.op ? ops.map((o) => ({ id: `op:${o.name}`, label: o.name, kind: 'op' as const })) : []),
        ...(filter.cmd ? cmds.map((c) => ({ id: `cmd:${c.name}`, label: c.name, kind: 'cmd' as const })) : []),
        ...(filter.screen ? screens.map((s) => ({ id: `screen:${s}`, label: s, kind: 'screen' as const })) : []),
        ...(filter.table ? tables.map((t) => ({ id: `table:${t}`, label: t, kind: 'table' as const })) : []),
      ];

      const nodeIds = new Set(nodes.map((n) => n.id));
      const visibleEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

      const inst = cytoscape({
        container: containerRef.current,
        elements: [
          ...nodes.map((n) => ({
            data: { id: n.id, label: n.label, kind: n.kind },
            classes: n.kind,
          })),
          ...visibleEdges.map((e, i) => ({
            data: { id: `e${i}`, source: e.source, target: e.target, kind: e.kind },
          })),
        ],
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#fff',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '8px',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'text-outline-width': 2,
              'text-outline-color': 'oklch(0.10 0.02 260)',
              width: 14,
              height: 14,
              'border-width': 1.5,
            },
          },
          ...(Object.entries(NODE_COLORS).map(([kind, c]) => ({
            selector: `node.${kind}`,
            style: { 'background-color': c.bg, 'border-color': c.border },
          })) as never[]),
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': 'oklch(1 0 0 / 0.18)',
              'target-arrow-color': 'oklch(1 0 0 / 0.3)',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 0.6,
              'curve-style': 'bezier',
            },
          },
        ],
        layout: {
          name: 'fcose',
          quality: 'proof',
          animate: true,
          animationDuration: 600,
          nodeRepulsion: 4500,
          idealEdgeLength: 80,
          edgeElasticity: 0.45,
          gravity: 0.25,
          padding: 30,
        } as never,
        wheelSensitivity: 0.2,
      });
      cy = inst;
    })();

    return () => { cancelled = true; if (cy) cy.destroy(); };
  }, [filter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {(Object.keys(NODE_COLORS) as GraphNodeKind[]).map((k) => {
          const c = NODE_COLORS[k];
          const on = filter[k];
          return (
            <div key={k} onClick={() => setFilter((f) => ({ ...f, [k]: !f[k] }))} className="tap" style={{
              padding: '5px 10px', borderRadius: 99, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
              background: on ? `${c.bg.replace(')', ' / 0.18)')}` : 'oklch(1 0 0 / 0.04)',
              border: '1px solid ' + (on ? c.border : 'var(--hairline)'),
              color: on ? c.bg.replace('oklch(0.78', 'oklch(0.95') : 'var(--fg-3)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.bg, opacity: on ? 1 : 0.3 }} />
              {c.label}
            </div>
          );
        })}
      </div>
      <div className="glass" style={{ position: 'relative', borderRadius: 12, height: '70vh', overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute', bottom: 8, left: 8, fontSize: 9,
          fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: 0.5, pointerEvents: 'none',
        }}>
          drag · scroll to zoom · click+drag bg to pan
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="glass" style={{ padding: 10, borderRadius: 8, textAlign: 'center' }}>
      <div className="display" style={{ fontSize: 18, fontWeight: 600, color: bad ? 'oklch(0.85 0.18 25)' : 'oklch(0.9 0.14 var(--hue))' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ago(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
