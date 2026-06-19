// Pre-registered NEGATIVE-PEAK refinement test for the 2.2.0 peak-end memory.
// Parked item, docs/design-note-v2.md §CAVEAT RECONCILIATION net-step 3:
// "test a slightly stronger NEGATIVE-peak term (the robust, retained part of
// peak-end is a severe failure), gated by G4, with the fail condition that it
// must not move equal-mean verdicts beyond the band G2 allows."
//
// CHALLENGER FORM (offline; sim.ts untouched by this test). The 2.2.0 peak term
// is symmetric: effPeak = the entry furthest from neutral 100. The refinement
// amplifies ONLY below-neutral craters by a factor kappa, leaving positive
// spikes alone, which mirrors the engine's own loss aversion (lambda 2.25):
//   dev = peak - 100;  effPeak = dev < 0 ? 100 + kappa*dev : peak
// kappa = 1 nests the champion byte-for-byte. collapseNeg(.,.,1) === engine.
//
// PRE-REGISTERED GATES (decided before running):
//   T1 NEST: kappa=1 reproduces engine collapseReputation on the battery exactly.
//   T2 POSITIVE-PEAK INVARIANCE: a positive-spike series is identical across all kappa.
//   G4 STRENGTHEN: margin(kappa)=rem(rising)-rem(lateDip) is monotone non-decreasing
//      and >= champion (3.2) for kappa>1 (the negative peak bites at least as hard).
//   G2 BAND (the FAIL CONDITION): for an admissible kappa the equal-mean battery must
//      still satisfy 2.2.0's G2 -- max|remembered-mean| <= 12 AND average-dominance
//      convergence (spread default > highAvg > avg-only ~ 0). kappa_max = largest kappa
//      keeping G2. If no kappa>1 keeps G2, the refinement is REJECTED.
//
// PRE-REGISTERED DECISION RULE (materiality, decided before running):
//   - no admissible kappa>1  -> REJECTED.
//   - admissible window, but G4-margin gain at the largest in-band kappa < 1.0
//     reputation point -> ADMISSIBLE-BUT-NOT-MATERIAL: the symmetric 2.2.0 peak
//     already carries negative peaks; a sub-point asymmetry does not clear the
//     honest-effect-size bar to justify adding a parameter. Keep 2.2.0 champion.
//   - gain >= 1.0 point with convergence intact -> PROMOTE-CANDIDATE (then scaffold
//     kappa into sim.ts at default 1 == byte-identical and run the full engine sweep).
import { collapseReputation, REP_MEMORY, type RepWeights } from "./src/lib/sim.ts";

const r2 = (x: number) => Math.round(x * 100) / 100;
const meanOf = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

// Challenger collapse: amplify only below-neutral craters by kappa; spikes untouched.
function collapseNeg(series: number[], w: RepWeights, kappa: number): number {
  const n = series.length;
  if (n === 0) return 100;
  let sum = 0, peak = series[0];
  for (const x of series) {
    sum += x;
    const d = Math.abs(x - 100), dp = Math.abs(peak - 100);
    if (d > dp || (d === dp && x < peak)) peak = x;
  }
  const dev = peak - 100;
  const effPeak = dev < 0 ? 100 + kappa * dev : peak;
  return w.avg * (sum / n) + w.first * series[0] + w.peak * effPeak + w.end * series[n - 1];
}

// Equal-mean (90) battery, same as the champion sweep, plus a positive-spike control.
const rising  = [60, 70, 80, 90, 100, 110, 120];
const falling = [120, 110, 100, 90, 80, 70, 60];
const lateDip = [100, 100, 100, 100, 100, 100, 30];
const spikeUp = [90, 90, 90, 90, 90, 90, 150]; // positive extreme; must be kappa-invariant
const W = REP_MEMORY;
const highAvg: RepWeights = { avg: 0.9, first: 0.04, peak: 0.03, end: 0.03 };
const avgOnly: RepWeights = { avg: 1, first: 0, peak: 0, end: 0 };

console.log("champion weights:", JSON.stringify(W), "| means(all 90):",
  meanOf(rising), meanOf(falling), meanOf(lateDip));

// ── T1 NEST: kappa=1 reproduces the engine collapse exactly ──────────
const battery = [rising, falling, lateDip, spikeUp];
const nestErr = Math.max(...battery.map((s) => Math.abs(collapseNeg(s, W, 1) - collapseReputation(s, W))));
console.log("\nT1 nest (kappa=1 == engine):", nestErr < 1e-9 ? "PASS" : "FAIL", `| max|diff| ${nestErr}`);

// ── T2 POSITIVE-PEAK INVARIANCE: spikeUp identical across kappa ───────
const spikeVals = [1, 1.3, 2, 2.25].map((k) => collapseNeg(spikeUp, W, k));
const spikeInv = Math.max(...spikeVals) - Math.min(...spikeVals) < 1e-9;
console.log("T2 positive-peak invariant to kappa:", spikeInv ? "PASS" : "FAIL",
  `| spikeUp remembered ${r2(spikeVals[0])} for all kappa (asymmetry is crater-only)`);

// ── kappa sweep: G4 strengthening + G2 band, per kappa ───────────────
const GRID = [1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.31, 1.32, 1.35, 1.5, 2.0, 2.25];
const championMargin = collapseReputation(rising, W) - collapseReputation(lateDip, W); // 3.2

const spreadAt = (w: RepWeights, k: number) => {
  const v = [rising, falling, lateDip].map((s) => collapseNeg(s, w, k));
  return Math.max(...v) - Math.min(...v);
};

type Row = { k: number; margin: number; dev: number; conv: boolean; g2: boolean };
const rows: Row[] = GRID.map((k) => {
  const rem = [rising, falling, lateDip].map((s) => collapseNeg(s, W, k));
  const dev = Math.max(...rem.map((x) => Math.abs(x - 90)));
  const margin = collapseNeg(rising, W, k) - collapseNeg(lateDip, W, k);
  const sDef = spreadAt(W, k), sHigh = spreadAt(highAvg, k), sAvg = spreadAt(avgOnly, k);
  const conv = sDef > sHigh && sHigh > sAvg && sAvg < 1e-9;
  return { k, margin, dev, conv, g2: dev <= 12 && conv };
});

console.log("\n kappa | G4 margin | G2 dev | conv | in-band");
for (const r of rows)
  console.log(`  ${r.k.toFixed(2)} |   ${r2(r.margin).toFixed(2).padStart(5)}   |  ${r2(r.dev).toFixed(2).padStart(5)} |  ${r.conv ? "y" : "n"}   |  ${r.g2 ? "yes" : "NO"}`);

// G4 monotone non-decreasing and >= champion for kappa>1
let mono = true;
for (let i = 1; i < rows.length; i++) if (rows[i].margin < rows[i - 1].margin - 1e-9) mono = false;
const strengthens = rows.filter((r) => r.k > 1).every((r) => r.margin >= championMargin - 1e-9);
console.log("\nG4 monotone non-decreasing & >= champion:", (mono && strengthens) ? "PASS" : "FAIL",
  `| champion margin ${r2(championMargin)}`);

// G2 band: largest in-band kappa
const inBand = rows.filter((r) => r.g2);
const kMax = inBand.length ? Math.max(...inBand.map((r) => r.k)) : 1;
const firstBreak = rows.find((r) => r.k > 1 && !r.g2);
console.log("G2 band kappa_max (largest in-band):", kMax,
  firstBreak ? `| first break at kappa ${firstBreak.k} (dev ${r2(firstBreak.dev)} > 12)` : "");

// ── VERDICT (pre-registered decision rule) ───────────────────────────
const admissible = kMax > 1;
const topRow = inBand.reduce((a, b) => (b.k > a.k ? b : a), { k: 1, margin: championMargin } as Row);
const gain = topRow.margin - championMargin;
let verdict: string;
if (!admissible) verdict = "REJECTED (no kappa>1 keeps G2)";
else if (gain < 1.0) verdict = `ADMISSIBLE-BUT-NOT-MATERIAL (max in-band gain ${r2(gain)} pt < 1.0; keep 2.2.0 champion)`;
else verdict = `PROMOTE-CANDIDATE (in-band gain ${r2(gain)} pt at kappa ${topRow.k}; scaffold kappa into sim.ts and run full engine sweep)`;
console.log("\nVERDICT:", verdict);
console.log(`  admissible window kappa in (1, ${kMax}]; G4 margin ${r2(championMargin)} -> ${r2(topRow.margin)} at kappa ${topRow.k}.`);
console.log("  G2 (average dominance) caps the achievable negative-peak strengthening: the band, not the evidence, sets the ceiling.");
