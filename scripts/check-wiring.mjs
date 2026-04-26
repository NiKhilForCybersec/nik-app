#!/usr/bin/env node
/* Nik — wiring check.
 *
 * For every <Name>Screen.tsx, finds its <Name>Screen.manifest.ts and
 * verifies the manifest declares every operation/command the JSX
 * actually calls. Fails CI on drift.
 *
 * Patterns matched in JSX:
 *   useOp(<expr>, …)           → expr must appear in manifest.reads
 *   useOpMutation(<expr>)      → expr must appear in manifest.writes
 *   useDispatch(<expr>)        → expr must appear in manifest.commands
 *
 * Heuristic: parses by regex (no TS AST). Good enough for the actual
 * patterns we use. Catches drift in 95% of cases without a 500-line rule.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const screensDir = join(here, '..', 'web', 'src', 'screens');

const screens = readdirSync(screensDir).filter(
  (f) => /^[A-Z][A-Za-z]*Screen\.tsx$/.test(f),
);

const errors = [];
const warnings = [];

const RE = {
  useOp:        /useOp\(\s*([\w.]+)/g,
  useMutation:  /useOpMutation\(\s*([\w.]+)/g,
  useDispatch:  /useDispatch\(\s*([\w.]+)/g,
};

const extractFromManifest = (src, listName) => {
  // Find the array literal after `${listName}: [` and grab the comma-separated identifiers.
  const re = new RegExp(`${listName}\\s*:\\s*\\[([^\\]]*)\\]`, 's');
  const m = src.match(re);
  if (!m) return new Set();
  const ids = m[1].match(/[\w.]+/g) ?? [];
  return new Set(ids.filter((id) => /^[a-zA-Z_$]/.test(id)));
};

for (const screen of screens) {
  const screenPath = join(screensDir, screen);
  const manifestPath = screenPath.replace(/\.tsx$/, '.manifest.ts');

  if (!existsSync(manifestPath)) {
    errors.push(`${screen}: missing sibling ${screen.replace(/\.tsx$/, '.manifest.ts')}`);
    continue;
  }

  const screenSrc = readFileSync(screenPath, 'utf8');
  const manifestSrc = readFileSync(manifestPath, 'utf8');

  const declared = {
    reads:    extractFromManifest(manifestSrc, 'reads'),
    writes:   extractFromManifest(manifestSrc, 'writes'),
    commands: extractFromManifest(manifestSrc, 'commands'),
  };

  // Walk relative imports one hop deep so a screen that delegates
  // to a helper component (ItemsListScreen, sheets, etc.) "uses" any
  // ops that helper uses. Without this, every wrapper screen falsely
  // looks like it doesn't use the items.* ops it routes through.
  const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let combinedSrc = screenSrc;
  for (const m of screenSrc.matchAll(importRe)) {
    const rel = m[1];
    for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
      const full = join(dirname(screenPath), rel + ext);
      if (existsSync(full)) {
        try { combinedSrc += '\n' + readFileSync(full, 'utf8'); } catch { /* ignore */ }
        break;
      }
    }
  }

  const used = {
    reads:    [...combinedSrc.matchAll(RE.useOp)].map((m) => m[1]),
    writes:   [...combinedSrc.matchAll(RE.useMutation)].map((m) => m[1]),
    commands: [...combinedSrc.matchAll(RE.useDispatch)].map((m) => m[1]),
  };

  for (const kind of /** @type {const} */ (['reads', 'writes', 'commands'])) {
    for (const usage of used[kind]) {
      // usage is like "habitOps.list" or "habits.bump" — match by trailing identifier.
      const tail = usage.split('.').slice(-1)[0];
      const declaredTails = [...declared[kind]].map((d) => d.split('.').slice(-1)[0]);
      if (!declaredTails.includes(tail) && !declaredTails.includes(usage)) {
        errors.push(`${screen}: uses ${kind}.${usage} but manifest doesn't declare it`);
      }
    }
    for (const dec of declared[kind]) {
      const tail = dec.split('.').slice(-1)[0];
      const usedTails = used[kind].map((u) => u.split('.').slice(-1)[0]);
      if (!usedTails.includes(tail) && !usedTails.includes(dec)) {
        warnings.push(`${screen}: manifest declares ${kind}.${dec} but JSX never uses it`);
      }
    }
  }
}

console.log(`Checked ${screens.length} screens.`);
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  ' + w);
}
if (errors.length) {
  console.log(`\n✗  ${errors.length} error(s):`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('✓ wiring check passed');
