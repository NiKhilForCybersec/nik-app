import type { ScreenProps } from '../App';

export const makePlaceholder = (name: string) =>
  function PlaceholderScreen(_p: ScreenProps) {
    return (
      <div style={{ padding: 24, color: 'var(--fg)' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--fg-3)', marginBottom: 8 }}>
          NIK · {name.toUpperCase()}
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, marginBottom: 12 }}>
          {name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5 }}>
          This screen is being ported from the prototype.
        </div>
      </div>
    );
  };
