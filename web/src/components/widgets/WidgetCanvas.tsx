/* Nik — shared widget canvas.
 *
 * Used by both HomeScreen and WidgetsScreen so the user's home layout
 * looks identical in view-mode and edit-mode. The canvas is a 2-col
 * CSS grid with `dense` auto-flow + `gridAutoRows: minmax(110px, auto)`.
 * Each widget is rendered directly as a grid item via WIDGET_TYPES; in
 * edit mode the canvas wraps each tile in a SortableItem that adds drag
 * + select handles without changing the tile's layout footprint.
 */

import React from 'react';
import {
  DndContext, type DragEndEvent, type DragStartEvent,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  closestCenter, useDraggable, useDroppable, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy,
  useSortable, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { I } from '../icons';
import { WIDGET_TYPES, type WidgetSize, type WidgetUnit } from './index';
import type { Widget, WidgetType } from '../../contracts/widgets';

export const CANVAS_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  gridAutoFlow: 'row dense',
  gridAutoRows: 'minmax(110px, auto)',
};

// Read-only canvas — exact layout used by HomeScreen.
export const ReadOnlyCanvas: React.FC<{
  widgets: Widget[];
  onOpen?: (w: Widget) => void;
}> = ({ widgets, onOpen }) => (
  <div style={CANVAS_GRID_STYLE}>
    {widgets.map((w) => {
      const def = WIDGET_TYPES[w.widget_type as WidgetType];
      if (!def) return null;
      const Render = def.Component;
      return (
        <Render
          key={w.id}
          size={{ w: w.w as WidgetUnit, h: w.h as WidgetUnit }}
          config={w.config}
          onOpen={onOpen ? () => onOpen(w) : undefined}
        />
      );
    })}
  </div>
);

// ── Edit canvas ──────────────────────────────────────────────
//
// Same grid + same widget components as ReadOnlyCanvas. Each tile is
// wrapped in a SortableItem that overlays the drag handle, ✕ remove,
// size badge, and edge-drag resize handles WITHOUT changing the
// tile's grid footprint — so the layout is byte-for-byte identical
// to the read-only render.
//
// EditCanvas owns its own DndContext + DragOverlay; the parent
// (WidgetsScreen) doesn't have to know about dnd-kit. For mixed
// canvas+library DnD, EditCanvasInner can be used inside an external
// DndContext (used by WidgetsScreen so library cards drag into the
// canvas).

export type EditCanvasHandlers = {
  onSelect: (id: string) => void;
  selectedId: string | null;
  onRemove: (id: string) => void;
  onSetSize: (w: Widget, s: WidgetSize) => void;
  onMove: (activeId: string, overId: string) => void;
  onLibraryDrop: (presetId: string, overId: string | null) => void;
};

// The grid + sortable items only — for use inside an EXTERNAL DndContext
// (so library DnD shares the same dnd state as canvas reorder).
export const EditCanvasInner: React.FC<{
  widgets: Widget[];
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSize: (w: Widget, s: WidgetSize) => void;
}> = ({ widgets, selectedId, draggingId, onSelect, onRemove, onSetSize }) => (
  <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
    <div style={CANVAS_GRID_STYLE} onClick={(e) => { if (e.target === e.currentTarget) onSelect(''); }}>
      {widgets.map((w) => (
        <SortableItem
          key={w.id}
          widget={w}
          isSelected={selectedId === w.id}
          isBeingDragged={draggingId === w.id}
          onSelect={() => onSelect(selectedId === w.id ? '' : w.id)}
          onRemove={() => onRemove(w.id)}
          onSetSize={(s) => onSetSize(w, s)}
        />
      ))}
    </div>
  </SortableContext>
);

export const EditCanvas: React.FC<{
  widgets: Widget[];
  handlers: EditCanvasHandlers;
}> = ({ widgets, handlers }) => {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [draggingPresetId, setDraggingPresetId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('lib:')) setDraggingPresetId(id.slice(4));
    else setDraggingId(id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setDraggingId(null);
    setDraggingPresetId(null);
    if (activeId.startsWith('lib:')) {
      handlers.onLibraryDrop(activeId.slice(4), overId);
      return;
    }
    if (overId && activeId !== overId) handlers.onMove(activeId, overId);
  };

  const ids = widgets.map((w) => w.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div style={CANVAS_GRID_STYLE}>
          {widgets.map((w) => (
            <SortableItem
              key={w.id}
              widget={w}
              isSelected={handlers.selectedId === w.id}
              isBeingDragged={draggingId === w.id}
              onSelect={() => handlers.onSelect(w.id)}
              onRemove={() => handlers.onRemove(w.id)}
              onSetSize={(s) => handlers.onSetSize(w, s)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {draggingId ? (
          <DragGhost widget={widgets.find((w) => w.id === draggingId)!} />
        ) : draggingPresetId ? (
          <LibraryGhost />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ── SortableItem ─────────────────────────────────────────────
//
// Wraps a single widget in dnd-kit's useSortable hook. Critically:
// the wrapper's gridColumn / gridRow span match the inner widget so
// the cell footprint is identical to the read-only render — no
// extra padding, no extra height, just the same tile with overlay
// affordances when selected.

const SortableItem: React.FC<{
  widget: Widget;
  isSelected: boolean;
  isBeingDragged: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onSetSize: (s: WidgetSize) => void;
}> = ({ widget, isSelected, isBeingDragged, onSelect, onRemove, onSetSize }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: widget.id });
  const tileRef = React.useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => { setNodeRef(node); setDropRef(node); tileRef.current = node; };

  // Optimistic local size — drag-resize updates this on every rAF
  // tick so the tile reflows instantly without round-tripping.
  const [optimistic, setOptimistic] = React.useState<WidgetSize | null>(null);
  const w = (optimistic?.w ?? widget.w) as WidgetUnit;
  const h = (optimistic?.h ?? widget.h) as WidgetUnit;
  React.useEffect(() => {
    if (optimistic && widget.w === optimistic.w && widget.h === optimistic.h) setOptimistic(null);
  }, [widget.w, widget.h, optimistic]);

  const dragging = isBeingDragged || isDragging;
  const wrapperStyle: React.CSSProperties = {
    transform: dragging ? undefined : CSS.Transform.toString(transform),
    transition: dragging ? undefined : transition,
    gridColumn: `span ${w}`,
    gridRow: `span ${h}`,
    position: 'relative',
    opacity: dragging ? 0.18 : 1,
    outline: isOver
      ? '2px dashed oklch(0.78 0.16 var(--hue))'
      : isSelected
        ? `2px solid oklch(0.85 0.16 ${def?.hue ?? 220})`
        : undefined,
    outlineOffset: isOver || isSelected ? 4 : 0,
    borderRadius: 16,
    cursor: 'pointer',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    willChange: dragging ? 'opacity' : undefined,
    // Critical for matching ReadOnlyCanvas: stretch the wrapper so
    // the inner WidgetShell (which would normally be the grid item)
    // fills 100% of the wrapper's space — same visual footprint.
    display: 'flex',
  };

  if (!def) {
    return (
      <div ref={setRefs} style={wrapperStyle} {...attributes}>
        <div className="glass" style={{ padding: 12, fontSize: 12, color: 'var(--fg-3)', flex: 1 }}>
          Unknown “{widget.widget_type}”
          <button onClick={onRemove} style={{ marginLeft: 8, color: 'var(--fg-2)', background: 'none', border: 'none', cursor: 'pointer' }}>remove</button>
        </div>
      </div>
    );
  }
  const Render = def.Component;

  // Edge-drag resize. Pointermove rAF-throttled. Distance threshold
  // = one cell-unit. Optimistic local state for instant reflow.
  const startEdgeDrag = (axis: 'w' | 'h') => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const tile = tileRef.current;
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const cellW = rect.width / w;
    const cellH = rect.height / h;
    let nextW = w; let nextH = h;
    let pending: PointerEvent | null = null; let raf = 0;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      const m = pending; pending = null;
      if (axis === 'w') {
        const u = Math.max(1, Math.min(2, Math.round((m.clientX - rect.left) / cellW))) as WidgetUnit;
        if (u !== nextW) { nextW = u; setOptimistic({ w: nextW, h: nextH }); }
      } else {
        const u = Math.max(1, Math.min(3, Math.round((m.clientY - rect.top) / cellH))) as WidgetUnit;
        if (u !== nextH) { nextH = u; setOptimistic({ w: nextW, h: nextH }); }
      }
    };
    const onMove = (m: PointerEvent) => { pending = m; if (!raf) raf = requestAnimationFrame(flush); };
    const onUp = () => {
      if (raf) { cancelAnimationFrame(raf); flush(); }
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      if (nextW !== widget.w || nextH !== widget.h) onSetSize({ w: nextW, h: nextH });
      else setOptimistic(null);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  return (
    <div
      ref={setRefs}
      style={wrapperStyle}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* The actual widget — pointerEvents disabled so taps land on
          the wrapper. flex: 1 stretches to fill the wrapper width. */}
      <div style={{ pointerEvents: 'none', flex: 1, minWidth: 0, display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Render size={{ w, h }} config={widget.config} />
        </div>
      </div>

      {/* Drag handle (top-left, only when selected) */}
      {isSelected && (
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: -6, left: -6, width: 28, height: 28, borderRadius: '50%',
            background: `linear-gradient(135deg, oklch(0.78 0.16 ${def.hue}), oklch(0.55 0.22 ${(def.hue + 40) % 360}))`,
            border: '1.5px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', zIndex: 5, touchAction: 'none',
            boxShadow: `0 4px 10px -2px oklch(0.78 0.16 ${def.hue} / 0.45)`,
          }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="#06060a">
            <circle cx="2.5" cy="3" r="1.4" /><circle cx="7.5" cy="3" r="1.4" />
            <circle cx="2.5" cy="7" r="1.4" /><circle cx="7.5" cy="7" r="1.4" />
            <circle cx="2.5" cy="11" r="1.4" /><circle cx="7.5" cy="11" r="1.4" />
          </svg>
        </div>
      )}

      {/* ✕ remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
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

      {/* Edge-drag handles when selected */}
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

      {/* Size badge in corner when not selected */}
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

// ── DragOverlay ghosts ───────────────────────────────────────

const DragGhost: React.FC<{ widget: Widget }> = ({ widget }) => {
  const def = WIDGET_TYPES[widget.widget_type as WidgetType];
  if (!def) return null;
  const Render = def.Component;
  const cell = 110; const gap = 8;
  const w = widget.w as WidgetUnit; const h = widget.h as WidgetUnit;
  return (
    <div style={{
      width: w * cell + (w - 1) * gap,
      height: h * cell + (h - 1) * gap,
      transform: 'rotate(-2deg)',
      boxShadow: `0 24px 60px -12px oklch(0 0 0 / 0.8), 0 0 0 1px oklch(0.85 0.16 ${def.hue} / 0.4)`,
      borderRadius: 18,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <Render size={{ w, h }} config={widget.config} />
    </div>
  );
};

const LibraryGhost: React.FC = () => (
  <div style={{ width: 180, height: 96, background: 'oklch(0.16 0.02 260 / 0.9)', borderRadius: 12 }} />
);

// Re-export the draggable hook so WidgetsScreen's library cards can
// use the same dnd id namespace.
export { useDraggable };
