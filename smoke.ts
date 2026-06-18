import { runSimulation, verdict, DEFAULT_CONFIG, type SimConfig } from "./src/lib/sim.ts";

// 1. Determinism: same config + seed must give identical revenue.
const a = runSimulation(DEFAULT_CONFIG);
const b = runSimulation(DEFAULT_CONFIG);
console.log("determinism:", a.totalRevenue === b.totalRevenue ? "PASS" : "FAIL",
  "| revenue", Math.round(a.totalRevenue));
console.log("default churn%:", Math.round((1 - a.endingActive / a.startingActive) * 100),
  "| tipping:", a.tippingRound, "| rep:", Math.round(a.endingReputation));
console.log("verdict:", verdict(DEFAULT_CONFIG, a));

// 2. Punishing scenario: hostile pricing + incident + predatory competitor, low friction.
const harsh: SimConfig = {
  ...DEFAULT_CONFIG,
  friction: 8, hikeRound: 6, hikeSize: 40, incidentRound: 10,
  competitorRound: 8, competitorOffer: 60, promoActive: true,
};
const h = runSimulation(harsh);
console.log("\nharsh churn%:", Math.round((1 - h.endingActive / h.startingActive) * 100),
  "| tipping:", h.tippingRound, "| exploitCost:", Math.round(h.exploitationCost),
  "| rep:", Math.round(h.endingReputation));
console.log("harsh verdict:", verdict(harsh, h));

// 3. Per-archetype survival sanity (grudger should die hardest under incidents).
for (const k of Object.keys(h.perArch))
  console.log(`  ${k}: ${h.perArch[k as keyof typeof h.perArch].survived}/${h.perArch[k as keyof typeof h.perArch].start} survived`);
