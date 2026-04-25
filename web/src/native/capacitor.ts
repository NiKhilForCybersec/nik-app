/* Capacitor wrappers — graceful no-ops when running in a browser. */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { Geolocation, type Position } from '@capacitor/geolocation';

export const isNative = Capacitor.isNativePlatform();

/* ── Status bar ─────────────────────────────────────────── */
export const setStatusBar = async (mode: 'dark' | 'light') => {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: mode === 'light' ? Style.Dark : Style.Light });
    // ^ counter-intuitive: Style.Dark = dark TEXT (used over a light bg)
  } catch (_e) {
    /* status-bar plugin may not be linked in dev — ignore */
  }
};

/* ── Preferences (key-value persistence) ────────────────── */
export const prefs = {
  get: async <T,>(key: string, fallback: T): Promise<T> => {
    try {
      const { value } = await Preferences.get({ key });
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: async (key: string, value: unknown) => {
    try {
      await Preferences.set({ key, value: JSON.stringify(value) });
    } catch {
      /* ignore */
    }
  },
  remove: async (key: string) => {
    try {
      await Preferences.remove({ key });
    } catch {
      /* ignore */
    }
  },
};

/* ── Geolocation ────────────────────────────────────────── */
export const getLocation = async (): Promise<Position | null> => {
  if (!isNative) return null;
  try {
    const perm = await Geolocation.requestPermissions();
    if (perm.location !== 'granted') return null;
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 5000,
    });
    return pos;
  } catch {
    return null;
  }
};
