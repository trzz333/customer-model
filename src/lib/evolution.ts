// ════════════════════════════════════════════════════════════════════
//  Customer Model — evolution layer (2.3.0 CHALLENGER, not promoted)
//
//  Wraps the FROZEN 2.2.0 runSimulation without modifying it. One
//  "generation" advances an archetype-population; fitness is realized
//  retention read from the real engine. The tool can then answer which
//  customer types a sustained policy selects FOR and which it crowds OUT,
//  and what the base settles into.
//
//  Stochastic in mechanism, deterministic in output: every random draw is
//  keyed by identity (runSeed, rep, step, channel) via a CRN substream,
//  never by global draw order, so the whole ensemble regenerates bit for
//  bit from runSeed. See docs/design-note-evolution.md.
//
//  Prior art (verified 2026-06-30): Axelrod ecological model; Traulsen,
//  Pacheco and Nowak 2007 (Fermi pairwise comparison, selection temp beta);
//  Fudenberg and Imhof 2006 (small-mutation stationary distribution over
//  monomorphic states); Hindersin et al. 2019 (fixation numerics);
//  L'Ecuyer RngStream / Starsim 2024 (common random numbers).
// ════════════════════════════════════════════════════════════════════
import { runSimulation, ARCHETYPES, type StratKey, type SimConfig } from "./sim";

const KEYS: StratKey[] = ARCHETYPES.map((a) => a.key);
const NK = KEYS.length;

// ── CRN substream: identity-keyed, order-independent ─────────────────
// FNV-1a over the tag tuple mixed with runSeed, into a mulberry32 stream.
// Two calls with the same tags anywhere in the program get the same stream,
// so reordering processing cannot change any outcome (the order-dependence fix).
export function subSeed(runSeed: number, ...tags: Array<number | string>): number {
  let h = (2166136261 ^ (runSeed >>> 0)) >>> 0;
  const s = tags.join(":");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function subRng(runSeed: number, ...tags: Array<number | string>): () => number {
  return mulberry32(subSeed(runSeed, ...tags));
}

// ── Config + result ──────────────────────────────────────────────────
export type EvoRule = "replicator" | "moran";
export interface EvoConfig {
  base: SimConfig;        // market episode; its mix is overwritten to measure M
  rule: EvoRule;
  runSeed: number;        // pins the entire ensemble
  generations: number;    // Moran micro-steps (moran) or replicator iterations
  slots: number;          // finite archetype-population N (moran)
  beta: number;           // Fermi selection intensity (0 = drift, large = deterministic)
  mutation: number;       // per-step mutation probability mu (moran)
  replicates: number;     // ensemble size (moran)
  probeFreq: number;      // rare-type frequency used to measure the payoff matrix
  fitnessPop: number;     // population per fitness episode
  fitnessSeed: number;    // fixed seed so fitness(mix) is a pure function
}
export const EVO_DEFAULTS: Omit<EvoConfig, "base" | "rule" | "runSeed"> = {
  generations: 240000, slots: 60, beta: 6, mutation: 0.02, replicates: 24,
  probeFreq: 0.12, fitnessPop: 400, fitnessSeed: 991,
};
export interface EvoResult {
  rule: EvoRule;
  keys: StratKey[];
  matrix: number[][];              // measured retention payoff M[i][j]
  settledMean: number[];           // mean final share per archetype
  settledBand: Array<{ lo: number; hi: number }>;
  fixation: number[];              // freq each type is the plurality at the end (moran)
  analytic: number[] | null;       // small-mutation stationary distribution (moran)
  verdict: string;
  warnings: string[];
  engineTag: string;               // challenger stamp, distinct from champion ENGINE_VERSION
}
export const EVOLUTION_ENGINE_TAG = "2.3.0-evo.challenger";

// ── Measured payoff matrix: retention from the FULL engine ───────────
// M[i][j] = retention of a type-i customer when i sits at probeFreq in an
// otherwise type-j base, from the frozen 2.2.0 engine at a fixed seed, so M is
// a pure deterministic function of the base config. M[i][i] is all-i retention.
// This is the one place the real engine enters; the rest is EGT arithmetic on M.
export function measureMatrix(cfg: EvoConfig): number[][] {
  const M: number[][] = KEYS.map(() => new Array(NK).fill(0));
  for (let i = 0; i < NK; i++) {
    for (let j = 0; j < NK; j++) {
      const mix = {} as Record<StratKey, number>;
      KEYS.forEach((k) => (mix[k] = 0));
      if (i === j) mix[KEYS[i]] = 1;
      else { mix[KEYS[i]] = cfg.probeFreq; mix[KEYS[j]] = 1 - cfg.probeFreq; }
      const r = runSimulation({ ...cfg.base, mix, population: cfg.fitnessPop, seed: cfg.fitnessSeed });
      const a = r.perArch[KEYS[i]];
      M[i][j] = a.start > 0 ? a.survived / a.start : 0;
    }
  }
  return M;
}
// Mean-field frequency-dependent fitness of type i given share vector x.
function fitness(M: number[][], x: number[], i: number): number {
  let f = 0;
  for (let j = 0; j < NK; j++) f += M[i][j] * x[j];
  return f;
}

// ── Deterministic replicator (Axelrod ecological model) ──────────────
function replicator(M: number[][], gens: number): number[] {
  let x = new Array(NK).fill(1 / NK);
  for (let g = 0; g < gens; g++) {
    const w = x.map((xi: number, i: number) => xi * Math.max(1e-12, fitness(M, x, i)));
    const z = w.reduce((s: number, v: number) => s + v, 0) || 1;
    x = w.map((v: number) => v / z);
  }
  return x;
}

// ── Stochastic Moran-adjacent replicate (Fermi update + mutation) ────
// Finite population of `slots` archetype-slots. Each step: a learner slot copies
// a role-model slot with the Fermi probability of their fitness gap, or mutates.
// Every draw comes from an identity-keyed CRN substream (runSeed, rep, step,
// channel), so replicate r's trajectory depends only on (runSeed, r), never on
// when it is computed. Exported so the sweep can prove order-independence.
export function replicateFinal(M: number[][], cfg: EvoConfig, rep: number): number[] {
  const counts = new Array(NK).fill(0);
  const slot: number[] = [];
  for (let s = 0; s < cfg.slots; s++) { const t = s % NK; counts[t]++; slot.push(t); }
  const u = (step: number, ch: string) => subRng(cfg.runSeed, "rep", rep, step, ch)();
  for (let step = 0; step < cfg.generations; step++) {
    const x = counts.map((c: number) => c / cfg.slots);
    const a = Math.floor(u(step, "a") * cfg.slots);
    const i = slot[a];
    if (u(step, "mut") < cfg.mutation) {
      const nt = Math.floor(u(step, "mt") * NK);
      counts[i]--; counts[nt]++; slot[a] = nt;
      continue;
    }
    const b = Math.floor(u(step, "b") * cfg.slots);
    const j = slot[b];
    if (i === j) continue;
    const p = 1 / (1 + Math.exp(-cfg.beta * (fitness(M, x, j) - fitness(M, x, i))));
    if (u(step, "ad") < p) { counts[i]--; counts[j]++; slot[a] = j; }
  }
  return counts.map((c: number) => c / cfg.slots);
}

// ── Analytic small-mutation stationary distribution (Fudenberg-Imhof) ─
// Closed-form Fermi fixation probability of one j-mutant in an all-i population,
// then the stationary distribution of the embedded Markov chain over the NK
// monomorphic states with rate(i->j) proportional to rho_ij. The long-run answer
// with no simulation loop, and the check on the load-bearing formula (gate G4).
export function fixation(M: number[][], N: number, beta: number, i: number, j: number): number {
  let sum = 0, prod = 1;
  for (let m = 1; m <= N - 1; m++) {
    const xj = m, xi = N - m;
    const fj = (M[j][j] * (xj - 1) + M[j][i] * xi) / (N - 1);
    const fi = (M[i][j] * xj + M[i][i] * (xi - 1)) / (N - 1);
    const gamma = Math.exp(-beta * (fj - fi));   // T-/T+ for the Fermi process
    prod *= gamma;
    sum += prod;
  }
  return 1 / (1 + sum);
}
function analyticStationary(M: number[][], N: number, beta: number): number[] {
  const P: number[][] = KEYS.map(() => new Array(NK).fill(0));
  for (let i = 0; i < NK; i++) {
    let off = 0;
    for (let j = 0; j < NK; j++) if (j !== i) {
      P[i][j] = fixation(M, N, beta, i, j) / (NK - 1);
      off += P[i][j];
    }
    P[i][i] = 1 - off;
  }
  let pi = new Array(NK).fill(1 / NK);
  for (let it = 0; it < 4000; it++) {
    const next = new Array(NK).fill(0);
    for (let j = 0; j < NK; j++)
      for (let i = 0; i < NK; i++) next[j] += pi[i] * P[i][j];
    const z = next.reduce((s: number, v: number) => s + v, 0) || 1;
    pi = next.map((v: number) => v / z);
  }
  return pi;
}

// ── Settled-composition verdict + fragility warning (save invariant) ──
function summarize(share: number[]): { verdict: string; warnings: string[] } {
  const ranked = KEYS.map((k, i) => ({ k, name: ARCHETYPES[i].name, s: share[i] }))
    .sort((a, b) => b.s - a.s);
  const top = ranked[0];
  const even = 1 / NK;
  const grown = ranked.filter((r) => r.s > even + 0.02).map((r) => r.name);
  const gone = ranked.filter((r) => r.s < even - 0.02).map((r) => r.name);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const parts: string[] = [];
  parts.push(`Under this policy the customer base is selected, not fixed: it settles toward the ${top.name} (about ${pct(top.s)} of the base).`);
  if (grown.length) parts.push(`Types this business retains, and so grows as a share: ${grown.join(", ")}.`);
  if (gone.length) parts.push(`Types it loses, and so crowds out: ${gone.join(", ")}.`);
  const warnings: string[] = [];
  const fragile = new Set<StratKey>(["inertial", "grudger"]);
  if (top.s > 0.55) {
    warnings.push(`The base concentrates into one type (${top.name}, ${pct(top.s)}). A one-type base is fragile: a single bad round hits all of it at once.`);
    if (fragile.has(top.k)) {
      warnings.push(top.k === "inertial"
        ? `That type is the Inertial Loyalist, which absorbs harm quietly then leaves in a single wave, so high retention here can mask a cliff.`
        : `That type is the One-Strike Grudger, which churns permanently on the first real defect, so a concentrated grudger base has no margin for error.`);
    }
  }
  return { verdict: parts.join(" "), warnings };
}

// ── Orchestrator ──────────────────────────────────────────────────────
// Measure M once from the frozen engine, then run the chosen dynamics. moran
// aggregates replicate finals indexed by rep, so aggregation is order-independent
// (gate G3). Output is a pure function of (cfg, runSeed): fully regenerable.
export function runEvolution(cfg: EvoConfig): EvoResult {
  const M = measureMatrix(cfg);
  if (cfg.rule === "replicator") {
    const share = replicator(M, Math.min(cfg.generations, 5000));
    const { verdict, warnings } = summarize(share);
    return {
      rule: "replicator", keys: KEYS.slice(), matrix: M, settledMean: share,
      settledBand: share.map((s) => ({ lo: s, hi: s })), fixation: share.slice(),
      analytic: null, verdict, warnings, engineTag: EVOLUTION_ENGINE_TAG,
    };
  }
  const finals: number[][] = new Array(cfg.replicates);
  for (let r = 0; r < cfg.replicates; r++) finals[r] = replicateFinal(M, cfg, r);
  const mean = new Array(NK).fill(0);
  const lo = new Array(NK).fill(Infinity);
  const hi = new Array(NK).fill(-Infinity);
  const plurality = new Array(NK).fill(0);
  for (let r = 0; r < cfg.replicates; r++) {
    const x = finals[r];
    let arg = 0;
    for (let k = 0; k < NK; k++) {
      mean[k] += x[k];
      if (x[k] < lo[k]) lo[k] = x[k];
      if (x[k] > hi[k]) hi[k] = x[k];
      if (x[k] > x[arg]) arg = k;
    }
    plurality[arg]++;
  }
  for (let k = 0; k < NK; k++) mean[k] /= cfg.replicates;
  const { verdict, warnings } = summarize(mean);
  return {
    rule: "moran", keys: KEYS.slice(), matrix: M, settledMean: mean,
    settledBand: lo.map((l, k) => ({ lo: l, hi: hi[k] })),
    fixation: plurality.map((c) => c / cfg.replicates),
    analytic: analyticStationary(M, cfg.slots, cfg.beta),
    verdict, warnings, engineTag: EVOLUTION_ENGINE_TAG,
  };
}
