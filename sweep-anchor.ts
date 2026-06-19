// Pre-registered verifying sweep for the 2.1.0 reference-price anchoring mechanism.
// Gate per docs/design-note-v2.md §2: promote ONLY if these pass.
//   1. OFF-PATH IDENTITY  anchorShift 0 reproduces 2.0.0 (default revenue 1771114).
//   2. MONOTONIC HEADROOM a positive frame on a hike build raises keep%, monotone.
//   3. DECAYS BACK        the frame fades at (1-refAdapt)^k; no permanent lift.
//   4. FLOORS ON STRESS   on a catastrophe build the frame barely helps.
import { runSimulation, DEFAULT_CONFIG, type SimConfig, type RepWeights } from "./src/lib/sim.ts";

const SEEDS = [12345, 222, 777, 4040, 90909, 31337, 56789];
const REP_IDENTITY: RepWeights = { avg: 0, first: 0, peak: 0, end: 1 };
const keepOf = (c: SimConfig) => {
  const r = runSimulation(c);
  return (r.endingActive / r.startingActive) * 100;
};
const meanKeep = (base: SimConfig) =>
  SEEDS.reduce((s, seed) => s + keepOf({ ...base, seed }), 0) / SEEDS.length;
const lastChurn = (c: SimConfig, n: number) => {
  const r = runSimulation(c);
  const tail = r.rounds.slice(-n);
  return tail.reduce((s, m) => s + m.churnRate, 0) / tail.length;
};
const round1 = (x: number) => Math.round(x * 10) / 10;

// ── 1. OFF-PATH IDENTITY ─────────────────────────────────────────────
// Two parts after the 2.2.0 peak-end bump shifted the default-run baseline:
// (1a) anchor off must equal the engine's OWN current no-anchor baseline (a
//      regression pin; DEFAULT_CONFIG has anchorShift 0). 2.2.0 default = 1762833,
//      down from the 2.1.0 value 1771114 because peak-end is now live on the default
//      run; anchoring did not cause this.
// (1b) anchoring's cross-version identity, isolated from peak-end: with peak-end at
//      identity weights, anchor off reproduces the historical 2.1.0 revenue 1771114,
//      proving the anchor path itself is still byte-clean.
const baseRev = Math.round(runSimulation(DEFAULT_CONFIG).totalRevenue);
console.log("1a. off-path identity (current engine):", baseRev === 1762833 ? "PASS" : "FAIL",
  "| 2.2.0 default revenue", baseRev, "(expect 1762833; anchor off must not perturb the baseline)");
const idRev = Math.round(runSimulation({ ...DEFAULT_CONFIG, repWeights: REP_IDENTITY }).totalRevenue);
console.log("1b. anchoring identity vs 2.1.0 (peak-end at identity):", idRev === 1771114 ? "PASS" : "FAIL",
  "| revenue", idRev, "(expect 1771114; anchor path byte-clean independent of peak-end)");

// ── 2. MONOTONIC HEADROOM ────────────────────────────────────────────
// A hike build: price rises +30 at round 8, so it reads as a loss the frame can blunt.
const hike: SimConfig = { ...DEFAULT_CONFIG, friction: 30, hikeRound: 8, hikeSize: 30,
  competitorRound: 0, competitorOffer: 0, anchorRound: 8 };
const shifts = [0, 5, 10, 15, 20, 25];
const keeps = shifts.map((s) => round1(meanKeep({ ...hike, anchorShift: s })));
let monotone = true;
for (let i = 1; i < keeps.length; i++) if (keeps[i] < keeps[i - 1] - 0.05) monotone = false;
console.log("2. monotonic headroom:", monotone ? "PASS" : "FAIL");
shifts.forEach((s, i) => console.log(`     anchorShift ${String(s).padStart(2)} -> keep ${keeps[i]}`));

// ── 3. DECAYS BACK (no permanent lift) ───────────────────────────────
// Residual frame after k rounds at refAdapt 0.25 is 0.75^k.
const refAdapt = DEFAULT_CONFIG.refAdapt;
[5, 10, 16, 20].forEach((k) =>
  console.log(`     residual frame at +${k} rounds: ${(100 * Math.pow(1 - refAdapt, k)).toFixed(1)}%`));
// Steady build, long run: a from-launch frame must not suppress late churn permanently.
const steady: SimConfig = { ...DEFAULT_CONFIG, rounds: 60, hikeRound: 0, hikeSize: 0,
  incidentRound: 0, competitorRound: 0, competitorOffer: 0, valueIndex: 100, priceIndex: 100 };
const lateBase = round1(lastChurn(steady, 10) * 1000);
const lateAnch = round1(lastChurn({ ...steady, anchorShift: 20, anchorRound: 0 }, 10) * 1000);
const decayed = Math.abs(lateAnch - lateBase) <= 1.5; // late churn ~equal once frame fades
console.log("3. decays back:", decayed ? "PASS" : "FAIL",
  `| late-10 churn/1000  base ${lateBase}  anchored ${lateAnch} (should match; frame has faded)`);

// ── 4. FLOORS ON STRESS ──────────────────────────────────────────────
const calmLift = round1(meanKeep({ ...hike, anchorShift: 20 }) - meanKeep({ ...hike, anchorShift: 0 }));
const cata: SimConfig = { ...DEFAULT_CONFIG, friction: 8, hikeRound: 6, hikeSize: 40,
  incidentRound: 10, competitorRound: 8, competitorOffer: 60, promoActive: true, anchorRound: 6 };
const cataLift = round1(meanKeep({ ...cata, anchorShift: 20 }) - meanKeep({ ...cata, anchorShift: 0 }));
const floors = cataLift < calmLift;
console.log("4. floors on stress:", floors ? "PASS" : "FAIL",
  `| keep lift from +20 frame:  headroom build ${calmLift}  catastrophe build ${cataLift}`);
