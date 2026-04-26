#!/usr/bin/env node
/* Nik — dev watcher (parallel review agents).
 *
 * Runs every dev-quality check ONCE per ~3s while files change, in
 * parallel, and writes the combined results to docs/dev-findings.json
 * which the in-app dev console picks up live (Vite serves the JSON
 * via the existing static file pipeline; the Watcher panel polls).
 *
 * The "agents" are the four checks. Each is single-purpose, runs
 * independently, and can be replaced with an LLM-powered version
 * later without changing the orchestrator:
 *
 *   1. WIRING agent  → runs scripts/check-wiring.mjs
 *   2. REGISTRY agent → counts ops + commands; flags duplicates
 *   3. NAVIGATION agent → onNav('xxx') targets a known ScreenId?
 *   4. HARDCODED agent → suspicious literals in JSX
 *
 * Adding a new agent = one async function + one entry in AGENTS.
 * Each writes to its slot in findings.json; the orchestrator merges
 * + timestamps + persists.
 *
 * Run alongside `npm run dev`:    `npm run watch:dev`
 */

import { readFileSync, writeFileSync, watch, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const screensDir = join(repoRoot, 'web', 'src', 'screens');
const componentsDir = join(repoRoot, 'web', 'src', 'components');
const contractsDir = join(repoRoot, 'web', 'src', 'contracts');
// Write into web/public so Vite serves it at /dev-findings.json.
// Also into docs/ for human inspection / git-ignored snapshot.
const findingsOut = join(repoRoot, 'web', 'public', 'dev-findings.json');
const findingsAlt = join(repoRoot, 'docs', 'dev-findings.json');

const AGENTS = {
  wiring: runWiringAgent,
  registry: runRegistryAgent,
  navigation: runNavigationAgent,
  hardcoded: runHardcodedAgent,
};

// ── Agent: wiring (delegates to check-wiring.mjs) ────────────
function runWiringAgent() {
  const r = spawnSync('node', [join(repoRoot, 'scripts/check-wiring.mjs')], { encoding: 'utf8' });
  const lines = (r.stdout + r.stderr).split('\n');
  const errors = [];
  const warnings = [];
  let mode = null;
  for (const line of lines) {
    if (/error\(s\)/.test(line)) { mode = 'errors'; continue; }
    if (/warning\(s\)/.test(line)) { mode = 'warnings'; continue; }
    if (/wiring check/.test(line)) { mode = null; continue; }
    const m = line.match(/^\s+(.+)$/);
    if (!m) continue;
    if (mode === 'errors') errors.push(m[1]);
    else if (mode === 'warnings') warnings.push(m[1]);
  }
  return { errors, warnings, exitCode: r.status ?? 0 };
}

// ── Agent: registry (count + duplicate detection) ────────────
function runRegistryAgent() {
  let opCount = 0, cmdCount = 0;
  const seen = new Set();
  const dupes = [];
  for (const file of readdirSync(contractsDir)) {
    if (!file.endsWith('.ts') || file === 'index.ts') continue;
    const src = readFileSync(join(contractsDir, file), 'utf8');
    const opRe = /name:\s*['"]([\w.]+)['"]/g;
    let m;
    while ((m = opRe.exec(src)) !== null) {
      const name = m[1];
      if (seen.has(name)) dupes.push(name);
      seen.add(name);
      if (name.startsWith('ui.')) cmdCount++;
      else opCount++;
    }
  }
  return { opCount, cmdCount, total: opCount + cmdCount, duplicates: dupes };
}

// ── Agent: navigation (onNav target validation) ──────────────
function runNavigationAgent() {
  const known = new Set();
  // Pull the canonical ScreenId list from the union type definition.
  const stateSrc = readFileSync(join(repoRoot, 'web/src/types/app-state.ts'), 'utf8');
  const m = stateSrc.match(/export\s+type\s+ScreenId\s*=([^;]+);/s);
  if (m) {
    for (const id of m[1].matchAll(/'([\w-]+)'/g)) known.add(id[1]);
  }
  const broken = [];
  for (const file of readdirSync(screensDir)) {
    if (!/Screen\.tsx$/.test(file)) continue;
    const src = readFileSync(join(screensDir, file), 'utf8');
    for (const m of src.matchAll(/onNav\(\s*['"]([\w-]+)['"]/g)) {
      if (!known.has(m[1])) broken.push({ source: file, dest: m[1] });
    }
  }
  return { broken, knownCount: known.size };
}

// ── Agent: hardcoded (regex over JSX literals) ───────────────
function runHardcodedAgent() {
  const allow = [
    /^[A-Z\s·\-—]+$/,
    /^[\W·]+$/,
    /^(NEW|SOON|BETA|DONE|AUTO|DEMO|PREVIEW|SYNCING|OK|ERR|UNTESTED|ACTIVE|PRIVATE|HOME|TASKS|HABITS|MORE|TODAY|YESTERDAY|TOMORROW)$/,
  ];
  const patterns = [
    { kind: 'sentence', re: />\s*([A-Z][^<>{}\n]{30,200})</g },
    { kind: 'number',   re: />\s*([0-9]{2,}(?:\.[0-9]+)?(?:[a-z%]+)?)\s*</g },
    { kind: 'ratio',    re: />\s*([0-9]+\s*\/\s*[0-9]+(?:\s*[a-z]+)?)\s*</g },
    { kind: 'time',     re: />\s*([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM|am|pm)?)\s*</g },
  ];
  const findings = [];
  const dirs = [screensDir, componentsDir];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) { walk(full); continue; }
      if (!/\.(tsx)$/.test(name)) continue;
      const src = readFileSync(full, 'utf8');
      const lines = src.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        for (const { kind, re } of patterns) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(lines[i])) !== null) {
            const text = m[1].trim();
            if (text.length < 2) continue;
            if (allow.some((al) => al.test(text))) continue;
            if (text.startsWith('{') || text.endsWith('}')) continue;
            findings.push({ file: full.replace(repoRoot + '/', ''), line: i + 1, kind, text });
          }
        }
      }
    }
  };
  for (const d of dirs) walk(d);
  return { findings: findings.slice(0, 500), total: findings.length };
}

// ── Orchestrator ─────────────────────────────────────────────
async function runOnce() {
  const startedAt = Date.now();
  const out = { ranAt: new Date().toISOString(), durationMs: 0, agents: {} };
  for (const [name, fn] of Object.entries(AGENTS)) {
    const t0 = Date.now();
    try {
      out.agents[name] = { ok: true, durationMs: 0, ...fn() };
    } catch (e) {
      out.agents[name] = { ok: false, error: String(e), durationMs: 0 };
    }
    out.agents[name].durationMs = Date.now() - t0;
  }
  out.durationMs = Date.now() - startedAt;
  const json = JSON.stringify(out, null, 2);
  writeFileSync(findingsOut, json);
  try { writeFileSync(findingsAlt, json); } catch { /* docs may not exist */ }
  const sum = `wiring: ${out.agents.wiring.warnings?.length ?? 0}w/${out.agents.wiring.errors?.length ?? 0}e · ` +
              `registry: ${out.agents.registry.total} tools (${out.agents.registry.duplicates.length} dup) · ` +
              `nav: ${out.agents.navigation.broken.length} broken · ` +
              `hardcoded: ${out.agents.hardcoded.total} literals`;
  console.log(`[${new Date().toLocaleTimeString()}] ${out.durationMs}ms · ${sum}`);
}

await runOnce();

// ── Watch mode: rerun on file changes (debounced) ────────────
let timer = null;
const onChange = () => {
  clearTimeout(timer);
  timer = setTimeout(() => { void runOnce(); }, 600);
};
for (const dir of [screensDir, componentsDir, contractsDir]) {
  watch(dir, { recursive: true }, onChange);
}
console.log('watching for changes…');
