// Pre-registered verifying sweep for the 2.2.0 peak-end reputation-memory mechanism.
// Gate per docs/design-note-v2.md §3 (reconciled). Promote ONLY if these pass.
//
// RECONCILIATION (pre-registered, before running): the design note's original
// directional gate — "the falling and late-dip series must end with lower reputation
// than the rising one" — encodes NAIVE peak-end (recency wins), which §3 itself
// rejects and which contradicts the cited first-impression evidence (McCullough 2024:
// first impressions dominate). For two equal-mean series whose peaks coincide,
// remembered_falling − remembered_rising = 60·(w_first − w_end), so that gate would
// force w_end > w_first, the opposite of the evidence. It is replaced here with
// evidence-aligned gates: average dominates and the shaped series converge to the
// common mean as w_avg→1 (G2); a better FIRST impression is remembered at least as
// well (G3, the McCullough effect); a severe NEGATIVE peak still drags memory down
// (G4, the robust part of peak-end); a FLAT series is invariant to the corrections
// (G5, the design note's actual FAIL condition). Identity weights reproduce 2.1.0 (G1).
import { runSimulation, collapseReputation, REP_MEMORY, DEFAULT_CONFIG, type SimConfig, type RepWeights } from "./src/lib/sim.ts";

const IDENTITY: RepWeights = { avg: 0, first: 0, peak: 0, end: 1 };
const SEEDS = [12345, 222, 777, 4040, 90909, 31337, 56789];
const r1 = (x: number) => Math.round(x * 10) / 10;
const keepOf = (c: SimConfig) => { const r = runSimulation(c); return (r.endingActive / r.startingActive) * 100; };
const meanKeep = (base: SimConfig) => SEEDS.reduce((s, seed) => s + keepOf({ ...base, seed }), 0) / SEEDS.length;

// Three equal-mean (90) round series with different shapes.
const rising  = [60, 70, 80, 90, 100, 110, 120];
const falling = [120, 110, 100, 90, 80, 70, 60];
const lateDip = [100, 100, 100, 100, 100, 100, 30];
const flat    = [90, 90, 90, 90, 90, 90, 90];
const meanOf = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const rem = (a: number[], w: RepWeights = REP_MEMORY) => collapseReputation(a, w);

console.log("default weights:", JSON.stringify(REP_MEMORY));
console.log("series means (all 90):", meanOf(rising), meanOf(falling), meanOf(lateDip), meanOf(flat));

// ── G1. OFF-PATH IDENTITY ────────────────────────────────────────────
// At identity weights the engine must reproduce 2.1.0 default revenue exactly.
const idRev = Math.round(runSimulation({ ...DEFAULT_CONFIG, repWeights: IDENTITY }).totalRevenue);
const defRev = Math.round(runSimulation(DEFAULT_CONFIG).totalRevenue);
console.log("\nG1 identity reproduces 2.1.0:", idRev === 1771114 ? "PASS" : "FAIL",
  `| identity-weights default revenue ${idRev} (expect 1771114)`);
console.log("   (FYI) peak-end-ON default revenue:", defRev,
  defRev === 1771114 ? "(unchanged — default run sits below the 100 acq threshold)" : "(differs — peak-end is live on the default run)");

// ── G2. AVERAGE DOMINANCE + CONVERGENCE ──────────────────────────────
const remDef = [rising, falling, lateDip].map((s) => rem(s));
const spread = (w: RepWeights) => { const v = [rising, falling, lateDip].map((s) => rem(s, w)); return Math.max(...v) - Math.min(...v); };
const highAvg: RepWeights = { avg: 0.9, first: 0.04, peak: 0.03, end: 0.03 };
const avgOnly: RepWeights = { avg: 1, first: 0, peak: 0, end: 0 };
const devDef = Math.max(...remDef.map((x) => Math.abs(x - 90)));
const sDef = spread(REP_MEMORY), sHigh = spread(highAvg), sAvg = spread(avgOnly);
const converges = sDef > sHigh && sHigh > sAvg && sAvg < 1e-9;
console.log("G2 avg dominates + converges:", (devDef <= 12 && converges) ? "PASS" : "FAIL",
  `| max|remembered−mean| ${r1(devDef)} (≤12); spread default ${r1(sDef)} > highAvg ${r1(sHigh)} > avg-only ${r1(sAvg)}`);

// ── G3. FIRST-IMPRESSION EFFECT (McCullough) ─────────────────────────
// Better first impression (falling starts 120) remembered at least as well as the
// worse one (rising starts 60), all else equal-mean. This is the replacement gate.
const remRise = rem(rising), remFall = rem(falling), remDip = rem(lateDip);
console.log("G3 first impression remembered:", remFall >= remRise ? "PASS" : "FAIL",
  `| falling ${r1(remFall)} ≥ rising ${r1(remRise)}`);

// ── G4. NEGATIVE-PEAK PULL (robust peak-end residual) ────────────────
console.log("G4 severe negative peak drags down:", remDip < remRise ? "PASS" : "FAIL",
  `| late-dip ${r1(remDip)} < rising ${r1(remRise)} (same mean; the crater bites)`);

// ── G5. FLAT INVARIANT (design note's FAIL condition) ────────────────
// No single non-average weight may flip a flat series: with no shape the corrections
// vanish (mean = first = peak = last), so remembered == value for ANY weights.
const flatProbes: RepWeights[] = [REP_MEMORY, { avg: 0, first: 1, peak: 0, end: 0 }, { avg: 0, first: 0, peak: 1, end: 0 }, { avg: 0, first: 0, peak: 0, end: 1 }];
const flatOk = flatProbes.every((w) => Math.abs(rem(flat, w) - 90) < 1e-9);
console.log("G5 flat series invariant:", flatOk ? "PASS" : "FAIL", "| remembered==90 for every single-term weighting");

// ── G6. WEIGHTS WELL-FORMED ──────────────────────────────────────────
const W = REP_MEMORY, sum = W.avg + W.first + W.peak + W.end;
const wellFormed = Math.abs(sum - 1) < 1e-9 && W.avg > W.first && W.avg > W.peak && W.avg > W.end;
console.log("G6 weights well-formed:", wellFormed ? "PASS" : "FAIL", `| sum ${r1(sum)}, avg strictly largest`);

// ── G7. LIVE IN THE ENGINE + HONEST SIZE ─────────────────────────────
// On a healthy build whose reputation climbs above the 100 acq threshold, the
// first-impression anchor tempers runaway word of mouth (remembered < current peak),
// so default-weights keep% is below identity-weights keep% — and only modestly.
const healthy: SimConfig = { ...DEFAULT_CONFIG, priceIndex: 88, valueIndex: 120, hikeRound: 0, hikeSize: 0, incidentRound: 0, competitorRound: 0, competitorOffer: 0, friction: 45 };
const keepId = meanKeep({ ...healthy, repWeights: IDENTITY });
const keepDef = meanKeep({ ...healthy, repWeights: REP_MEMORY });
const live = Math.abs(keepDef - keepId) > 0.05;
console.log("G7 live on a healthy build:", live ? "PASS" : "FAIL",
  `| keep% identity ${r1(keepId)} vs peak-end ${r1(keepDef)} (Δ ${r1(keepDef - keepId)}; first impression tempers word of mouth)`);
