/* Nik — Widgets playground.
 *
 * Mirror of the Home canvas, but in edit mode. Each widget renders
 * exactly as it does on Home; tap controls overlay each tile to
 * reorder (←/→), resize (chips), remove (✕). Library and AI prompt
 * sit below. Mutations write straight through — Home auto-refreshes
 * via React Query invalidation.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { useCommand } from '../lib/useCommand';
import { useAuth } from '../lib/auth';
import { widgets as widgetsOps, WidgetType, type Widget } from '../contracts/widgets';
import { WIDGET_TYPES, type WidgetSize } from '../components/widgets';
import { llm } from '../lib/llm';
import { buildToolCatalog, executeToolCall } from '../lib/llm/tools';
import type { LLMMessage, LLMToolCall } from '../lib/llm/types';

const ALL_TYPES = Object.keys(WIDGET_TYPES) as WidgetType[];
const TOOL_CATALOG = buildToolCatalog();
const SYSTEM_PROMPT = `You manage the user's home-screen widgets. Use widgets.install / widgets.move / widgets.resize / widgets.remove to do exactly what the user asks. After tools run, give a one-line confirmation. Be concise.`;

export default function WidgetsScreen(_p: ScreenProps) {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const dispatch = useCommand();
  const { data: list = [], isLoading, isFetched } = useOp(widgetsOps.list, {});
  const install = useOpMutation(widgetsOps.install);
  const move = useOpMutation(widgetsOps.move);
  const resize = useOpMutation(widgetsOps.resize);
  const remove = useOpMutation(widgetsOps.remove);
  const reset = useOpMutation(widgetsOps.reset);

  const [aiInput, setAiInput] = React.useState('');
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiNote, setAiNote] = React.useState<string | null>(null);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const [hasReset, setHasReset] = React.useState(false);

  // Auto-seed defaults so the playground is never blank for new users —
  // mirrors HomeScreen's behaviour.
  React.useEffect(() => {
    if (userId && isFetched && list.length === 0 && !hasReset) {
      setHasReset(true);
      void reset.mutateAsync({});
    }
  }, [userId, isFetched, list.length, hasReset, reset]);

  const installedTypes = new Set(list.map((w) => w.widget_type as WidgetType));
  const libraryTypes = ALL_TYPES.filter((t) => !installedTypes.has(t) || t === 'list_preview');

  const onAdd = async (type: WidgetType) => {
    const def = WIDGET_TYPES[type];
    await install.mutateAsync({
      widgetType: type,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
    });
    setShowLibrary(false);
  };

  const onRemove = async (id: string) => {
    if (!confirm('Remove this widget from your Home?')) return;
    await remove.mutateAsync({ id });
  };

  const onResize = async (id: string, size: WidgetSize) => {
    await resize.mutateAsync({ id, w: size.w, h: size.h });
  };

  const onMove = async (id: string, dir: -1 | 1) => {
    const idx = list.findIndex((w) => w.id === id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const newPos = list[target].position;
    await move.mutateAsync({ id, position: newPos });
  };

  const onReset = async () => {
    if (!confirm('Reset Home to the default canvas? Your current widgets will be archived.')) return;
    await reset.mutateAsync({});
  };

  const onAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = aiInput.trim();
    if (!text) return;
    setAiBusy(true);
    setAiNote(null);
    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ];
      let history = messages;
      const executed: string[] = [];
      let finalText = '';
      for (let hop = 0; hop < 4; hop++) {
        const r = await llm.complete({ messages: history, tools: TOOL_CATALOG });
        if (!r.toolCalls.length) {
          finalText = r.text || '';
          break;
        }
        history = [...history, { role: 'assistant', content: r.text, toolCalls: r.toolCalls }];
        for (const tc of r.toolCalls) {
          const exec = await executeToolCall(tc as LLMToolCall, { userId, dispatch });
          executed.push(exec.registryName);
          history = [
            ...history,
            {
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(exec.error ? { error: exec.error } : exec.result ?? { ok: true }),
            },
          ];
        }
      }
      setAiNote(finalText || (executed.length ? `Did: ${executed.join(', ')}` : 'No change.'));
      if (executed.length) await qc.invalidateQueries({ queryKey: ['widgets.list'] });
      setAiInput('');
    } catch (err) {
      setAiNote(`Error — ${(err as Error).message}`);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>EDIT MODE · TAP TO REARRANGE</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Your canvas</div>
        </div>
        <Chip tone="accent" size="sm">● EDITING</Chip>
      </div>

      {/* AI prompt */}
      <form onSubmit={onAiSubmit} className="glass" style={{ padding: 10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.25)' }}>
        <I.sparkle size={14} stroke="oklch(0.92 0.14 var(--hue))" />
        <input
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Ask Nik — &ldquo;add a hydration widget&rdquo;"
          disabled={aiBusy}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg-1)', fontSize: 13, fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="submit"
          disabled={aiBusy || !aiInput.trim()}
          className="tap"
          style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: aiInput.trim() && !aiBusy
              ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))'
              : 'oklch(1 0 0 / 0.05)',
            color: aiInput.trim() && !aiBusy ? '#06060a' : 'var(--fg-3)',
            border: 'none', cursor: aiBusy ? 'wait' : 'pointer',
          }}
        >
          {aiBusy ? '…' : 'GO'}
        </button>
      </form>
      {aiNote && (
        <div style={{ marginTop: -8, marginBottom: 14, fontSize: 11, color: 'var(--fg-3)', padding: '4px 10px' }}>
          {aiNote}
        </div>
      )}

      {/* Live canvas — same grid as Home, with edit overlays */}
      {isLoading && <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: 16 }}>Loading…</div>}

      {!isLoading && list.length === 0 && (
        <div className="glass" style={{ padding: 20, textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 8 }}>No widgets on your Home yet.</div>
          <button onClick={onReset} className="tap" style={primaryBtn}>Install starter set</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {list.map((w, i) => (
          <EditableWidget
            key={w.id}
            widget={w}
            isFirst={i === 0}
            isLast={i === list.length - 1}
            onMove={onMove}
            onResize={onResize}
            onRemove={onRemove}
          />
        ))}

        {/* "Add" tile — last cell of the grid */}
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="tap glass"
          style={{
            gridColumn: 'span 1', minHeight: 90, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: 'oklch(1 0 0 / 0.02)', border: '1px dashed var(--hairline-strong)',
          }}
        >
          <I.plus size={18} stroke="var(--fg-2)" />
          <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            ADD WIDGET
          </span>
        </button>
      </div>

      {/* Library — only when "+" is tapped */}
      {showLibrary && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            LIBRARY · {libraryTypes.length} AVAILABLE · TAP TO ADD
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {libraryTypes.map((t) => {
              const def = WIDGET_TYPES[t];
              const Ic = I[def.icon] ?? I.sparkle;
              return (
                <button
                  key={t}
                  onClick={() => onAdd(t)}
                  disabled={install.isPending}
                  className="glass tap"
                  style={{
                    padding: 12, textAlign: 'left', cursor: 'pointer',
                    background: `linear-gradient(135deg, oklch(0.78 0.16 ${def.hue} / 0.10), transparent 70%)`,
                    borderColor: `oklch(0.78 0.16 ${def.hue} / 0.22)`,
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ic size={12} stroke={`oklch(0.92 0.14 ${def.hue})`} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)' }}>{def.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', lineHeight: 1.3 }}>{def.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset */}
      {list.length > 0 && (
        <button onClick={onReset} className="tap" style={resetBtn}>
          Reset to default canvas
        </button>
      )}
    </div>
  );
}

// ── EditableWidget — render the real widget + overlay edit controls ──

const EditableWidget: React.FC<{
  widget: Widget;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  onResize: (id: string, size: WidgetSize) => void;
  onRemove: (id: string) => void;
}> = ({ widget, isFirst, isLast, onMove, onResize, onRemove }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  const [showSizes, setShowSizes] = React.useState(false);

  if (!def) {
    return (
      <div className="glass" style={{ padding: 12, fontSize: 12, color: 'var(--fg-3)', gridColumn: `span ${widget.w}` }}>
        Unknown “{widget.widget_type}”
        <button onClick={() => onRemove(widget.id)} style={{ marginLeft: 8, color: 'var(--fg-2)', background: 'none', border: 'none', cursor: 'pointer' }}>
          remove
        </button>
      </div>
    );
  }
  const Render = def.Component;

  return (
    <div
      style={{
        position: 'relative',
        gridColumn: `span ${widget.w}`,
        gridRow: `span ${widget.h}`,
        animation: 'breathe 2.4s ease-in-out infinite',
      }}
    >
      {/* The real widget renders inside (taps disabled while editing) */}
      <div style={{ pointerEvents: 'none' }}>
        <Render size={{ w: widget.w as 1 | 2, h: widget.h as 1 | 2 }} config={widget.config} />
      </div>

      {/* Top-right ✕ remove */}
      <button
        onClick={() => onRemove(widget.id)}
        aria-label="Remove"
        style={{
          position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
          background: 'oklch(0.20 0.02 260)', border: '1px solid var(--hairline-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
        }}
      >
        <I.close size={10} stroke="var(--fg-1)" />
      </button>

      {/* Bottom row: ← → and size toggle */}
      <div
        style={{
          position: 'absolute', bottom: 6, left: 6, right: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onMove(widget.id, -1)} disabled={isFirst} aria-label="Move earlier" style={miniBtn(isFirst, 'rotate(180deg)')}>
            <I.chevR size={10} stroke="var(--fg-1)" />
          </button>
          <button onClick={() => onMove(widget.id, 1)} disabled={isLast} aria-label="Move later" style={miniBtn(isLast)}>
            <I.chevR size={10} stroke="var(--fg-1)" />
          </button>
        </div>

        <button
          onClick={() => setShowSizes(!showSizes)}
          aria-label="Resize"
          style={{
            ...miniBtn(false),
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, padding: '0 6px',
            width: 'auto', minWidth: 28, color: 'var(--fg-1)',
          }}
        >
          {widget.w}×{widget.h}
        </button>
      </div>

      {/* Resize overlay */}
      {showSizes && (
        <div
          onClick={() => setShowSizes(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 3,
            background: 'oklch(0 0 0 / 0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6,
            borderRadius: 'inherit',
          }}
        >
          {def.allowedSizes.map((s) => {
            const active = s.w === widget.w && s.h === widget.h;
            return (
              <button
                key={`${s.w}x${s.h}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onResize(widget.id, s);
                  setShowSizes(false);
                }}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  fontFamily: 'var(--font-mono)', letterSpacing: 1, cursor: 'pointer',
                  background: active ? `oklch(0.78 0.16 ${def.hue})` : 'oklch(1 0 0 / 0.10)',
                  color: active ? '#06060a' : 'var(--fg-1)',
                  border: '1px solid var(--hairline-strong)',
                }}
              >
                {s.w}×{s.h}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Style helpers ─────────────────────────────────────────────

const miniBtn = (disabled: boolean, transform?: string): React.CSSProperties => ({
  width: 22, height: 22, borderRadius: 6,
  background: 'oklch(0.20 0.02 260 / 0.85)',
  border: '1px solid var(--hairline-strong)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: disabled ? 0.3 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
  transform,
});

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
  background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
  color: '#06060a', border: 'none', cursor: 'pointer',
};

const resetBtn: React.CSSProperties = {
  width: '100%', padding: 12, borderRadius: 12, fontSize: 12,
  color: 'var(--fg-3)', background: 'oklch(1 0 0 / 0.03)',
  border: '1px solid var(--hairline-strong)', cursor: 'pointer',
};
