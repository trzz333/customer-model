// ════════════════════════════════════════════════════════════════════
//  Customer Model — simulation engine
//
//  Pure and deterministic: runSimulation(config) is a function of
//  (config + seed) and nothing else. No I/O, no randomness outside the
//  seeded RNG, no LLM. Same inputs -> same outputs, every time.
//
//  An "AI customer template" = a strategy archetype (adapted from
//  Axelrod's iterated-tournament personalities) + a behavioral-economics
//  bias profile (loss aversion, present bias, reference dependence).
// ════════════════════════════════════════════════════════════════════

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ── Engine version ───────────────────────────────────────────────────
// Bump on any change to the perception core or calibration constants. Stamped
// onto every result so a run is always tied to a known engine (and, once the
// seeded run-link ships, baked into the link so a graded answer key stays
// reproducible). 2.0.0 = the reference-dependent logit core (HJF 1993 / TK 1992)
// that replaced the 1.x fairness deadband. Evolve by versioned release, never by
// silent runtime auto-tuning.
export const ENGINE_VERSION = "2.0.0";

// ── Reference-dependent perception constants ─────────────────────────
// The customer judges each round against an adapting reference point. The
// functional form follows the reference-dependent logit brand-choice model
// of Hardie, Johnson & Fader (1993, Marketing Science), itself built on the
// Tversky-Kahneman (1992) value function: a perceived loss is weighted by λ
// relative to an equal-size gain, with diminishing sensitivity α, and a logit
// turns perceived utility into a GRADED probability of reading the round as a
// defection — so λ moves behaviour continuously, not just at a hard threshold.
const PT_ALPHA = 0.88;   // diminishing sensitivity (TK 1992 median)
const PERC_TOL = 22;     // tolerance: small perceived unfairness is shrugged off
const PERC_TEMP = 7;     // logit sharpness of the cooperate/defect read

// ── Archetypes ───────────────────────────────────────────────────────
export type StratKey =
  | "reciprocal" | "forgiving" | "opportunist" | "inertial"
  | "grudger" | "detective" | "pavlov";

export interface Archetype {
  key: StratKey;
  name: string;
  axelrod: string;
  tagline: string;
  color: string;
}

export const ARCHETYPES: Archetype[] = [
  { key: "reciprocal", name: "Reciprocal Loyalist", axelrod: "Tit-for-Tat", color: "var(--color-strategist)",
    tagline: "Mirrors you. The round after you cut value or hike price they start shopping; win the value back and they return." },
  { key: "forgiving", name: "Forgiving Loyalist", axelrod: "Tit-for-Two-Tats", color: "var(--color-researcher)",
    tagline: "Absorbs one bad round. Only defects after two strikes in a row, so a single billing glitch won't lose them." },
  { key: "opportunist", name: "Opportunistic Churner", axelrod: "Always Defect", color: "var(--color-bad)",
    tagline: "Pure price-elasticity. Hunts promos, games guarantees, leaves the moment a cheaper option appears." },
  { key: "inertial", name: "Inertial Loyalist", axelrod: "Always Cooperate", color: "var(--color-source-official)",
    tagline: "Status-quo bias. Eats hikes and quality drops for a long time, then leaves all at once when it overflows." },
  { key: "grudger", name: "One-Strike Grudger", axelrod: "Grim Trigger", color: "var(--color-mixed)",
    tagline: "Cooperates until your first real defect — one hidden fee, one bad incident — then churns permanently." },
  { key: "detective", name: "Probing Strategist", axelrod: "Detective", color: "var(--color-source-primary)",
    tagline: "Tests you with an early defection. If you push back, behaves reciprocally; if you keep appeasing, exploits you." },
  { key: "pavlov", name: "Habitual Repeater", axelrod: "Pavlov (Win-Stay-Lose-Shift)", color: "var(--color-source-community)",
    tagline: "Repeats whatever paid off last round, flips when it didn't. Sticky when satisfied, abrupt when burned." },
];

export const ARCH_BY_KEY: Record<StratKey, Archetype> =
  Object.fromEntries(ARCHETYPES.map((a) => [a.key, a])) as Record<StratKey, Archetype>;

// ── Config + result types ────────────────────────────────────────────
export interface SimConfig {
  population: number;
  rounds: number;
  seed: number;
  mix: Record<StratKey, number>;       // relative weights, normalized internally

  priceIndex: number;                  // 100 = launch price
  valueIndex: number;                  // 100 = promised value
  friction: number;                    // 0..100 switching cost / lock-in
  promoActive: boolean;                // standing retention promo (defends churn, leaks margin)

  lossAversion: number;                // λ — Tversky-Kahneman default 2.25 (meta mean ~1.96; range ~1.5–3)
  presentBias: number;                 // 1..3 — overweight on immediate competitor lures
  refAdapt: number;                    // 0..1 — how fast expectations re-anchor to current price
  noise: number;                       // 0..0.3 — chance a move is misperceived

  hikeRound: number;                   // round a price shock lands (0 = none)
  hikeSize: number;                    // points added to priceIndex at hikeRound
  incidentRound: number;               // round a service incident hits (0 = none)
  competitorRound: number;             // round a predatory competitor enters (0 = none)
  competitorOffer: number;             // strength of the competitor's immediate lure
}

export type Action = "cooperate" | "defect" | "exploit" | "churned";

interface Agent {
  strat: StratKey;
  refPrice: number;
  refValue: number;
  lastBizSignal: number;               // +1 cooperate, -1 defect (as perceived)
  prevBizSignal: number;
  lastAction: Action;
  dissatisfaction: number;
  probeStage: number;
  detectiveMode: "probe" | "reciprocal" | "exploit";
  status: "active" | "churned";
}

export interface RoundMetric {
  round: number; active: number; churnedThisRound: number;
  exploiting: number; revenue: number; reputation: number; churnRate: number;
}

export interface SimResult {
  rounds: RoundMetric[];
  perArch: Record<StratKey, { start: number; survived: number; churned: number }>;
  totalRevenue: number;
  exploitationCost: number;
  startingActive: number;
  endingActive: number;
  endingReputation: number;
  minReputation: number;
  tippingRound: number | null;
}

// ── The engine ───────────────────────────────────────────────────────
export function runSimulation(cfg: SimConfig): SimResult {
  const rng = makeRng(cfg.seed);
  const keys = ARCHETYPES.map((a) => a.key);
  const totalWeight = keys.reduce((s, k) => s + Math.max(0, cfg.mix[k]), 0) || 1;

  const agents: Agent[] = [];
  const perArch = {} as SimResult["perArch"];
  keys.forEach((k) => (perArch[k] = { start: 0, survived: 0, churned: 0 }));

  function spawn(): void {
    let r = rng() * totalWeight;
    let strat: StratKey = keys[0];
    for (const k of keys) { r -= Math.max(0, cfg.mix[k]); if (r <= 0) { strat = k; break; } }
    perArch[strat].start++;
    agents.push({
      strat, refPrice: 100, refValue: 100, lastBizSignal: 1, prevBizSignal: 1,
      lastAction: "cooperate", dissatisfaction: 0, probeStage: 0,
      detectiveMode: "probe", status: "active",
    });
  }
  for (let i = 0; i < cfg.population; i++) spawn();

  const startingActive = agents.length;
  const metrics: RoundMetric[] = [];
  let reputation = 100, totalRevenue = 0, exploitationCost = 0;

  for (let round = 0; round < cfg.rounds; round++) {
    let price = cfg.priceIndex;
    if (cfg.hikeRound > 0 && round >= cfg.hikeRound) price += cfg.hikeSize;
    let value = cfg.valueIndex;
    const incidentNow = cfg.incidentRound > 0 && round === cfg.incidentRound;
    if (incidentNow) value -= 45;
    const competitorLive = cfg.competitorRound > 0 && round >= cfg.competitorRound;
    // Predatory raid: the lure spikes on entry then fades (a launch promo that decays).
    const lure = competitorLive ? cfg.competitorOffer * Math.pow(0.82, round - cfg.competitorRound) : 0;
    const frictionDampen = cfg.friction / 100;

    let active = 0, churnedThisRound = 0, exploiting = 0, revenue = 0, satisfied = 0;

    for (const ag of agents) {
      if (ag.status === "churned") continue;

      // 1. Perceive the move through a reference-dependent value function.
      //    Loss (price above reference, or value below it) is weighted by λ
      //    versus an equal gain, with diminishing sensitivity α (TK 1992).
      const priceLoss = Math.max(0, price - ag.refPrice);
      const priceGain = Math.max(0, ag.refPrice - price);
      const valueLoss = Math.max(0, ag.refValue - value);
      const valueGain = Math.max(0, value - ag.refValue);
      let utility =
        (Math.pow(priceGain, PT_ALPHA) + Math.pow(valueGain, PT_ALPHA)) -
        cfg.lossAversion * (Math.pow(priceLoss, PT_ALPHA) + Math.pow(valueLoss, PT_ALPHA));
      if (incidentNow) utility -= cfg.lossAversion * 9; // a service failure reads as a loss
      // Graded perception (logit): probability the customer reads this round as a
      // defection rises smoothly as utility goes negative, so λ bites continuously.
      const pDefect = 1 / (1 + Math.exp((utility + PERC_TOL) / PERC_TEMP));
      let signal = rng() < pDefect ? -1 : 1;
      if (rng() < cfg.noise) signal = -signal;
      ag.prevBizSignal = ag.lastBizSignal;
      ag.lastBizSignal = signal;
      // Grievance MAGNITUDE (λ-scaled) gives each defect round a heavier leave
      // chance when the loss is bigger; dissatisfaction itself accumulates plainly
      // so it can't run away to a wipeout.
      const grievance = Math.max(0, -utility);
      ag.dissatisfaction = signal < 0
        ? ag.dissatisfaction + 1
        : Math.max(0, ag.dissatisfaction - 0.9);

      // 2. Strategy chooses intended action from the perceived signal.
      let intent: Action = "cooperate";
      switch (ag.strat) {
        case "reciprocal": intent = signal < 0 ? "defect" : "cooperate"; break;
        case "forgiving": intent = signal < 0 && ag.prevBizSignal < 0 ? "defect" : "cooperate"; break;
        case "opportunist":
          if (cfg.promoActive) intent = "exploit";
          else if (cfg.friction > 55 && signal > 0) intent = "cooperate";
          else intent = "defect";
          break;
        case "inertial": intent = ag.dissatisfaction > 6 ? "defect" : "cooperate"; break;
        case "grudger": intent = signal < 0 ? "churned" : "cooperate"; break;
        case "detective":
          if (ag.detectiveMode === "exploit") intent = "exploit";
          else if (ag.detectiveMode === "reciprocal") intent = signal < 0 ? "defect" : "cooperate";
          else if (ag.probeStage < 2) { intent = "cooperate"; ag.probeStage++; }
          else { intent = "defect"; ag.detectiveMode = signal < 0 ? "reciprocal" : "exploit"; }
          break;
        case "pavlov": {
          const paid = signal > 0;
          if (paid) intent = ag.lastAction === "defect" ? "defect" : "cooperate";
          else intent = ag.lastAction === "cooperate" ? "defect" : "cooperate";
          break;
        }
      }

      // 3. Competitor pull (hyperbolic discounting) can peel a stay-inclined customer.
      const stayValue = (value - price) + 25 + cfg.friction * 0.3;
      const inertiaResist = ag.strat === "inertial" ? 28 : ag.strat === "grudger" ? 4 : 10;
      if ((intent === "cooperate" || intent === "exploit") && lure > 0) {
        const gap = lure - (stayValue + inertiaResist);
        if (gap > 0 && rng() < clamp((gap / 110) * cfg.presentBias * (1 - frictionDampen * 0.6), 0, 0.5)) {
          intent = "churned";
        }
      }

      // 4. Friction gate: a defect intent only converts to churn sometimes.
      let action: Action = intent;
      if (intent === "defect") {
        const leaveProb = clamp(0.03 + Math.min(ag.dissatisfaction, 8) * 0.045 + (lure > 0 ? 0.08 : 0)
          + Math.min(grievance / 35, 0.18) - frictionDampen * 0.55, 0.01, 0.85);
        if (rng() < leaveProb) action = "churned";
      }

      // 5. Resolve effects on revenue, reputation, and expectations.
      if (action === "churned") {
        ag.status = "churned"; churnedThisRound++;
        if (ag.strat === "grudger") reputation -= 0.25; // grudgers spread negative word of mouth
      } else {
        active++;
        ag.refPrice = ag.refPrice * (1 - cfg.refAdapt) + price * cfg.refAdapt;
        ag.refValue = ag.refValue * (1 - cfg.refAdapt) + value * cfg.refAdapt;
        if (action === "cooperate") { revenue += price; satisfied++; }
        else if (action === "defect") { revenue += price * 0.35; }
        else if (action === "exploit") {
          exploiting++;
          const promoCost = cfg.promoActive ? 45 : 0;
          revenue += price * 0.5 - promoCost; exploitationCost += promoCost;
        }
        ag.lastAction = action;
      }
    }

    // Reputation reflects BOTH survivor satisfaction and negative word-of-mouth
    // from this round's churn, then mean-reverts toward that target.
    const coopRate = active > 0 ? satisfied / active : 0;
    const churnShare = (active + churnedThisRound) > 0 ? churnedThisRound / (active + churnedThisRound) : 0;
    const repTarget = clamp(55 + 75 * coopRate - 110 * churnShare, 0, 160);
    reputation += (repTarget - reputation) * 0.2;
    reputation = clamp(reputation, 0, 160);

    // 6. Reputation drives acquisition: healthy rep regrows the base.
    const acqRate = (reputation - 100) / 100;
    const newCount = Math.max(0, Math.round(startingActive * 0.03 * acqRate));
    for (let i = 0; i < newCount; i++) { spawn(); active++; }

    totalRevenue += revenue;
    const denom = active + churnedThisRound || 1;
    metrics.push({ round, active, churnedThisRound, exploiting, revenue,
      reputation: Math.round(reputation * 10) / 10, churnRate: churnedThisRound / denom });
  }

  // Final survival tally.
  for (const ag of agents) {
    if (ag.status === "churned") perArch[ag.strat].churned++;
    else perArch[ag.strat].survived++;
  }

  // Tipping point: first round where churn spikes well above the early baseline.
  const baseline = metrics.slice(0, Math.min(3, metrics.length))
    .reduce((s, m) => s + m.churnedThisRound, 0) / Math.min(3, metrics.length || 1);
  let tippingRound: number | null = null;
  const spikeFloor = Math.max(baseline * 2.5, startingActive * 0.04);
  for (const m of metrics) {
    if (m.round >= 2 && m.churnedThisRound > spikeFloor) { tippingRound = m.round; break; }
  }

  const endingActive = metrics.length ? metrics[metrics.length - 1].active : startingActive;
  return {
    rounds: metrics, perArch, totalRevenue, exploitationCost,
    startingActive, endingActive,
    endingReputation: metrics.length ? metrics[metrics.length - 1].reputation : 100,
    minReputation: metrics.length ? Math.min(...metrics.map((m) => m.reputation)) : 100,
    tippingRound,
  };
}

// ── Plain-language verdict (deterministic; no LLM) ───────────────────
export function verdict(cfg: SimConfig, r: SimResult): string {
  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
  const parts: string[] = [];

  if (churnPct >= 60) parts.push(`This model bleeds out: it loses about ${churnPct}% of its starting base over ${cfg.rounds} rounds.`);
  else if (churnPct >= 30) parts.push(`This model erodes: it loses roughly ${churnPct}% of its starting base over ${cfg.rounds} rounds.`);
  else if (churnPct <= 0) parts.push(`This model grows: reputation pulls in more customers than it loses.`);
  else parts.push(`This model mostly holds: it loses about ${churnPct}% of its base over ${cfg.rounds} rounds.`);

  if (r.tippingRound !== null) {
    parts.push(`The break is not gradual — churn cascades at round ${r.tippingRound}, where reciprocal and grim-trigger segments defect together.`);
  }

  const exploiters = ARCH_BY_KEY.opportunist;
  if (r.exploitationCost > r.totalRevenue * 0.08) {
    parts.push(`A meaningful share of revenue is eaten by promo-cycling and guarantee-gaming (the ${exploiters.name} and exploit-mode ${ARCH_BY_KEY.detective.name} segments); the retention promo is defending churn but leaking margin.`);
  }

  if (r.minReputation < 70) parts.push(`Reputation rotted to ${Math.round(r.minReputation)} at its worst, starving the acquisition engine when it mattered most.`);
  else if (r.minReputation > 100) parts.push(`Reputation stayed strong (never below ${Math.round(r.minReputation)}), so word-of-mouth kept doing real acquisition work.`);

  const worst = ARCHETYPES
    .map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((x) => r.perArch[x.a.key].start > 0)
    .sort((x, y) => y.lost - x.lost)[0];
  if (worst && worst.lost > 0.5) {
    parts.push(`The segment you lose hardest is the ${worst.a.name} (${Math.round(worst.lost * 100)}% gone).`);
  }

  return parts.join(" ");
}

// ── A sensible default scenario ──────────────────────────────────────
export const DEFAULT_CONFIG: SimConfig = {
  population: 600, rounds: 40, seed: 12345,
  mix: { reciprocal: 28, forgiving: 14, opportunist: 18, inertial: 16, grudger: 10, detective: 6, pavlov: 8 },
  priceIndex: 100, valueIndex: 100, friction: 35, promoActive: false,
  lossAversion: 2.25, presentBias: 1.8, refAdapt: 0.25, noise: 0.05,
  hikeRound: 12, hikeSize: 10, incidentRound: 0, competitorRound: 26, competitorOffer: 28,
};
