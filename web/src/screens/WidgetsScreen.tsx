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
import { WIDGET_TYPES, type WidgetSize, type WidgetUnit } from '../components/widgets';
import { llm } from '../lib/llm';
import { buildToolCatalog, executeToolCall } from '../lib/llm/tools';
import type { LLMMessage, LLMToolCall } from '../lib/llm/types';

const ALL_TYPES = Object.keys(WIDGET_TYPES) as WidgetType[];
const TOOL_CATALOG = buildToolCatalog();

// ── Library presets ────────────────────────────────────────────
//
// A library entry is either a single-instance widget type (Hydration,
// Score, etc.) or a parameterized `list_preview` instance with a
// pre-set ItemKind. This lets the library expose ~40 distinct cards
// out of 14 underlying widget types — every feature in the app
// becomes one tap away on Home.

type LibraryPreset = {
  /** Stable id for dnd. */
  id: string;
  /** Underlying widget type to install. */
  widgetType: WidgetType;
  /** Per-instance config to seed at install time. */
  config: Record<string, unknown>;
  /** Display label in the library card. */
  label: string;
  /** Description shown beneath the label. */
  description: string;
  /** I[icon] key. */
  icon: keyof typeof I;
  /** Theme hue for the card + installed widget. */
  hue: number;
};

// Per-ItemKind list_preview presets — each maps to a real screen.
const KIND_PRESETS: LibraryPreset[] = [
  // Health
  { id: 'k:nutrition',  widgetType: 'list_preview', config: { kind: 'nutrition'  }, label: 'Nutrition log',     description: 'Today\'s meals + macros.',           icon: 'flame',    hue: 30  },
  { id: 'k:symptoms',   widgetType: 'list_preview', config: { kind: 'symptoms'   }, label: 'Symptoms',           description: 'Recent flags worth tracking.',       icon: 'heart',    hue: 0   },
  { id: 'k:doctor',     widgetType: 'list_preview', config: { kind: 'doctor'     }, label: 'Doctors',            description: 'Appointments + contacts.',           icon: 'heart',    hue: 350 },
  // Mind
  { id: 'k:reading',    widgetType: 'list_preview', config: { kind: 'reading'    }, label: 'Reading list',       description: 'Books + articles in progress.',      icon: 'book',     hue: 280 },
  { id: 'k:learning',   widgetType: 'list_preview', config: { kind: 'learning'   }, label: 'Learning',           description: 'Courses + skills you\'re building.', icon: 'brain',    hue: 250 },
  { id: 'k:gratitude',  widgetType: 'list_preview', config: { kind: 'gratitude'  }, label: 'Gratitude',          description: 'Things you\'re grateful for.',       icon: 'sparkle',  hue: 320 },
  { id: 'k:goal',       widgetType: 'list_preview', config: { kind: 'goal'       }, label: 'Goals',              description: 'Active goals + next steps.',         icon: 'target',   hue: 200 },
  { id: 'k:reflection', widgetType: 'list_preview', config: { kind: 'reflection' }, label: 'Reflections',        description: 'Open prompts + answers.',            icon: 'sparkle',  hue: 290 },
  { id: 'k:language',   widgetType: 'list_preview', config: { kind: 'language_deck' }, label: 'Language decks',  description: 'Vocab decks + review queue.',        icon: 'book',     hue: 260 },
  // People
  { id: 'k:friend',     widgetType: 'list_preview', config: { kind: 'friend'     }, label: 'Friends',            description: 'People to keep in touch with.',      icon: 'family',   hue: 150 },
  { id: 'k:pet',        widgetType: 'list_preview', config: { kind: 'pet'        }, label: 'Pets',               description: 'Vet, food, grooming.',               icon: 'heart',    hue: 35  },
  { id: 'k:birthday',   widgetType: 'list_preview', config: { kind: 'birthday'   }, label: 'Birthdays',          description: 'Upcoming birthdays.',                icon: 'sparkle',  hue: 300 },
  { id: 'k:contact',    widgetType: 'list_preview', config: { kind: 'contact'    }, label: 'Network',            description: 'People to reach out to.',            icon: 'family',   hue: 220 },
  // Money
  { id: 'k:bill',          widgetType: 'list_preview', config: { kind: 'bill'         }, label: 'Bills due',       description: 'Upcoming bills + autopay status.',   icon: 'flame',  hue: 0   },
  { id: 'k:subscription',  widgetType: 'list_preview', config: { kind: 'subscription' }, label: 'Subscriptions',   description: 'Recurring charges + renewals.',      icon: 'grid',   hue: 240 },
  { id: 'k:investment',    widgetType: 'list_preview', config: { kind: 'investment'   }, label: 'Investments',     description: 'Holdings + check-in cadence.',       icon: 'sparkle', hue: 140 },
  { id: 'k:receipt',       widgetType: 'list_preview', config: { kind: 'receipt'      }, label: 'Receipts',        description: 'Recent saved receipts.',             icon: 'book',   hue: 60  },
  // Home & errands
  { id: 'k:shopping',      widgetType: 'list_preview', config: { kind: 'shopping'        }, label: 'Shopping list',  description: 'Things to buy.',                   icon: 'grid',   hue: 200 },
  { id: 'k:recipe',        widgetType: 'list_preview', config: { kind: 'recipe'          }, label: 'Recipes',        description: 'Saved + queued recipes.',          icon: 'book',   hue: 25  },
  { id: 'k:maintenance',   widgetType: 'list_preview', config: { kind: 'home_maintenance'}, label: 'Maintenance',    description: 'Tasks for the home.',              icon: 'check',  hue: 60  },
  { id: 'k:plant',         widgetType: 'list_preview', config: { kind: 'plant'           }, label: 'Plants',         description: 'Watering + care notes.',           icon: 'check',  hue: 130 },
  { id: 'k:wardrobe',      widgetType: 'list_preview', config: { kind: 'wardrobe'        }, label: 'Wardrobe',       description: 'What you wore + outfits.',         icon: 'grid',   hue: 280 },
  // Memory
  { id: 'k:trip',          widgetType: 'list_preview', config: { kind: 'trip'         }, label: 'Travel',          description: 'Trips planned + memories.',         icon: 'sparkle', hue: 200 },
  { id: 'k:achievement',   widgetType: 'list_preview', config: { kind: 'achievement'  }, label: 'Achievements',    description: 'Wins worth keeping.',               icon: 'sparkle', hue: 50  },
  { id: 'k:bucket',        widgetType: 'list_preview', config: { kind: 'bucket_list'  }, label: 'Bucket list',     description: 'Things you want to do someday.',    icon: 'sparkle', hue: 320 },
  { id: 'k:capsule',       widgetType: 'list_preview', config: { kind: 'time_capsule' }, label: 'Time capsule',    description: 'Notes to your future self.',        icon: 'book',    hue: 220 },
  { id: 'k:photo',         widgetType: 'list_preview', config: { kind: 'photo'        }, label: 'Photos',          description: 'Recently saved photos.',            icon: 'grid',    hue: 290 },
  // Work
  { id: 'k:project',       widgetType: 'list_preview', config: { kind: 'project'      }, label: 'Projects',        description: 'Active work projects.',             icon: 'grid',    hue: 220 },
  { id: 'k:side_project',  widgetType: 'list_preview', config: { kind: 'side_project' }, label: 'Side projects',   description: 'After-hours building.',              icon: 'sparkle', hue: 270 },
  { id: 'k:career',        widgetType: 'list_preview', config: { kind: 'career_note'  }, label: 'Career notes',    description: 'Wins, asks, performance.',          icon: 'book',    hue: 240 },
];

// Single-instance widgets get one preset each (config is empty).
const SINGLE_PRESETS: LibraryPreset[] = ALL_TYPES
  .filter((t) => t !== 'list_preview')
  .map((t) => {
    const def = WIDGET_TYPES[t];
    return {
      id: `t:${t}`,
      widgetType: t,
      config: {},
      label: def.label,
      description: def.description,
      icon: def.icon,
      hue: def.hue,
    };
  });

const ALL_PRESETS: LibraryPreset[] = [...SINGLE_PRESETS, ...KIND_PRESETS];
const SYSTEM_PROMPT = `You manage the user's home-screen widgets. Use widgets.install / widgets.move / widgets.resize / widgets.remove to do exactly what the user asks.

WIDGET GRID RULES (mirror what the playground enforces):
• The canvas is a 2-column grid that auto-flows top-to-bottom.
• Every widget has w ∈ {1, 2} and h ∈ {1, 2}. The four valid shapes are: 1×1 (small square), 2×1 (wide), 1×2 (tall), 2×2 (hero). Every widget type supports every shape.
• Per row: two 1×1 share a row, OR one 2×1 takes a full row. A 2×2 spans two rows. Tall (1×2) widgets pair with another 1×2 in the same column or with two 1×1.
• Position is a flat integer; reorder by passing the new position to widgets.move and the rest shift accordingly.

SIZING GUIDANCE:
• Hero metrics the user asks to "make bigger" / "feature" → 2×2.
• Standalone simple counters (Streak, Today's events) → 1×1 default.
• Lists and stories (Diary, Active quest, Next event) → 2×1 default, can grow to 2×2 if the user wants more preview.
• Default to defaultSize unless the user specifies otherwise.

After tools run, give a one-line confirmation. Be concise.`;

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
  const [draggingFromLibrary, setDraggingFromLibrary] = React.useState<LibraryPreset | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
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

  const onAdd = async (preset: LibraryPreset, position?: number) => {
    const def = WIDGET_TYPES[preset.widgetType];
    await install.mutateAsync({
      widgetType: preset.widgetType,
      position,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      config: preset.config,
    });
  };

  const onRemove = async (id: string) => {
    if (!confirm('Remove this widget from your Home?')) return;
    await remove.mutateAsync({ id });
  };

  const onSetSize = async (w: Widget, size: WidgetSize) => {
    if (size.w === w.w && size.h === w.h) return;
    await resize.mutateAsync({ id: w.id, w: size.w, h: size.h });
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('lib:')) {
      const preset = ALL_PRESETS.find((p) => p.id === id.slice(4));
      if (preset) setDraggingFromLibrary(preset);
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
      const presetId = activeId.slice(4);
      const preset = ALL_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const overWidget = list.find((w) => w.id === overId);
      const insertAt = overWidget ? overWidget.position : list.length;
      await onAdd(preset, insertAt);
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
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}
          >
            {visibleList.map((w) => (
              <SortableWidget
                key={w.id}
                widget={w}
                onRemove={onRemove}
                onSetSize={onSetSize}
                isBeingDragged={draggingId === w.id}
                isSelected={selectedId === w.id}
                onSelect={() => setSelectedId(selectedId === w.id ? null : w.id)}
              />
            ))}
          </div>
        </SortableContext>

        {/* LIBRARY */}
        <Library
          installed={visibleList}
          onTap={(p) => onAdd(p)}
          installPending={install.isPending}
        />

        <DragOverlay dropAnimation={null}>
          {draggingId ? (
            <DragGhost widget={visibleList.find((w) => w.id === draggingId)!} />
          ) : draggingFromLibrary ? (
            <LibraryGhost preset={draggingFromLibrary} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleList.length > 0 && (
        <button onClick={onReset} className="tap" style={resetBtn}>
          Reset to default canvas
        </button>
      )}

      {/* Floating size dock — appears when any tile is selected, sits
          above the tab bar so it never gets cut off (which the
          per-tile selector did when the selected tile was at the
          top of the canvas). 3×3 grid; tap any cell to set that
          shape on the selected widget. */}
      {(() => {
        const selected = visibleList.find((w) => w.id === selectedId);
        if (!selected) return null;
        const def = WIDGET_TYPES[selected.widget_type as WidgetType];
        const cw = selected.w as WidgetUnit;
        const ch = selected.h as WidgetUnit;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
              padding: 12, borderRadius: 16,
              background: 'oklch(0.14 0.02 260 / 0.96)',
              border: `1px solid oklch(0.85 0.16 ${def?.hue ?? 220} / 0.5)`,
              backdropFilter: 'blur(14px)',
              boxShadow: '0 14px 40px -10px oklch(0 0 0 / 0.7)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.4, marginBottom: 2 }}>
                RESIZE
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {def?.label ?? selected.widget_type}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 22px)', gap: 5 }}>
              {([1, 2, 3] as const).flatMap((sh) => ([1, 2, 3] as const).map((sw) => {
                const active = sw === cw && sh === ch;
                return (
                  <button
                    key={`${sw}x${sh}`}
                    onClick={() => resize.mutateAsync({ id: selected.id, w: sw, h: sh })}
                    aria-label={`${sw}×${sh}`}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: active ? `oklch(0.85 0.16 ${def?.hue ?? 220})` : `oklch(0.78 0.16 ${def?.hue ?? 220} / 0.18)`,
                      border: `1px solid oklch(0.85 0.16 ${def?.hue ?? 220} / ${active ? 1 : 0.4})`,
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 600,
                      color: active ? '#06060a' : 'transparent',
                    }}
                  >
                    {`${sw}${sh}`}
                  </button>
                );
              }))}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'oklch(1 0 0 / 0.06)', border: '1px solid var(--hairline-strong)',
                color: 'var(--fg-2)', cursor: 'pointer', fontSize: 12, padding: 0,
              }}
              aria-label="Done"
            >
              ✓
            </button>
          </div>
        );
      })()}
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
  onSetSize: (w: Widget, s: WidgetSize) => void;
  isBeingDragged: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ widget, onRemove, onSetSize, isBeingDragged, isSelected, onSelect }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: widget.id });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  const tileRef = React.useRef<HTMLDivElement | null>(null);

  // Optimistic resize state. While dragging an edge we update this
  // local size on every rAF tick so the tile reflows immediately;
  // the actual resize.mutateAsync() fires once on pointerup. Without
  // this, every drag tick triggers a server round-trip + cache
  // invalidate + full canvas re-render — jank galore.
  const [optimisticSize, setOptimisticSize] = React.useState<WidgetSize | null>(null);
  const w = (optimisticSize?.w ?? widget.w) as WidgetUnit;
  const h = (optimisticSize?.h ?? widget.h) as WidgetUnit;
  React.useEffect(() => {
    // Drop optimistic state once the server-side row matches.
    if (optimisticSize && widget.w === optimisticSize.w && widget.h === optimisticSize.h) {
      setOptimisticSize(null);
    }
  }, [widget.w, widget.h, optimisticSize]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${w}`,
    gridRow: `span ${h}`,
    position: 'relative',
    opacity: isBeingDragged || isDragging ? 0.35 : 1,
    outline: isOver
      ? '2px dashed oklch(0.78 0.16 var(--hue))'
      : isSelected
        ? `2px solid oklch(0.85 0.16 ${def?.hue ?? 220})`
        : undefined,
    outlineOffset: isOver || isSelected ? 4 : 0,
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

  // Edge-drag resize handler.
  //
  // - Right edge → grows/shrinks w through {1, 2, 3}.
  // - Bottom edge → same for h.
  // - Snap maps cursor distance from the tile's left/top edge to the
  //   nearest cell-unit, so dragging past one cell of distance flips
  //   to the next size.
  // - Pointermove is rAF-throttled so we never process more than one
  //   logical update per paint frame.
  // - Optimistic state updates (setOptimisticSize) makes the tile
  //   reflow instantly while the user drags. The actual mutation
  //   only fires on pointerup, so the network round-trip happens at
  //   most once per drag.
  const startEdgeDrag = (axis: 'w' | 'h') => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const tile = tileRef.current;
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Cell-unit size = current tile dim ÷ current w/h.
    const cellW = rect.width / w;
    const cellH = rect.height / h;
    let nextW = w;
    let nextH = h;

    let pending: PointerEvent | null = null;
    let raf = 0;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      const m = pending;
      pending = null;
      let changed = false;
      if (axis === 'w') {
        const distFromLeft = m.clientX - rect.left;
        const units = Math.max(1, Math.min(3, Math.round(distFromLeft / cellW))) as WidgetUnit;
        if (units !== nextW) { nextW = units; changed = true; }
      } else {
        const distFromTop = m.clientY - rect.top;
        const units = Math.max(1, Math.min(3, Math.round(distFromTop / cellH))) as WidgetUnit;
        if (units !== nextH) { nextH = units; changed = true; }
      }
      if (changed) setOptimisticSize({ w: nextW, h: nextH });
    };

    const onMove = (m: PointerEvent) => {
      pending = m;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onUp = () => {
      if (raf) { cancelAnimationFrame(raf); flush(); }
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      if (nextW !== widget.w || nextH !== widget.h) {
        onSetSize(widget, { w: nextW, h: nextH });
      } else {
        setOptimisticSize(null);
      }
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  // Tap a cell in the 3×3 selector → instant optimistic resize +
  // commit.
  const setSize = (next: WidgetSize) => {
    setOptimisticSize(next);
    onSetSize(widget, next);
  };

  return (
    <div
      ref={(n) => { setRefs(n); tileRef.current = n; }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Tap-through disabled while editing. Render at the optimistic
          size so resize feels immediate. */}
      <div style={{ pointerEvents: 'none' }}>
        <Render size={{ w, h }} config={widget.config} />
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

      {/* Edge-drag resize handles — only when selected. Right edge
          flips width through {1, 2, 3}; bottom edge flips height.
          Touch targets are 16px wide / tall (visible bar is thinner
          and centred inside) so they're easy to grab on touch. */}
      {isSelected && (
        <>
          <div
            onPointerDown={startEdgeDrag('w')}
            aria-label="Drag right edge to resize width"
            style={{
              position: 'absolute', top: 14, bottom: 14, right: -8,
              width: 16, zIndex: 5, touchAction: 'none', cursor: 'ew-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              width: 4, height: '60%', borderRadius: 2,
              background: `oklch(0.85 0.16 ${def.hue})`,
              boxShadow: `0 0 6px oklch(0.85 0.16 ${def.hue} / 0.7)`,
            }} />
          </div>
          <div
            onPointerDown={startEdgeDrag('h')}
            aria-label="Drag bottom edge to resize height"
            style={{
              position: 'absolute', left: 14, right: 14, bottom: -8,
              height: 16, zIndex: 5, touchAction: 'none', cursor: 'ns-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              width: '60%', height: 4, borderRadius: 2,
              background: `oklch(0.85 0.16 ${def.hue})`,
              boxShadow: `0 0 6px oklch(0.85 0.16 ${def.hue} / 0.7)`,
            }} />
          </div>
        </>
      )}


      {/* Tiny size badge in the corner when not selected (always visible) */}
      {!isSelected && (
        <div
          style={{
            position: 'absolute', bottom: 6, right: 6, padding: '2px 6px',
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
            background: 'oklch(0.20 0.02 260 / 0.7)',
            border: '1px solid var(--hairline)', borderRadius: 6,
            color: 'var(--fg-3)', pointerEvents: 'none', zIndex: 3,
          }}
        >
          {w}×{h}
        </div>
      )}
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
        <Render size={{ w: widget.w as WidgetUnit, h: widget.h as WidgetUnit }} config={widget.config} />
      </div>
    </div>
  );
};

const LibraryGhost: React.FC<{ preset: LibraryPreset }> = ({ preset }) => {
  const Ic = I[preset.icon] ?? I.sparkle;
  return (
    <div className="glass" style={{
      padding: 12, width: 200, transform: 'rotate(-3deg)',
      boxShadow: '0 16px 50px -10px oklch(0 0 0 / 0.6)',
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${preset.hue} / 0.20), transparent 80%)`,
      borderColor: `oklch(0.78 0.16 ${preset.hue} / 0.4)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ic size={14} stroke={`oklch(0.92 0.14 ${preset.hue})`} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>{preset.label}</span>
      </div>
    </div>
  );
};

// ── Library ────────────────────────────────────────────────────

const Library: React.FC<{
  installed: Widget[];
  onTap: (p: LibraryPreset) => void;
  installPending: boolean;
}> = ({ installed, onTap, installPending }) => {
  // Single-instance widgets disappear from the library once installed.
  // Per-kind list_preview presets stay visible unless the user has
  // already installed that exact (widget_type, config.kind) pair.
  const installedKeys = new Set(
    installed.map((w) => `${w.widget_type}:${(w.config as { kind?: string })?.kind ?? ''}`),
  );
  const available = ALL_PRESETS.filter((p) => {
    const key = `${p.widgetType}:${(p.config as { kind?: string })?.kind ?? ''}`;
    return !installedKeys.has(key);
  });

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        LIBRARY · {available.length} AVAILABLE · SWIPE · TAP OR DRAG TO PLACE
      </div>
      {available.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: 12, textAlign: 'center' }}>
          Every widget type and list is on your canvas already. Remove one to swap.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            // 3 rows of cards. gridAutoFlow: column packs cards top-to-bottom
            // first, then advances to the next column → user scrolls right
            // to see more. scrollSnapType keeps cards aligned.
            gridTemplateRows: 'repeat(3, 1fr)',
            gridAutoFlow: 'column',
            gridAutoColumns: '180px',
            gap: 8,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            paddingBottom: 8,
            // Hide native scrollbar while keeping scroll
            scrollbarWidth: 'thin',
            // Negative side margin so cards reach screen edges
            marginInline: -16, paddingInline: 16,
          }}
        >
          {available.map((p) => (
            <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
              <DraggableLibraryItem preset={p} onTap={() => onTap(p)} disabled={installPending} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DraggableLibraryItem: React.FC<{
  preset: LibraryPreset;
  onTap: () => void;
  disabled: boolean;
}> = ({ preset, onTap, disabled }) => {
  const def = WIDGET_TYPES[preset.widgetType];
  const Ic = I[preset.icon] ?? I.sparkle;
  const hue = preset.hue;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lib:${preset.id}` });
  return (
    <button
      ref={setNodeRef}
      onClick={onTap}
      disabled={disabled}
      className="glass tap"
      style={{
        position: 'relative', overflow: 'hidden',
        padding: 14, textAlign: 'left', cursor: 'grab',
        background: `
          radial-gradient(ellipse 70% 50% at 100% 0%, oklch(0.78 0.16 ${hue} / 0.22), transparent 65%),
          linear-gradient(135deg, oklch(0.20 0.04 ${hue} / 0.40), oklch(0.12 0.02 260 / 0.30) 70%)
        `,
        borderColor: `oklch(0.78 0.16 ${hue} / 0.32)`,
        display: 'flex', flexDirection: 'column', gap: 8,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'manipulation',
        minHeight: 96,
      }}
      {...listeners}
      {...attributes}
    >
      {/* Ambient halo */}
      <div aria-hidden style={{
        position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, oklch(0.78 0.16 ${hue} / 0.22) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row: icon disc + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue}), oklch(0.55 0.22 ${(hue + 40) % 360}))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px -4px oklch(0.78 0.16 ${hue} / 0.45)`,
          flexShrink: 0,
        }}>
          <Ic size={16} stroke="#06060a" sw={2.2} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preset.label}
          </div>
          <div style={{ fontSize: 9, color: `oklch(0.85 0.13 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
            {def.defaultSize.w}×{def.defaultSize.h} · ALL SIZES
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, position: 'relative', zIndex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {preset.description}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        fontSize: 9, color: `oklch(0.85 0.13 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1.2,
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.plus size={10} stroke={`oklch(0.85 0.13 ${hue})`} sw={2.2} /> ADD
        </span>
        <span style={{ opacity: 0.6 }}>DRAG TO PLACE</span>
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
