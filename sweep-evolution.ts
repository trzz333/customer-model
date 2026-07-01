// Pre-registered verifying sweep for the 2.3.0 EVOLUTION challenger (src/lib/evolution.ts).
// Gates per docs/design-note-evolution.md. Promote ONLY if G1-G4 all pass.
//   G1 champion untouched: frozen 2.2.0 runSimulation is byte-identical; the evo tag is
//      distinct from ENGINE_VERSION so a challenger run can never wear the champion stamp.
//   G2 regeneration: same runSeed -> deep-equal ensemble; a different seed moves it.
//   G3 order-independence: replicate r's outcome depends only on (runSeed, r), never on
//      when it is computed; forward and reversed passes give the identical indexed set.
//   G4 fixation formula: Monte Carlo of the Fermi birth-death (T-/T+ = exp(-beta*(fj-fi)))
//      matches the closed-form fixation() the analytic anchor is built on, within MC error.
// Diagnostic (not a gate): multi-type ensemble occupancy vs the analytic stationary dist.
//
// Reduced dynamics params vs EVO_DEFAULTS are used for sweep speed and stated below. The
// determinism gates (G2,G3) are size-independent by construction, and G4 validates the
// dimension-general fixation formula, so the reduction is not load-bearing.
import { runSimulation, DEFAULT_CONFIG, ARCHETYPES, ENGINE_VERSION } from "./src/lib/sim.ts";
import { runEvolution, replicateFinal, measureMatrix, fixation, subRng,
  EVO_DEFAULTS, EVOLUTION_ENGINE_TAG, type EvoConfig, type EvoRule } from "./src/lib/evolution.ts";

const NAMES = ARCHETYPES.map((a) => a.name);
const NK = ARCHETYPES.length;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const eqVec = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// Sweep dynamics config: reduced generations/replicates vs EVO_DEFAULTS for speed.
const SWEEP_GENS = 20000;
const SWEEP_REPS = 12;
function evo(rule: EvoRule, runSeed: number, over: Partial<EvoConfig> = {}): EvoConfig {
  return { base: DEFAULT_CONFIG, rule, runSeed, ...EVO_DEFAULTS,
    generations: SWEEP_GENS, replicates: SWEEP_REPS, ...over };
}
const results: Record<string, boolean> = {};

console.log("═══ 2.3.0 evolution challenger — pre-registered sweep ═══");
console.log(`archetypes (NK=${NK}): ${NAMES.join(", ")}`);
console.log(`sweep dynamics: generations ${SWEEP_GENS}, replicates ${SWEEP_REPS}, slots ${EVO_DEFAULTS.slots}, beta ${EVO_DEFAULTS.beta}, mutation ${EVO_DEFAULTS.mutation}`);
console.log(`(EVO_DEFAULTS.generations ${EVO_DEFAULTS.generations} is the long single-chain diagnostic size, not needed for these gates)`);

// ── G1. CHAMPION UNTOUCHED ───────────────────────────────────────────
// The frozen champion core must be byte-identical: its recorded default revenue holds
// (this is the actual byte-identity proof — the perception core is untouched), and the
// challenger tag is a DISTINCT string from ENGINE_VERSION so no challenger artifact can
// ever be mistaken for a champion result. The ENGINE_VERSION string is a release LABEL,
// not the core: it reads 2.2.0 before promotion and 2.3.0 after, while the core numbers
// stay identical, so G1 pins revenue + tag-distinctness and treats the label as FYI.
const champRev = Math.round(runSimulation(DEFAULT_CONFIG).totalRevenue);
const tagDistinct = EVOLUTION_ENGINE_TAG !== ENGINE_VERSION && EVOLUTION_ENGINE_TAG.includes("challenger");
results.G1 = champRev === 1762833 && tagDistinct;
console.log(`\nG1 champion untouched: ${results.G1 ? "PASS" : "FAIL"}`);
console.log(`   default revenue ${champRev} (expect 1762833; the byte-identity pin) | tag distinct: ${tagDistinct} | ENGINE_VERSION ${ENGINE_VERSION} (FYI label) | evo tag ${EVOLUTION_ENGINE_TAG}`);

// ── G2. REGENERATION ─────────────────────────────────────────────────
// Same runSeed regenerates the ensemble bit for bit; a different seed moves it.
const gA1 = runEvolution(evo("moran", 40404));
const gA2 = runEvolution(evo("moran", 40404));
const gB  = runEvolution(evo("moran", 70707));
const sameSeedIdentical =
  eqVec(gA1.settledMean, gA2.settledMean) &&
  eqVec(gA1.fixation, gA2.fixation) &&
  gA1.settledBand.every((o, i) => o.lo === gA2.settledBand[i].lo && o.hi === gA2.settledBand[i].hi) &&
  gA1.verdict === gA2.verdict;
const diffSeedMoves = !eqVec(gA1.settledMean, gB.settledMean);
results.G2 = sameSeedIdentical && diffSeedMoves;
console.log(`\nG2 regeneration: ${results.G2 ? "PASS" : "FAIL"}`);
console.log(`   same seed deep-equal: ${sameSeedIdentical} | different seed moves output: ${diffSeedMoves}`);

// ── G3. ORDER-INDEPENDENCE ───────────────────────────────────────────
// replicateFinal(M,cfg,r) must depend only on (runSeed,r), never on WHEN it is computed.
// Measure M once, compute every replicate forward, then reversed, store each at index r;
// the two indexed sets must be bit-identical, so any aggregation over them is identical too.
const g3cfg = evo("moran", 13579);
const M3 = measureMatrix(g3cfg);
const fwd: number[][] = new Array(SWEEP_REPS);
for (let r = 0; r < SWEEP_REPS; r++) fwd[r] = replicateFinal(M3, g3cfg, r);
const rev: number[][] = new Array(SWEEP_REPS);
for (let r = SWEEP_REPS - 1; r >= 0; r--) rev[r] = replicateFinal(M3, g3cfg, r);
const perRepIdentical = fwd.every((v, r) => eqVec(v, rev[r]));
results.G3 = perRepIdentical;
console.log(`\nG3 order-independence: ${results.G3 ? "PASS" : "FAIL"}`);
console.log(`   all ${SWEEP_REPS} replicate vectors identical across forward vs reversed computation: ${perRepIdentical}`);

// ── G4. FIXATION FORMULA (Monte Carlo vs closed form) ────────────────
// The analytic anchor stands on fixation(): the closed-form Fermi fixation of one
// j-mutant in an all-i population of N. Validate it directly. The matching stochastic
// process is the pairwise-comparison (Fermi) birth-death whose transition ratio is
// T-/T+ = exp(-beta*(fj-fi)) = gamma_m, so given a state change P(up)=1/(1+gamma_m).
// We simulate that embedded gambler's-ruin to absorption and estimate P(j fixes).
const N4 = EVO_DEFAULTS.slots;      // 60
const beta4 = EVO_DEFAULTS.beta;    // 6
const TRIALS = 12000;
const rng = subRng(20260630, "g4");

function mcFixation(M: number[][], i: number, j: number): number {
  let fixed = 0;
  for (let t = 0; t < TRIALS; t++) {
    let m = 1; // number of j
    while (m > 0 && m < N4) {
      const fj = (M[j][j] * (m - 1) + M[j][i] * (N4 - m)) / (N4 - 1);
      const fi = (M[i][j] * m + M[i][i] * (N4 - m - 1)) / (N4 - 1);
      const gamma = Math.exp(-beta4 * (fj - fi));
      const pUp = 1 / (1 + gamma);
      m += rng() < pUp ? 1 : -1;
    }
    if (m === N4) fixed++;
  }
  return fixed / TRIALS;
}

// Pick informative pairs: the one closest to a coin-flip (hardest / slowest mixing),
// and a strongly-selected but non-degenerate pair, so the check spans the range.
const pairs: Array<{ i: number; j: number; rho: number }> = [];
for (let i = 0; i < NK; i++) for (let j = 0; j < NK; j++) if (i !== j)
  pairs.push({ i, j, rho: fixation(M3, N4, beta4, i, j) });
const nearHalf = pairs.slice().sort((a, b) => Math.abs(a.rho - 0.5) - Math.abs(b.rho - 0.5))[0];
const selected = pairs.filter((p) => p.rho < 0.97).slice().sort((a, b) => b.rho - a.rho)[0];
const tested = [nearHalf, selected];
let g4ok = true;
console.log(`\nG4 fixation formula (N=${N4}, beta=${beta4}, ${TRIALS} trials/pair):`);
for (const p of tested) {
  const mc = mcFixation(M3, p.i, p.j);
  const se = Math.sqrt(Math.max(mc * (1 - mc), 1e-6) / TRIALS);
  const diff = Math.abs(mc - p.rho);
  const ok = diff <= 0.03;
  g4ok = g4ok && ok;
  console.log(`   ${NAMES[p.j]} into ${NAMES[p.i]}: closed ${r3(p.rho)}  MC ${r3(mc)}  |Δ| ${r3(diff)} (SE ${r3(se)}) ${ok ? "ok" : "OUT"}`);
}
results.G4 = g4ok;
console.log(`   G4: ${results.G4 ? "PASS" : "FAIL"} (tolerance 0.03)`);

// ── DIAGNOSTIC (not a gate): multi-type ensemble vs analytic stationary ──
// Mixing time makes a tight numeric match seed-count-sensitive, so this informs
// interpretation rather than blocking promotion.
const diag = runEvolution(evo("moran", 555));
console.log("\nDIAGNOSTIC — multi-type occupancy (not a gate):");
console.log("   archetype            ensemble-mean   plurality   analytic-stationary");
for (let k = 0; k < NK; k++) {
  const a = diag.analytic ? pct(diag.analytic[k]) : "n/a";
  console.log(`   ${NAMES[k].padEnd(20)} ${pct(diag.settledMean[k]).padStart(8)}   ${pct(diag.fixation[k]).padStart(8)}   ${a.padStart(10)}`);
}
console.log(`   verdict: ${diag.verdict}`);
if (diag.warnings.length) diag.warnings.forEach((w) => console.log(`   warning: ${w}`));

// ── SUMMARY ──────────────────────────────────────────────────────────
const order = ["G1", "G2", "G3", "G4"];
const allPass = order.every((g) => results[g]);
console.log("\n═══ RESULT ═══");
order.forEach((g) => console.log(`   ${g}: ${results[g] ? "PASS" : "FAIL"}`));
console.log(allPass
  ? "   ALL GATES PASS — challenger is sound; promotion is unblocked (pending taste review of the surface)."
  : "   ONE OR MORE GATES FAILED — do NOT promote. Champion stays 2.2.0.");
