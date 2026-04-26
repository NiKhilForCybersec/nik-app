/* Nik — generic items list screen.
 *
 * Renders a typed `kind` of item from the items contract: list, add,
 * mark done, archive. Used by Reading, Shopping, Birthdays, etc.
 * Per-kind screens are thin wrappers that pass props.
 *
 * Per-item rich rendering (book pages, prices, recurring schedules)
 * comes via the optional `renderMeta` prop — a function that gets the
 * Item.meta blob and returns JSX. Default just shows a small summary.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { I } from './icons';
import { Chip, HUDCorner } from './primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { items as itemsOps } from '../contracts/items';
import type { Item, ItemKind } from '../contracts/items';
import { getKindProfile, type RowAccent } from './items/kindProfiles';

export type ItemsListScreenProps = {
  /** Discriminator value — passed straight to items.list/.create. */
  kind: ItemKind;
  /** "Reading", "Shopping list", etc. */
  title: string;
  /** Eyebrow over the title (mono small caps). */
  eyebrow?: string;
  /** I[icon] key. */
  icon?: keyof typeof I;
  /** Theme hue used for accents. */
  hue?: number;
  /** Placeholder text for the add input. */
  addPlaceholder?: string;
  /** Empty-state line. */
  emptyHint?: string;
  /** Whether to show a date input next to the title (birthdays / trips). */
  withDate?: boolean;
  /** Custom per-item secondary line. Receives the parsed Item.meta blob. */
  renderMeta?: (item: Item) => React.ReactNode;
};

export default function ItemsListScreen({
  kind, title, eyebrow, icon = 'sparkle', hue = 220,
  addPlaceholder = 'Add an item…',
  emptyHint = 'Nothing here yet — add your first.',
  withDate = false,
  renderMeta,
}: ItemsListScreenProps) {
  const { data: list = [] } = useOp(itemsOps.list, { kind });
  const create = useOpMutation(itemsOps.create);
  const update = useOpMutation(itemsOps.update);
  const archive = useOpMutation(itemsOps.archive);
  const qc = useQueryClient();

  // Kind profile: per-domain header stats, row accents, add-row extras.
  // Falls back to a generic profile for unmapped kinds so the screen
  // still works even before that domain has been customised.
  const profile = getKindProfile(kind);

  const [text, setText] = React.useState('');
  const [date, setDate] = React.useState('');
  const [extraMeta, setExtraMeta] = React.useState<Record<string, unknown>>({});
  const [busy, setBusy] = React.useState(false);

  const Ic = I[icon] ?? I.sparkle;

  const add = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await create.mutateAsync({
        kind,
        title: text.trim(),
        ...(withDate && date ? { occursAt: new Date(date).toISOString() } : {}),
        ...(Object.keys(extraMeta).length > 0 ? { meta: extraMeta } : {}),
      });
      setText('');
      setDate('');
      setExtraMeta({});
      await qc.invalidateQueries({ queryKey: ['items.list'] });
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = async (item: Item) => {
    await update.mutateAsync({
      id: item.id,
      status: item.status === 'done' ? 'active' : 'done',
    });
    await qc.invalidateQueries({ queryKey: ['items.list'] });
  };

  const remove = async (item: Item) => {
    await archive.mutateAsync({ id: item.id });
    await qc.invalidateQueries({ queryKey: ['items.list'] });
  };

  // Sort is profile-driven (e.g. birthdays sort by next-occurrence,
  // bills by due date). Default keeps the API order.
  const sorted = profile.sort ? [...list].sort(profile.sort) : list;
  const active = sorted.filter((i) => i.status !== 'done');
  const done = sorted.filter((i) => i.status === 'done');
  const headerStats = profile.headerStats?.(list) ?? [];

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Header */}
      <div style={{ marginBottom: headerStats.length > 0 ? 12 : 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {eyebrow ?? `${list.length} TOTAL`}
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
            {title}
          </div>
        </div>
        <Chip tone="accent" size="lg">{active.length} ACTIVE</Chip>
      </div>

      {/* Per-kind header stats — small chip row of domain summaries */}
      {headerStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${headerStats.length}, 1fr)`, gap: 6, marginBottom: 16 }}>
          {headerStats.map((s, i) => (
            <div key={i} className="glass" style={{
              padding: '8px 10px', textAlign: 'center',
              background: `linear-gradient(135deg, oklch(0.78 0.16 ${s.hue ?? hue} / 0.10), transparent 80%)`,
              borderColor: `oklch(0.78 0.16 ${s.hue ?? hue} / 0.22)`,
            }}>
              <div className="display" style={{ fontSize: 18, fontWeight: 600, color: `oklch(0.92 0.14 ${s.hue ?? hue})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.2, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add row */}
      <div className="glass scanlines fade-up" style={{
        padding: 14, marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.10), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${hue} / 0.28)`,
      }}>
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `oklch(0.78 0.16 ${hue} / 0.22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ic size={16} stroke={`oklch(0.92 0.14 ${hue})`} />
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={addPlaceholder}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--fg)', fontSize: 14, fontFamily: 'var(--font-body)',
            }}
          />
          {withDate && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: 'oklch(1 0 0 / 0.06)', border: '1px solid var(--hairline)',
                borderRadius: 8, padding: '4px 8px', color: 'var(--fg-2)', fontSize: 11,
                fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
          )}
          {/* Per-kind extra inputs (e.g. amount for bills, water-every-N
              for plants, monthly-cost for subscriptions, author for
              reading). Profile renders the controls; meta state lives
              here so we can submit it with create. */}
          {profile.addExtras && profile.addExtras({ meta: extraMeta, setMeta: setExtraMeta, hue })}
          <div onClick={() => !busy && add()} className="tap" style={{
            width: 36, height: 36, borderRadius: 10,
            background: text.trim()
              ? `linear-gradient(135deg, oklch(0.78 0.16 ${hue}), oklch(0.55 0.22 ${hue + 60}))`
              : 'oklch(1 0 0 / 0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: busy || !text.trim() ? 0.5 : 1,
            boxShadow: text.trim() ? `0 0 12px oklch(0.78 0.16 ${hue} / 0.4)` : 'none',
          }}>
            <I.plus size={16} stroke={text.trim() ? '#06060a' : 'var(--fg-3)'} sw={2.2} />
          </div>
        </div>
      </div>

      {/* Active list */}
      {active.length === 0 && done.length === 0 && (
        <div className="glass" style={{
          padding: 28, textAlign: 'center', color: 'var(--fg-3)',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0.5,
        }}>
          {emptyHint}
        </div>
      )}

      {active.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map((item) => (
            <Row
              key={item.id}
              item={item}
              hue={hue}
              accent={profile.row?.(item) ?? {}}
              onToggle={() => toggleDone(item)}
              onRemove={() => remove(item)}
              renderMeta={renderMeta}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            DONE · {done.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map((item) => (
              <Row
                key={item.id}
                item={item}
                hue={hue}
                accent={profile.row?.(item) ?? {}}
                onToggle={() => toggleDone(item)}
                onRemove={() => remove(item)}
                renderMeta={renderMeta}
                dim
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TONE_HUE: Record<NonNullable<RowAccent['tone']>, number> = {
  default: 0,
  ok: 145,
  soon: 60,
  urgent: 25,
};

const Row: React.FC<{
  item: Item;
  hue: number;
  accent: RowAccent;
  onToggle: () => void;
  onRemove: () => void;
  renderMeta?: (item: Item) => React.ReactNode;
  dim?: boolean;
}> = ({ item, hue, accent, onToggle, onRemove, renderMeta, dim }) => {
  const checked = item.status === 'done';
  const rowHue = accent.hue ?? hue;
  const tone = accent.tone && accent.tone !== 'default' ? accent.tone : null;
  const InlineIcon = accent.inlineIcon ? I[accent.inlineIcon] : null;
  return (
    <div className="glass fade-up" style={{
      padding: 12, display: 'flex', alignItems: 'center', gap: 12,
      opacity: dim ? 0.55 : 1,
      // Tone tint: urgent rows get a red wash, soon amber, ok green.
      background: tone
        ? `linear-gradient(135deg, oklch(0.78 0.16 ${TONE_HUE[tone]} / 0.10), transparent 70%)`
        : undefined,
      borderColor: tone ? `oklch(0.78 0.16 ${TONE_HUE[tone]} / 0.30)` : undefined,
    }}>
      <div onClick={onToggle} className="tap" style={{
        width: 24, height: 24, borderRadius: 8,
        border: checked ? `1.5px solid oklch(0.78 0.15 150)` : `1.5px solid oklch(0.78 0.16 ${rowHue} / 0.45)`,
        background: checked ? 'oklch(0.78 0.15 150 / 0.2)' : 'oklch(1 0 0 / 0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && <I.check size={14} stroke="oklch(0.85 0.16 150)" sw={2.2} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: 'var(--fg)',
          textDecoration: checked ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {InlineIcon && <InlineIcon size={12} stroke={`oklch(0.85 0.14 ${rowHue})`} />}
          {item.title}
        </div>
        {/* Meta line — kind profile's `sub` wins; legacy renderMeta falls
            through; otherwise body/occurs_at as before. */}
        {(accent.sub || renderMeta?.(item) || item.body || item.occurs_at) && (
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {accent.sub}
            {!accent.sub && renderMeta?.(item)}
            {!accent.sub && !renderMeta?.(item) && item.body && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body}</span>
            )}
            {!accent.sub && item.occurs_at && (
              <span style={{ color: `oklch(0.9 0.14 ${rowHue})` }}>{fmtDate(item.occurs_at)}</span>
            )}
          </div>
        )}
      </div>
      {/* Right side: per-kind badge (e.g. "$50", "5d", "75%") */}
      {accent.badge && (
        <div style={{
          padding: '4px 8px', borderRadius: 8,
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          background: tone === 'urgent' ? 'oklch(0.78 0.18 25 / 0.18)' : tone === 'soon' ? 'oklch(0.85 0.16 60 / 0.18)' : `oklch(0.78 0.16 ${rowHue} / 0.18)`,
          border: `1px solid oklch(0.78 0.16 ${tone === 'urgent' ? 25 : tone === 'soon' ? 60 : rowHue} / 0.35)`,
          color: tone === 'urgent' ? 'oklch(0.92 0.16 25)' : tone === 'soon' ? 'oklch(0.92 0.14 60)' : `oklch(0.92 0.14 ${rowHue})`,
          flexShrink: 0,
        }}>
          {accent.badge}
        </div>
      )}
      <div onClick={onRemove} className="tap" style={{
        width: 28, height: 28, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.5,
      }}>
        <I.close size={14} stroke="var(--fg-3)" />
      </div>
    </div>
  );
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
