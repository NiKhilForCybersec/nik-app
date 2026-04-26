/* Nik — Money dashboard.
 *
 * Live financial overview built on the generic items contract:
 *   • bill          → upcoming + this-week + monthly autopay
 *   • subscription  → active count + monthly cost
 *   • investment    → total value + recent change
 *   • receipt       → 30-day spend
 *
 * No new tables. Tap any section header to jump to the dedicated
 * screen for full add/edit.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { HUDCorner } from '../components/primitives';
import { useOp } from '../lib/useOp';
import { items as itemsOps } from '../contracts/items';
import type { Item } from '../contracts/items';
import type { ScreenId } from '../types/app-state';

const day = 86_400_000;
const meta = <T = unknown>(item: Item, key: string): T | undefined =>
  (item.meta as Record<string, unknown>)[key] as T | undefined;
const money = (n: number): string =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / day);
};

export default function MoneyScreen({ onNav }: ScreenProps) {
  const { data: bills = [] } = useOp(itemsOps.list, { kind: 'bill' });
  const { data: subscriptions = [] } = useOp(itemsOps.list, { kind: 'subscription' });
  const { data: investments = [] } = useOp(itemsOps.list, { kind: 'investment' });
  const { data: receipts = [] } = useOp(itemsOps.list, { kind: 'receipt' });

  const billsOpen = bills.filter((b) => b.status !== 'done');
  const billsThisWeek = billsOpen.filter((b) => {
    const d = daysUntil(b.occurs_at);
    return d != null && d >= 0 && d <= 7;
  });
  const billsTotalDue = billsOpen.reduce((s, b) => s + (Number(meta(b, 'amount') ?? 0) || 0), 0);
  const billsThisWeekTotal = billsThisWeek.reduce((s, b) => s + (Number(meta(b, 'amount') ?? 0) || 0), 0);

  const subsActive = subscriptions.filter((s) => s.status !== 'done');
  const subsMonthly = subsActive.reduce((s, sub) => s + (Number(meta(sub, 'monthlyAmount') ?? 0) || 0), 0);

  const invTotal = investments.reduce((s, i) => s + (Number(meta(i, 'value') ?? 0) || 0), 0);
  const invChangePct = investments.length
    ? investments.reduce((s, i) => s + (Number(meta(i, 'change_pct') ?? 0) || 0), 0) / investments.length
    : 0;

  const recent30 = receipts.filter((r) => Date.now() - new Date(r.created_at).getTime() <= 30 * day);
  const spend30 = recent30.reduce((s, r) => s + (Number(meta(r, 'amount') ?? 0) || 0), 0);

  // Rough monthly run-rate: subs + 4 weeks of bills.
  const monthlyRunRate = subsMonthly + (billsThisWeekTotal * 4);

  const isEmpty = bills.length === 0 && subscriptions.length === 0 && investments.length === 0 && receipts.length === 0;

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          BILLS · SUBSCRIPTIONS · INVESTMENTS
        </div>
        <div className="display" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
          Money
        </div>
      </div>

      {/* Hero — monthly run-rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass scanlines"
        style={{
          padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.18), oklch(0.55 0.22 calc(var(--hue) + 60) / 0.10) 60%, transparent 100%)',
          borderColor: 'oklch(0.78 0.16 var(--hue) / 0.30)',
        }}
      >
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>
          MONTHLY RUN-RATE · ESTIMATE
        </div>
        <div className="display" style={{
          fontSize: 48, fontWeight: 600, marginTop: 6, lineHeight: 1,
          background: 'linear-gradient(135deg, oklch(0.94 0.16 var(--hue)), oklch(0.7 0.22 calc(var(--hue) + 30)))',
          WebkitBackgroundClip: 'text', color: 'transparent',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {money(monthlyRunRate)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
          {money(subsMonthly)} SUBS · {money(billsThisWeekTotal)} THIS WEEK BILLS
        </div>
      </motion.div>

      {/* 4-up stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        <StatTile
          label="BILLS OPEN" value={String(billsOpen.length)}
          sub={billsTotalDue > 0 ? `${money(billsTotalDue)} due` : 'all clear'}
          hue={0} icon="flame"
          tone={billsThisWeek.length > 0 ? 'urgent' : 'default'}
          onTap={() => onNav('bills' as ScreenId)}
        />
        <StatTile
          label="SUBSCRIPTIONS" value={String(subsActive.length)}
          sub={subsMonthly > 0 ? `${money(subsMonthly)}/mo` : 'none active'}
          hue={240} icon="grid"
          onTap={() => onNav('subscriptions' as ScreenId)}
        />
        <StatTile
          label="INVESTMENTS" value={invTotal > 0 ? money(invTotal) : '—'}
          sub={invChangePct !== 0 ? `${invChangePct >= 0 ? '+' : ''}${invChangePct.toFixed(2)}% avg` : `${investments.length} holdings`}
          hue={140} icon="sparkle"
          tone={invChangePct < 0 ? 'urgent' : 'ok'}
          onTap={() => onNav('investments' as ScreenId)}
        />
        <StatTile
          label="30-DAY SPEND" value={spend30 > 0 ? money(spend30) : '—'}
          sub={`${recent30.length} receipt${recent30.length === 1 ? '' : 's'}`}
          hue={60} icon="book"
          onTap={() => onNav('receipts' as ScreenId)}
        />
      </div>

      {billsThisWeek.length > 0 && (
        <Section title="DUE THIS WEEK" onSeeAll={() => onNav('bills' as ScreenId)}>
          {billsThisWeek.slice(0, 3).map((b) => {
            const days = daysUntil(b.occurs_at);
            const amt = meta<number>(b, 'amount');
            const autopay = meta<boolean>(b, 'autopay');
            const urgent = days != null && days <= 1;
            return (
              <Row
                key={b.id}
                title={b.title}
                sub={
                  <>
                    {days != null && (
                      <span style={{ color: urgent ? 'oklch(0.85 0.18 25)' : 'var(--fg-3)' }}>
                        {days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`}
                      </span>
                    )}
                    {autopay && <span style={{ color: 'oklch(0.78 0.15 150)' }}> · autopay</span>}
                  </>
                }
                badge={amt != null ? money(amt) : undefined}
                hue={urgent ? 25 : 0}
              />
            );
          })}
        </Section>
      )}

      {subsActive.length > 0 && (
        <Section title={`SUBSCRIPTIONS · ${money(subsMonthly)}/MO`} onSeeAll={() => onNav('subscriptions' as ScreenId)}>
          {subsActive.slice(0, 4).map((s) => {
            const amt = meta<number>(s, 'monthlyAmount');
            return (
              <Row
                key={s.id}
                title={s.title}
                badge={amt != null ? `${money(amt)}/mo` : undefined}
                hue={240}
              />
            );
          })}
        </Section>
      )}

      {recent30.length > 0 && (
        <Section title={`RECENT · ${money(spend30)}`} onSeeAll={() => onNav('receipts' as ScreenId)}>
          {recent30.slice(0, 4).map((r) => {
            const amt = meta<number>(r, 'amount');
            const merchant = meta<string>(r, 'merchant');
            return (
              <Row
                key={r.id}
                title={r.title}
                sub={merchant ? <span>{merchant}</span> : undefined}
                badge={amt != null ? money(amt) : undefined}
                hue={60}
              />
            );
          })}
        </Section>
      )}

      {investments.length > 0 && (
        <Section title={`HOLDINGS · ${money(invTotal)}`} onSeeAll={() => onNav('investments' as ScreenId)}>
          {investments.slice(0, 4).map((inv) => {
            const value = meta<number>(inv, 'value');
            const change = meta<number>(inv, 'change_pct');
            return (
              <Row
                key={inv.id}
                title={inv.title}
                sub={change != null ? (
                  <span style={{ color: change >= 0 ? 'oklch(0.78 0.15 150)' : 'oklch(0.78 0.18 25)' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </span>
                ) : undefined}
                badge={value != null ? money(value) : undefined}
                hue={140}
              />
            );
          })}
        </Section>
      )}

      {isEmpty && (
        <div className="glass" style={{ padding: 28, textAlign: 'center', marginTop: 8 }}>
          <I.sparkle size={28} stroke="oklch(0.85 0.16 var(--hue))" />
          <div className="display" style={{ fontSize: 18, fontWeight: 500, marginTop: 10, color: 'var(--fg-1)' }}>
            Nothing tracked yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.5 }}>
            Add a bill, subscription, or holding from the buttons below — or just tell Nik:
          </div>
          <div style={{ fontSize: 11, color: 'oklch(0.85 0.16 var(--hue))', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            "track my Netflix subscription · $16/mo"
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {([
              { label: 'Add a bill', screen: 'bills' as ScreenId, hue: 0 },
              { label: 'Subscription', screen: 'subscriptions' as ScreenId, hue: 240 },
              { label: 'Holding', screen: 'investments' as ScreenId, hue: 140 },
              { label: 'Receipt', screen: 'receipts' as ScreenId, hue: 60 },
            ] as const).map((q) => (
              <button
                key={q.screen}
                onClick={() => onNav(q.screen)}
                className="tap"
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                  background: `oklch(0.78 0.16 ${q.hue} / 0.18)`,
                  border: `1px solid oklch(0.78 0.16 ${q.hue} / 0.4)`,
                  color: `oklch(0.92 0.14 ${q.hue})`,
                  cursor: 'pointer',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────

const StatTile: React.FC<{
  label: string; value: string; sub: string;
  hue: number; icon: keyof typeof I;
  tone?: 'default' | 'urgent' | 'ok';
  onTap: () => void;
}> = ({ label, value, sub, hue, icon, tone = 'default', onTap }) => {
  const Ic = I[icon] ?? I.sparkle;
  const accentHue = tone === 'urgent' ? 25 : tone === 'ok' ? 145 : hue;
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="glass tap"
      style={{
        padding: 14, position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${accentHue} / 0.10), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${accentHue} / 0.25)`,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Ic size={14} stroke={`oklch(0.92 0.14 ${accentHue})`} />
        <span style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
          {label}
        </span>
      </div>
      <div className="display" style={{
        fontSize: 26, fontWeight: 600, marginTop: 4, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        color: `oklch(0.94 0.14 ${accentHue})`,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
        {sub}
      </div>
    </motion.button>
  );
};

// ── Section ──────────────────────────────────────────────────

const Section: React.FC<{ title: string; onSeeAll: () => void; children: React.ReactNode }> = ({
  title, onSeeAll, children,
}) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
        {title}
      </div>
      <button
        onClick={onSeeAll}
        className="tap"
        style={{
          fontSize: 10, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        SEE ALL →
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  </div>
);

// ── Row ──────────────────────────────────────────────────────

const Row: React.FC<{ title: string; sub?: React.ReactNode; badge?: string; hue: number }> = ({
  title, sub, badge, hue,
}) => (
  <div className="glass" style={{
    padding: 10, display: 'flex', alignItems: 'center', gap: 10,
    background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.05), transparent 70%)`,
    borderColor: `oklch(0.78 0.16 ${hue} / 0.16)`,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 13, fontWeight: 500, color: 'var(--fg)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, display: 'flex', gap: 4 }}>
          {sub}
        </div>
      )}
    </div>
    {badge && (
      <div style={{
        padding: '4px 8px', borderRadius: 8,
        fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
        background: `oklch(0.78 0.16 ${hue} / 0.18)`,
        border: `1px solid oklch(0.78 0.16 ${hue} / 0.3)`,
        color: `oklch(0.92 0.14 ${hue})`,
        flexShrink: 0,
      }}>
        {badge}
      </div>
    )}
  </div>
);
