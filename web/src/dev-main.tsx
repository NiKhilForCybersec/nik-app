/* Standalone Dev Console entry point.
 *
 * Mounts only the DevScreen — no app shell, no tab bar, no auth gate.
 * Run from the same Vite dev server at /dev.html so you can keep the
 * full app open in one tab and the inspector in another. Uses the
 * same registry / Supabase client / tool catalog modules — every panel
 * works identically to when you embed /dev inside the app.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles.css';
import { applyTheme, getTheme } from './theme/themes';
import { useAuth } from './lib/auth';
import DevScreen from './screens/DevScreen';
import type { ScreenProps, AppState } from './App';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// Solo-leveling theme so the standalone window looks consistent with
// the app default. The user's persisted theme isn't loaded here on
// purpose — the dev console should read the same regardless of which
// universe the main app is in.
applyTheme('solo-leveling');
const t = getTheme('solo-leveling');
if (t?.mode === 'light') document.documentElement.classList.add('light');

const noop = () => undefined;

function StandaloneDev() {
  // Establish auth so any Supabase reads in DB / Activity / Hardcoded
  // panels work. The dev console is local-only so this is fine.
  const { ready, userId } = useAuth();
  if (!ready) {
    return (
      <div style={{ padding: 40, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
        Connecting…
      </div>
    );
  }
  if (!userId) {
    return (
      <div style={{ padding: 40, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', maxWidth: 480 }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Dev console — not signed in</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          Sign into the app first (open <code>http://localhost:5173/</code> in another tab and use the demo button).
          The dev console reads the same Supabase session.
        </div>
      </div>
    );
  }

  // DevScreen ignores most ScreenProps — pass minimal stubs.
  const props: ScreenProps = {
    dark: true,
    intensity: 'full',
    onNav: noop,
    onVoice: noop,
    state: {} as AppState,
    setState: noop,
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px 0 60px',
      background: 'linear-gradient(180deg, oklch(0.10 0.02 260), oklch(0.14 0.025 260))',
    }}>
      <DevScreen {...props} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StandaloneDev />
    </QueryClientProvider>
  </StrictMode>,
);
