/* Nik — confetti celebration burst.
 *
 * Drop-in component that fires N particles outward from a center
 * point, then unmounts itself. Hue-themed so each celebration matches
 * the screen's accent. No external library — pure CSS animation +
 * randomised inline styles.
 *
 * Usage:
 *   const [burst, setBurst] = useState(0);
 *   ...
 *   {burst > 0 && <Confetti key={burst} hue={150} count={28} />}
 *   onClick={() => setBurst(b => b + 1)}
 *
 * Bumping a key remounts so consecutive celebrations animate fresh.
 */

import React from 'react';
import { motion } from 'framer-motion';

type Particle = {
  hue: number;
  angle: number;     // radians
  distance: number;  // px
  duration: number;  // s
  delay: number;     // s
  size: number;      // px
  shape: 'circle' | 'square' | 'star';
  rotate: number;
};

function makeParticles(count: number, baseHue: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    return {
      hue: baseHue + (Math.random() - 0.5) * 60,
      angle,
      distance: 80 + Math.random() * 140,
      duration: 0.9 + Math.random() * 0.7,
      delay: Math.random() * 0.05,
      size: 6 + Math.random() * 8,
      shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
      rotate: Math.random() * 720 - 360,
    };
  });
}

export const Confetti: React.FC<{
  /** Base hue (0-360) — particles vary ±30 around this. */
  hue?: number;
  /** Particle count. Default 24. */
  count?: number;
  /** Optional center override; defaults to viewport center. */
  origin?: { x: number; y: number };
  /** Auto-unmount after this many ms; default 1800. */
  durationMs?: number;
  /** Called when the burst completes — parent can clean up state. */
  onDone?: () => void;
}> = ({ hue = 220, count = 24, origin, durationMs = 1800, onDone }) => {
  const particles = React.useMemo(() => makeParticles(count, hue), [count, hue]);
  React.useEffect(() => {
    const t = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        left: origin?.x ?? '50%',
        top: origin?.y ?? '40%',
        transform: 'translate(-50%, -50%)',
      }}>
        {particles.map((p, i) => {
          const dx = Math.cos(p.angle) * p.distance;
          const dy = Math.sin(p.angle) * p.distance;
          const fillColor = `oklch(0.85 0.20 ${(p.hue + 360) % 360})`;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
              animate={{
                x: dx,
                y: [0, dy * 0.6, dy + 80], // gravity arc
                opacity: [1, 1, 0],
                rotate: p.rotate,
                scale: [0, 1, 0.7],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', left: 0, top: 0,
                width: p.size, height: p.size,
                background: p.shape === 'star' ? 'transparent' : fillColor,
                borderRadius: p.shape === 'circle' ? '50%' : 4,
                boxShadow: `0 0 8px ${fillColor}`,
              }}
            >
              {p.shape === 'star' && (
                <svg width={p.size} height={p.size} viewBox="0 0 16 16" style={{ display: 'block' }}>
                  <path
                    d="M8 0 L9.8 5.5 L16 6 L11 9.5 L13 16 L8 12.5 L3 16 L5 9.5 L0 6 L6.2 5.5 Z"
                    fill={fillColor}
                  />
                </svg>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
