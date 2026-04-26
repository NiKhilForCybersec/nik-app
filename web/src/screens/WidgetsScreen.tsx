/* Nik — Widgets playground.
 *
 * The user's Home canvas, in edit mode. Same widget components as
 * Home so what you arrange here is what you see there.
 *
 * Interactions (touch + mouse):
 *   • TAP-HOLD + DRAG a tile to reorder anywhere in the canvas (250ms
 *     activation so a gentle tap doesn't accidentally start dragging).
 *   • TAP the size chip to cycle through allowed sizes for that widget.
 *   • TAP ✕ to remove. TAP a library item to append it to the end.
 *   • DRAG a library item into the canvas to drop it at a specific slot.
 *   • TAP the AI prompt + GO to install/move/resize/remove via natural
 *     language (uses the LLM tool catalog).
 *
 * Grid rules:
 *   The render is a 2-col CSS grid. A widget's `w` (1 or 2) → column
 *   span; `h` (1 or 2) → row span. CSS grid auto-flow handles packing
 *   so 1×1 + 1×1 share a row, 2×1 takes its own row, 2×2 takes a
 *   2-row block. Position is a flat integer — reorder mutates it.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const [hasReset, setHasReset] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [draggingFromLibrary, setDraggingFromLibrary] = React.useState<WidgetType | null>(null);
  // Optimistic order — when user drags-to-reorder we apply locally first
  // so the DOM reflows without waiting for the round-trip to Supabase.
  const [optimistic, setOptimistic] = React.useState<Widget[] | null>(null);
  const visibleList = optimistic ?? list;

  // Auto-seed default canvas on first visit.
  React.useEffect(() => {
    if (userId && isFetched && list.length === 0 && !hasReset) {
      setHasReset(true);
      void reset.mutateAsync({});
    }
  }, [userId, isFetched, list.length, hasReset, reset]);

  // Drop optimistic state once the server catches up.
  React.useEffect(() => {
    if (optimistic && list.length === optimistic.length) {
      const sameOrder = list.every((w, i) => w.id === optimistic[i].id);
      if (sameOrder) setOptimistic(null);
    }
  }, [list, optimistic]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onAdd = async (type: WidgetType, position?: number) => {
    const def = WIDGET_TYPES[type];
    await install.mutateAsync({
      widgetType: type,
      position,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
    });
  };

  const onRemove = async (id: string) => {
    if (!confirm('Remove this widget from your Home?')) return;
    await remove.mutateAsync({ id });
  };

  const onCycleSize = async (w: Widget) => {
    const def = WIDGET_TYPES[w.widget_type as WidgetType];
    if (!def || def.allowedSizes.length < 2) return;
    const idx = def.allowedSizes.findIndex((s) => s.w === w.w && s.h === w.h);
    const next = def.allowedSizes[(idx + 1) % def.allowedSizes.length];
    await resize.mutateAsync({ id: w.id, w: next.w, h: next.h });
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('lib:')) {
      setDraggingFromLibrary(id.slice(4) as WidgetType);
    } else {
      setDraggingId(id);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setDraggingId(null);
    setDraggingFromLibrary(null);

    if (!overId) return;

    // Library → canvas: install at target slot's position.
    if (activeId.startsWith('lib:')) {
      const type = activeId.slice(4) as WidgetType;
      const overWidget = list.find((w) => w.id === overId);
      const insertAt = overWidget ? overWidget.position : list.length;
      await onAdd(type, insertAt);
      return;
    }

    // Sortable reorder within canvas.
    if (activeId === overId) return;
    const oldIndex = list.findIndex((w) => w.id === activeId);
    const newIndex = list.findIndex((w) => w.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setOptimistic(reordered);
    const newPos = list[newIndex].position;
    await move.mutateAsync({ id: activeId, position: newPos });
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

  const ids = visibleList.map((w) => w.id);

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <Header count={visibleList.length} />

      <AiPrompt
        value={aiInput}
        onChange={setAiInput}
        onSubmit={onAiSubmit}
        busy={aiBusy}
        note={aiNote}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* CANVAS */}
        {isLoading && <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: 16 }}>Loading…</div>}

        {!isLoading && visibleList.length === 0 && (
          <div className="glass" style={{ padding: 20, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 8 }}>No widgets on your Home yet.</div>
            <button onClick={onReset} className="tap" style={primaryBtn}>Install starter set</button>
          </div>
        )}

        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {visibleList.map((w) => (
              <SortableWidget
                key={w.id}
                widget={w}
                onRemove={onRemove}
                onCycleSize={onCycleSize}
                isBeingDragged={draggingId === w.id}
              />
            ))}
          </div>
        </SortableContext>

        {/* LIBRARY */}
        <Library
          installedTypes={new Set(visibleList.map((w) => w.widget_type as WidgetType))}
          onTap={(t) => onAdd(t)}
          installPending={install.isPending}
        />

        <DragOverlay dropAnimation={null}>
          {draggingId ? (
            <DragGhost widget={visibleList.find((w) => w.id === draggingId)!} />
          ) : draggingFromLibrary ? (
            <LibraryGhost type={draggingFromLibrary} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleList.length > 0 && (
        <button onClick={onReset} className="tap" style={resetBtn}>
          Reset to default canvas
        </button>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────

const Header: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        EDIT MODE · TAP-HOLD TO DRAG
      </div>
      <div className="display" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Your canvas</div>
    </div>
    <Chip tone="accent" size="sm">{count} {count === 1 ? 'WIDGET' : 'WIDGETS'}</Chip>
  </div>
);

// ── AI prompt ─────────────────────────────────────────────────

const AiPrompt: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  note: string | null;
}> = ({ value, onChange, onSubmit, busy, note }) => (
  <>
    <form onSubmit={onSubmit} className="glass" style={{ padding: 10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.25)' }}>
      <I.sparkle size={14} stroke="oklch(0.92 0.14 var(--hue))" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask Nik — &ldquo;add a sleep widget below score&rdquo;"
        disabled={busy}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--fg-1)', fontSize: 13, fontFamily: 'var(--font-body)',
        }}
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="tap"
        style={{
          padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: value.trim() && !busy
            ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))'
            : 'oklch(1 0 0 / 0.05)',
          color: value.trim() && !busy ? '#06060a' : 'var(--fg-3)',
          border: 'none', cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? '…' : 'GO'}
      </button>
    </form>
    {note && (
      <div style={{ marginTop: -8, marginBottom: 14, fontSize: 11, color: 'var(--fg-3)', padding: '4px 10px' }}>{note}</div>
    )}
  </>
);

// ── Sortable widget — render the real widget + drag/drop wiring ──

const SortableWidget: React.FC<{
  widget: Widget;
  onRemove: (id: string) => void;
  onCycleSize: (w: Widget) => void;
  isBeingDragged: boolean;
}> = ({ widget, onRemove, onCycleSize, isBeingDragged }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  // Also accept drops from library on this slot.
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: widget.id });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
    position: 'relative',
    opacity: isBeingDragged || isDragging ? 0.35 : 1,
    outline: isOver ? '2px dashed oklch(0.78 0.16 var(--hue))' : undefined,
    outlineOffset: isOver ? 4 : 0,
    borderRadius: 16,
    cursor: 'grab',
    touchAction: 'manipulation',
  };

  if (!def) {
    return (
      <div ref={setRefs} style={style} {...attributes} {...listeners}>
        <div className="glass" style={{ padding: 12, fontSize: 12, color: 'var(--fg-3)' }}>
          Unknown “{widget.widget_type}”
          <button onClick={() => onRemove(widget.id)} style={{ marginLeft: 8, color: 'var(--fg-2)', background: 'none', border: 'none', cursor: 'pointer' }}>remove</button>
        </div>
      </div>
    );
  }
  const Render = def.Component;

  return (
    <div ref={setRefs} style={style} {...attributes} {...listeners}>
      {/* Tap-through disabled while editing. */}
      <div style={{ pointerEvents: 'none' }}>
        <Render size={{ w: widget.w as 1 | 2, h: widget.h as 1 | 2 }} config={widget.config} />
      </div>

      {/* ✕ remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Remove"
        style={{
          position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
          background: 'oklch(0.20 0.02 260)', border: '1px solid var(--hairline-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4,
        }}
      >
        <I.close size={10} stroke="var(--fg-1)" />
      </button>

      {/* size cycle chip — tap to step through allowedSizes */}
      <button
        onClick={(e) => { e.stopPropagation(); onCycleSize(widget); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Resize"
        style={{
          position: 'absolute', bottom: 6, right: 6, padding: '3px 7px',
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          background: 'oklch(0.20 0.02 260 / 0.85)',
          border: '1px solid var(--hairline-strong)', borderRadius: 8,
          color: 'var(--fg-1)', cursor: 'pointer', zIndex: 4,
        }}
      >
        {widget.w}×{widget.h}
      </button>
    </div>
  );
};

// ── DragOverlay ghosts ────────────────────────────────────────

const DragGhost: React.FC<{ widget: Widget }> = ({ widget }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  if (!def) return null;
  const Render = def.Component;
  return (
    <div style={{
      width: widget.w === 2 ? 280 : 140, height: 110,
      transform: 'rotate(-3deg)',
      boxShadow: '0 16px 50px -10px oklch(0 0 0 / 0.6)',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: widget.w === 2 ? '1fr' : '1fr', gap: 0 }}>
        <Render size={{ w: widget.w as 1 | 2, h: widget.h as 1 | 2 }} config={widget.config} />
      </div>
    </div>
  );
};

const LibraryGhost: React.FC<{ type: WidgetType }> = ({ type }) => {
  const def = WIDGET_TYPES[type];
  const Ic = I[def.icon] ?? I.sparkle;
  return (
    <div className="glass" style={{
      padding: 12, width: 200, transform: 'rotate(-3deg)',
      boxShadow: '0 16px 50px -10px oklch(0 0 0 / 0.6)',
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${def.hue} / 0.20), transparent 80%)`,
      borderColor: `oklch(0.78 0.16 ${def.hue} / 0.4)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ic size={14} stroke={`oklch(0.92 0.14 ${def.hue})`} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>{def.label}</span>
      </div>
    </div>
  );
};

// ── Library ────────────────────────────────────────────────────

const Library: React.FC<{
  installedTypes: Set<WidgetType>;
  onTap: (t: WidgetType) => void;
  installPending: boolean;
}> = ({ installedTypes, onTap, installPending }) => {
  // List_preview can be added multiple times; everything else is a
  // single-instance widget, hidden from the library once installed.
  const available = ALL_TYPES.filter((t) => !installedTypes.has(t) || t === 'list_preview');

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        LIBRARY · {available.length} AVAILABLE · TAP OR DRAG INTO CANVAS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {available.map((t) => (
          <DraggableLibraryItem key={t} type={t} onTap={() => onTap(t)} disabled={installPending} />
        ))}
        {available.length === 0 && (
          <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--fg-3)', padding: 12, textAlign: 'center' }}>
            All widget types installed. Remove one to free a slot, or add a List preview.
          </div>
        )}
      </div>
    </div>
  );
};

const DraggableLibraryItem: React.FC<{
  type: WidgetType;
  onTap: () => void;
  disabled: boolean;
}> = ({ type, onTap, disabled }) => {
  const def = WIDGET_TYPES[type];
  const Ic = I[def.icon] ?? I.sparkle;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lib:${type}` });
  return (
    <button
      ref={setNodeRef}
      onClick={onTap}
      disabled={disabled}
      className="glass tap"
      style={{
        padding: 12, textAlign: 'left', cursor: 'grab',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${def.hue} / 0.10), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${def.hue} / 0.22)`,
        display: 'flex', flexDirection: 'column', gap: 4,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'manipulation',
      }}
      {...listeners}
      {...attributes}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ic size={12} stroke={`oklch(0.92 0.14 ${def.hue})`} />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)' }}>{def.label}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', lineHeight: 1.3 }}>{def.description}</div>
      <div style={{ marginTop: 4, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        + {def.defaultSize.w}×{def.defaultSize.h} · DRAG OR TAP
      </div>
    </button>
  );
};

// ── Style helpers ─────────────────────────────────────────────

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
