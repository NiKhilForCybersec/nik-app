/* Nik — Auth (sign in / sign up).
 *
 * Email + password for now (test/test enough in dev). OAuth buttons
 * exist but are disabled — Google/Apple/SAML wiring lands later.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { I } from '../components/icons';
import { HUDCorner, VoiceOrb } from '../components/primitives';
import { signInWithPassword, signInAsDemo, DEMO_EMAIL, DEMO_PASSWORD } from '../lib/auth';

export default function AuthScreen() {
  const [email, setEmail] = React.useState(DEMO_EMAIL);
  const [password, setPassword] = React.useState(DEMO_PASSWORD);
  const [busy, setBusy] = React.useState<'demo' | 'manual' | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const submit = async (mode: 'demo' | 'manual') => {
    setErr(null);
    setBusy(mode);
    try {
      if (mode === 'demo') await signInAsDemo();
      else await signInWithPassword(email.trim(), password);
    } catch (e) {
      setErr((e as Error).message || 'Sign-in failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      padding: '40px 20px 60px',
      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    }}>
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}
      >
        <VoiceOrb size={72} />
        <div className="display" style={{ fontSize: 36, fontWeight: 500, marginTop: 18, letterSpacing: -0.5 }}>
          Nik
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>
          Your AI life assistant
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="glass scanlines"
        style={{ padding: 22, position: 'relative', overflow: 'hidden', marginBottom: 14 }}
      >
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>

        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 16 }}>
          SIGN IN · OR CREATE
        </div>

        <Field label="Email" type="email" value={email} onChange={setEmail} icon="user" />
        <Field label="Password" type="password" value={password} onChange={setPassword} icon="shield" />

        {err && (
          <div style={{
            padding: '10px 12px', borderRadius: 10, marginTop: 4, marginBottom: 12,
            background: 'oklch(0.55 0.22 25 / 0.12)', border: '1px solid oklch(0.55 0.22 25 / 0.4)',
            fontSize: 12, color: 'oklch(0.85 0.16 25)',
          }}>{err}</div>
        )}

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => !busy && submit('manual')}
          className="tap"
          style={{
            padding: '13px 14px', borderRadius: 12, marginTop: 10,
            background: busy === 'manual'
              ? 'oklch(0.78 0.16 var(--hue) / 0.5)'
              : 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
            color: '#06060a', fontSize: 14, fontWeight: 600, textAlign: 'center',
            boxShadow: '0 0 18px oklch(0.78 0.16 var(--hue) / 0.45)',
            opacity: busy && busy !== 'manual' ? 0.4 : 1,
            pointerEvents: busy ? 'none' : 'auto',
          }}
        >
          {busy === 'manual' ? 'Signing in…' : 'Sign in'}
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }}/>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>OR</div>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }}/>
        </div>

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => !busy && submit('demo')}
          className="tap"
          style={{
            padding: '13px 14px', borderRadius: 12,
            background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline-strong)',
            color: 'var(--fg)', fontSize: 13, fontWeight: 500, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: busy && busy !== 'demo' ? 0.4 : 1,
            pointerEvents: busy ? 'none' : 'auto',
          }}
        >
          <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))" />
          {busy === 'demo' ? 'Signing in…' : 'Continue as demo user'}
        </motion.div>
      </motion.div>

      {/* OAuth (placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}
      >
        {[
          { label: 'Continue with Google', hue: 220 },
          { label: 'Continue with Apple',  hue: 0 },
          { label: 'Single sign-on (SAML)', hue: 280 },
        ].map(o => (
          <div key={o.label} className="glass" style={{
            padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: 0.55, cursor: 'not-allowed',
          }}>
            <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{o.label}</span>
            <span style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, padding: '2px 6px', border: '1px solid var(--hairline)', borderRadius: 4 }}>
              SOON
            </span>
          </div>
        ))}
      </motion.div>

      <div style={{ fontSize: 10, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.6 }}>
        By continuing you agree to Nik's{' '}
        <span style={{ color: 'var(--fg-2)', textDecoration: 'underline' }}>terms</span>{' '}
        and{' '}
        <span style={{ color: 'var(--fg-2)', textDecoration: 'underline' }}>privacy policy</span>.
      </div>
    </div>
  );
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'email' | 'password' | 'text';
  icon?: keyof typeof I;
}> = ({ label, value, onChange, type = 'text', icon }) => {
  const Ic = icon ? I[icon] : null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        background: 'oklch(1 0 0 / 0.03)',
        border: '1px solid var(--hairline-strong)',
      }}>
        {Ic && <Ic size={14} stroke="var(--fg-3)" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--fg)', fontSize: 14, fontFamily: 'var(--font-body, Inter)',
          }}
        />
      </div>
    </div>
  );
};
