// ════════════════════════════════════════════════════════════════════
//  Customer Model — plain-language input layer (translation only)
//
//  Maps a business described in plain terms, run against a named
//  "customer world", onto a SimConfig for the frozen engine in sim.ts.
//  No engine logic here; this file only produces cfg and reads results
//  back into plain-language analysis. Pure and client-safe.
// ════════════════════════════════════════════════════════════════════
import {
  DEFAULT_CONFIG,
  ARCHETYPES,
  ENGINE_VERSION,
  runSimulation,
  type SimConfig,
  type SimResult,
  type StratKey,
} from "./sim";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export type PriceMove = "cut" | "hold" | "raiseS" | "raiseB";
export type ValuePosture = "premium" | "par" | "thin";
export type Retention = "none" | "loyalty" | "lockin" | "promo";
export type Threat = "none" | "mild" | "hard";

export interface BizInput {
  name: string;
  sell: string;
  model?: string;   // optional long-form paste: a full business model to stress-test
  price: PriceMove;
  value: ValuePosture;
  retention: Retention;
  threat: Threat;
}

export interface AdvOverride {
  rounds?: number;
  lossAversion?: number;
  noise?: number;
  seed?: number;
}

export interface CustomerWorld {
  key: string;
  name: string;
  noun: string;
  blurb: string;
  mix: Record<StratKey, number>;
  presentBias: number;
  impulsive: boolean;
}

export interface FieldOpt { v: string; t: string; note?: string }
export type LeverKey = "price" | "value" | "retention" | "threat";
export interface Field { key: LeverKey; q: string; opts: FieldOpt[] }

// ── The plain-language business questions (the front door) ───────────
export const FIELDS: Field[] = [
  { key: "price", q: "What are you doing with price?", opts: [
    { v: "cut", t: "Cutting to compete", note: "undercut the market" },
    { v: "hold", t: "Holding steady" },
    { v: "raiseS", t: "Raising it a little", note: "modest hike mid-run" },
    { v: "raiseB", t: "Raising it a lot", note: "steep hike mid-run" } ] },
  { key: "value", q: "How good is what they get for the money?", opts: [
    { v: "premium", t: "Clearly better than rivals" },
    { v: "par", t: "About the same" },
    { v: "thin", t: "Stretched thin / cutting corners" } ] },
  { key: "retention", q: "What keeps customers from leaving?", opts: [
    { v: "none", t: "Nothing in particular" },
    { v: "loyalty", t: "Loyalty rewards", note: "earn-over-time perk" },
    { v: "lockin", t: "A contract or lock-in", note: "high switching cost" },
    { v: "promo", t: "A standing discount/promo", note: "defends churn, leaks margin" } ] },
  { key: "threat", q: "What's the competitive threat?", opts: [
    { v: "none", t: "No real threat right now" },
    { v: "mild", t: "A cheaper option exists", note: "enters later, soft lure" },
    { v: "hard", t: "Aggressive rival undercutting", note: "enters early, hard lure" } ] },
];

// Example businesses: pre-fill the form so a class can demo in seconds,
// then swap in a student's own idea. These are not the templates; the
// customer worlds below are.
export const EXAMPLES: BizInput[] = [
  { name: "Note-taking app", sell: "a $12/mo subscription note app", price: "raiseS", value: "premium", retention: "loyalty", threat: "hard" },
  { name: "Neighborhood gym", sell: "a $40/mo gym with annual contracts", price: "hold", value: "par", retention: "lockin", threat: "mild" },
  { name: "Coffee shop", sell: "$5 lattes with a punch-card", price: "hold", value: "par", retention: "loyalty", threat: "hard" },
];

// ── Plain-language term definitions (the front-door vocabulary) ──────
// Single source for the 8th-grade hover defs used inline AND on the
// standalone glossary page. Keep these short enough to read on hover.
export const TERM_DEFS = {
  churn: "Customers leaving or canceling.",
  retention: "Keeping the customers you already have.",
  reputation: "How good people think you are. A good reputation brings in new customers by word of mouth.",
  tipping: "The round where a lot of customers leave at once, instead of a few at a time.",
  contribution: "The money left from a sale after you subtract what it cost to deliver it.",
  npv: "What future money is worth today. A dollar next year is worth a little less than a dollar now.",
  ltvcac: "What a customer is worth to you versus what it cost to get them. Above 1 means worth more than they cost; 3 or more is a common rule-of-thumb for healthy.",
  payback: "How many rounds until a customer pays back what it cost to get them.",
  loss: "People feel a loss more than a same-size gain. Losing $10 stings more than finding $10 feels good.",
  present: "People grab a reward now even when waiting a bit would be better.",
  worlds: "Different kinds of crowds — like loyal regulars versus deal-chasers.",
  lambda: "Loss aversion (the Greek letter lambda). How many times heavier a loss feels than an equal gain.",
};

// Ordered, human-labelled view of the same defs for the glossary page.
// Derived from TERM_DEFS so a definition is never written twice.
export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Customer worlds", def: TERM_DEFS.worlds },
  { term: "Churn", def: TERM_DEFS.churn },
  { term: "Retention", def: TERM_DEFS.retention },
  { term: "Reputation", def: TERM_DEFS.reputation },
  { term: "Tipping point", def: TERM_DEFS.tipping },
  { term: "Loss aversion", def: TERM_DEFS.loss },
  { term: "Present bias", def: TERM_DEFS.present },
  { term: "Lambda (λ)", def: TERM_DEFS.lambda },
  { term: "Contribution margin", def: TERM_DEFS.contribution },
  { term: "NPV (net present value)", def: TERM_DEFS.npv },
  { term: "LTV:CAC", def: TERM_DEFS.ltvcac },
  { term: "Payback", def: TERM_DEFS.payback },
];

// ── Customer worlds (the reusable templates) ─────────────────────────
// A world is a particular mix of the seven archetypes plus how impulsively
// the crowd chases an immediate rival lure (present bias). λ is NOT set
// here: it is held constant across worlds as the shared science.
export const WORLDS: CustomerWorld[] = [
  { key: "mainstream", name: "Mainstream mix", noun: "mainstream customers",
    blurb: "Balanced: some loyal, some price-driven, most in between.",
    mix: { reciprocal: 28, forgiving: 14, opportunist: 18, inertial: 16, grudger: 10, detective: 6, pavlov: 8 }, presentBias: 1.8, impulsive: false },
  { key: "fickle", name: "Fickle bargain-hunters", noun: "bargain-hunters",
    blurb: "Chase the best deal and switch without guilt.",
    mix: { reciprocal: 16, forgiving: 8, opportunist: 34, inertial: 8, grudger: 8, detective: 16, pavlov: 10 }, presentBias: 2.4, impulsive: true },
  { key: "loyal", name: "Loyal regulars", noun: "regulars",
    blurb: "Creatures of habit who stay and forgive small slips.",
    mix: { reciprocal: 22, forgiving: 22, opportunist: 6, inertial: 28, grudger: 6, detective: 4, pavlov: 12 }, presentBias: 1.3, impulsive: false },
  { key: "skeptic", name: "Skeptical first-timers", noun: "skeptics",
    blurb: "Test you early and watch how you respond before committing.",
    mix: { reciprocal: 24, forgiving: 10, opportunist: 14, inertial: 8, grudger: 8, detective: 28, pavlov: 8 }, presentBias: 1.9, impulsive: false },
  { key: "grudge", name: "Grudge-prone crowd", noun: "grudge-holders",
    blurb: "One bad experience and they're gone for good, telling others.",
    mix: { reciprocal: 20, forgiving: 8, opportunist: 12, inertial: 12, grudger: 34, detective: 6, pavlov: 8 }, presentBias: 1.7, impulsive: false },
];

// Short "who they are" gloss for the who-leaves-first sentence. Kept here
// rather than on the frozen engine's Archetype type.
const GLOSS: Record<StratKey, string> = {
  reciprocal: "the ones who mirror you point for point",
  forgiving: "the patient ones who forgive a single slip",
  opportunist: "pure deal-chasers who were never really yours",
  inertial: "autopilot loyalists who only leave once they finally snap",
  grudger: "the one-strike crowd who never come back",
  detective: "testers who probe you and exploit any weakness",
  pavlov: "habit-followers who repeat whatever paid off last time",
};

// ── Plain business + world  →  engine cfg ────────────────────────────
export function businessToCfg(biz: BizInput, world: CustomerWorld, adv?: AdvOverride): SimConfig {
  const c: SimConfig = { ...DEFAULT_CONFIG };
  // Resolve rounds FIRST so event timing scales with it.
  c.rounds = adv?.rounds ?? DEFAULT_CONFIG.rounds;
  c.mix = { ...world.mix };
  c.presentBias = world.presentBias;

  c.priceIndex = 100; c.hikeRound = 0; c.hikeSize = 0;
  if (biz.price === "cut") c.priceIndex = 88;
  else if (biz.price === "raiseS") { c.hikeRound = Math.round(c.rounds * 0.3); c.hikeSize = 12; }
  else if (biz.price === "raiseB") { c.hikeRound = Math.round(c.rounds * 0.3); c.hikeSize = 30; }

  c.valueIndex = biz.value === "premium" ? 120 : biz.value === "thin" ? 82 : 100;
  c.incidentRound = biz.value === "thin" ? Math.round(c.rounds * 0.55) : 0;

  if (biz.retention === "none") { c.friction = 18; c.promoActive = false; }
  else if (biz.retention === "loyalty") { c.friction = 45; c.promoActive = false; }
  else if (biz.retention === "lockin") { c.friction = 72; c.promoActive = false; }
  else if (biz.retention === "promo") { c.friction = 32; c.promoActive = true; }

  if (biz.threat === "none") { c.competitorRound = 0; c.competitorOffer = 0; }
  else if (biz.threat === "mild") { c.competitorRound = Math.round(c.rounds * 0.6); c.competitorOffer = 30; }
  else if (biz.threat === "hard") { c.competitorRound = Math.round(c.rounds * 0.4); c.competitorOffer = 60; }

  if (adv?.lossAversion !== undefined) c.lossAversion = adv.lossAversion;
  if (adv?.noise !== undefined) c.noise = adv.noise;
  if (adv?.seed !== undefined) c.seed = adv.seed;
  return c;
}

// ── Results  →  plain-language analysis (Kahneman: concrete counts,
//    one causal story, the surprising mechanism named in human terms) ──
export interface Layman { tone: "" | "good" | "warn" | "bad"; headline: string; analysis: string; keep: number; grow: boolean }

export function laymanAnalysis(cfg: SimConfig, r: SimResult, world: CustomerWorld): Layman {
  const keep = Math.round((r.endingActive / r.startingActive) * 100);
  const grow = r.endingActive >= r.startingActive;
  const churnPct = 100 - keep;
  const lam = cfg.lossAversion.toFixed(1);
  let tone: Layman["tone"], headline: string;
  if (grow) { tone = "good"; headline = `Grows. Start with 100 ${world.noun} and you end with about ${keep} per 100 — word of mouth more than replaces who leaves.`; }
  else if (churnPct < 15) { tone = "good"; headline = `Holds. You end with about ${keep} for every 100 ${world.noun} you start with.`; }
  else if (churnPct < 30) { tone = ""; headline = `Mostly holds, with some bleed: about ${keep} left for every 100 ${world.noun} you start with.`; }
  else if (churnPct < 55) { tone = "warn"; headline = `Erodes. About ${keep} of every 100 ${world.noun} are still with you at the end; the rest are gone.`; }
  else { tone = "bad"; headline = `Walks out. Only about ${keep} of every 100 ${world.noun} remain at the end.`; }

  const tip = r.tippingRound;
  const hasHike = cfg.hikeRound > 0 && cfg.hikeSize >= 8;
  const hasComp = cfg.competitorRound > 0 && cfg.competitorOffer >= 20;
  const thinValue = cfg.valueIndex < 90 || cfg.incidentRound > 0;
  const promoLeak = r.exploitationCost > r.totalRevenue * 0.08;
  let cause: string;
  if (hasComp && (tip === null || Math.abs(tip - cfg.competitorRound) <= 3) && churnPct >= 15)
    cause = `The turning point was the cheaper rival arriving at round ${cfg.competitorRound}. ${world.impulsive ? "This crowd jumps at an instant saving" : "Even customers who weren't deal-hunting felt the pull"}, and ${cfg.friction < 30 ? "with little holding them in place, plenty left." : "switching costs slowed the bleed but didn't stop it."}`;
  else if (hasHike && (tip === null || Math.abs(tip - cfg.hikeRound) <= 4) && churnPct >= 15)
    cause = `The price increase at round ${cfg.hikeRound} did the damage. To these customers a rise stings about ${lam}x as much as the same-size discount would please them, so the ones who keep score started shopping the moment it landed.`;
  else if (thinValue && churnPct >= 15)
    cause = `Thin value read as a broken promise. Once perceived quality slipped below what they were paying for, the score-keepers treated the gap as a loss and left.`;
  else if (promoLeak)
    cause = `The standing discount held some people, but the deal-chasers milked it: a chunk of revenue went to defending churn instead of building loyalty.`;
  else if (churnPct < 15)
    cause = `Nothing shocked them. Steady price, value that matched the promise, and a crowd that doesn't bolt at the first wobble.`;
  else
    cause = `No single shock, just steady attrition as small grievances piled up faster than this crowd would tolerate.`;

  const worst = ARCHETYPES.map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((x) => r.perArch[x.a.key].start > 0).sort((x, y) => y.lost - x.lost)[0];
  let who = "";
  if (!grow && worst && worst.lost > 0.4) who = ` The first out the door were the ${worst.a.name.toLowerCase()} (${Math.round(worst.lost * 100)}% gone), ${GLOSS[worst.a.key]} — the type that goes first whenever anything slips, in any world.`;
  return { tone, headline, analysis: cause + who, keep, grow };
}

// ── Outside view: reference-class band + noise band in one sweep ─────
// Run THIS business across every customer world and several seeds so a
// single "keep 60 of 100" can be read against the full range of how the
// same business fares. Reference-class forecasting (vary the world) and a
// Kahneman noise band (vary the seed) fall out of the same cheap sweep —
// the engine is deterministic and tiny, so this is just more runs.
export const REF_SEEDS = [12345, 222, 777, 4040, 90909, 31337, 56789];

// ── Difficulty (the instructor randomness knob; never a student "seed") ──
// Randomness is exposed as a difficulty setting, the Capsim pattern: a calmer
// market reads moves cleanly, a harsher one mis-reads more often, which both
// hurts outcomes and widens the run-to-run band. It maps to the engine's
// perception-noise term; the word "seed" never reaches the student surface.
export type Difficulty = "calm" | "normal" | "harsh";
export const DIFFICULTY_NOISE: Record<Difficulty, number> = { calm: 0.02, normal: 0.05, harsh: 0.12 };
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  calm: "Calm market", normal: "Normal", harsh: "Harsh market",
};
export const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  calm: "Customers read your moves clearly. Outcomes are steadier.",
  normal: "A realistic amount of misreading and noise.",
  harsh: "Customers misjudge more often. Worse, and more luck-dependent.",
};

export interface RefBand {
  lo: number; mid: number; hi: number;        // keep% across the reference class
  perWorld: Record<string, number>;           // median keep% per world
  spread: number;                             // hi - lo, the width of the band
}

export function referenceBand(biz: BizInput, adv?: AdvOverride): RefBand {
  const perWorld: Record<string, number> = {};
  const all: number[] = [];
  for (const w of WORLDS) {
    const keeps: number[] = [];
    for (const seed of REF_SEEDS) {
      const r = runSimulation(businessToCfg(biz, w, { ...adv, seed }));
      const keep = Math.round((r.endingActive / r.startingActive) * 100);
      keeps.push(keep); all.push(keep);
    }
    keeps.sort((a, b) => a - b);
    perWorld[w.key] = keeps[Math.floor(keeps.length / 2)];
  }
  all.sort((a, b) => a - b);
  const lo = all[0], hi = all[all.length - 1];
  return { lo, hi, mid: all[Math.floor(all.length / 2)], perWorld, spread: hi - lo };
}

// Where one keep% sits in that band, in words a freshman reads without a stats class.
export function placeInBand(keep: number, band: RefBand): string {
  if (band.spread < 8) return "about what it does with any of these crowds";
  const frac = (keep - band.lo) / (band.hi - band.lo || 1);
  if (frac >= 0.75) return "near the best this business does with any crowd";
  if (frac <= 0.25) return "near the worst this business does with any crowd";
  return "middle of the pack for this business";
}

// ── Per-world Monte-Carlo sweep (the headline is a band, not a point) ──
// Run ONE business against ONE customer world across the fixed seed set, so
// the card headline can be "usually about 84, between 78 and 90" instead of a
// single fragile number. The median-seed run is returned as the representative
// roll so the chart, the causal story, and the numbers all match the headline.
// The seed set is fixed and internal; difficulty (noise) is what the instructor
// turns, and a harsher market naturally widens the spread. Engine untouched.
export interface SeedRun { seed: number; cfg: SimConfig; r: SimResult; keep: number }
export interface WorldSweep {
  world: CustomerWorld;
  runs: SeedRun[];          // one per seed, sorted by keep ascending
  median: SeedRun;          // the representative roll (median keep)
  lo: number; mid: number; hi: number;
}

export function sweepWorld(biz: BizInput, world: CustomerWorld, adv?: AdvOverride): WorldSweep {
  const runs: SeedRun[] = REF_SEEDS.map((seed) => {
    const cfg = businessToCfg(biz, world, { ...adv, seed });
    const r = runSimulation(cfg);
    return { seed, cfg, r, keep: Math.round((r.endingActive / r.startingActive) * 100) };
  });
  runs.sort((a, b) => a.keep - b.keep);
  const median = runs[Math.floor(runs.length / 2)];
  return { world, runs, median, lo: runs[0].keep, mid: median.keep, hi: runs[runs.length - 1].keep };
}

// The band, said in plain words. Leads with "out of 100", names the typical
// outcome and the luck range, and only states a range when it's wide enough to
// matter. Tone tracks the typical (median) outcome, not a single lucky roll.
export function bandPhrase(world: CustomerWorld, s: WorldSweep): { tone: Layman["tone"]; text: string } {
  const { mid, lo, hi } = s;
  const churn = 100 - mid;
  const grow = mid >= 100;
  let tone: Layman["tone"];
  if (grow || churn < 15) tone = "good";
  else if (churn < 30) tone = "";
  else if (churn < 55) tone = "warn";
  else tone = "bad";
  const wide = hi - lo > 4;
  const range = wide ? ` Across many runs it lands between ${lo} and ${hi}.` : "";
  let lead: string;
  if (grow) lead = `Grows. Start with 100 ${world.noun} and you usually end with about ${mid} — word of mouth more than replaces who leaves.`;
  else if (churn < 15) lead = `Holds. Out of every 100 ${world.noun}, you usually keep about ${mid}.`;
  else if (churn < 30) lead = `Mostly holds. About ${mid} of every 100 ${world.noun} stay, the rest drift off.`;
  else if (churn < 55) lead = `Erodes. You usually end with about ${mid} of every 100 ${world.noun}; the rest leave.`;
  else lead = `Walks out. Only about ${mid} of every 100 ${world.noun} are still with you at the end.`;
  return { tone, text: lead + range };
}

// ── Fermi / lifetime-value sanity read on the existing result ────────
// Honest and unit-free: the input layer never captured a real dollar price,
// so value is stated in "rounds of full price per starting customer" rather
// than invented money. Names the promo leak when it is material.
export function unitEconomics(cfg: SimConfig, r: SimResult): string {
  const perCust = r.totalRevenue / (r.startingActive || 1) / (cfg.priceIndex || 100);
  let s = `Each starting customer brought in about ${perCust.toFixed(1)} rounds of full-price revenue over the ${cfg.rounds}-round run.`;
  if (r.exploitationCost > r.totalRevenue * 0.08) {
    const leak = Math.round((r.exploitationCost / r.totalRevenue) * 100);
    s += ` Roughly ${leak}% of revenue leaked straight back out defending churn with the promo.`;
  }
  return s;
}

// ── Teaching prompt: drives a one-lever A/B by hand (the assignment hook) ──
const PRICE_DESC: Record<PriceMove, string> = { cut: "cut prices to compete", hold: "hold prices steady", raiseS: "raise prices a little", raiseB: "raise prices sharply" };
const COUNTER: Record<PriceMove, string> = { cut: "hold price instead of cutting", hold: "raise price a little", raiseS: "hold price and lean on your retention play instead", raiseB: "hold price and lean on your retention play instead" };
const RET_DESC: Record<Retention, string> = { none: "no special way to keep them", loyalty: "loyalty rewards", lockin: "a lock-in contract", promo: "a standing promo" };

export function teachingPrompt(biz: BizInput, worlds: CustomerWorld[], lambda = 2.25): string {
  const a = [...worlds].sort((x, y) => y.presentBias - x.presentBias)[0];
  const b = [...worlds].sort((x, y) => x.presentBias - y.presentBias)[0];
  const pair = worlds.length >= 2 && a.key !== b.key
    ? `how the ${a.name.toLowerCase()} react versus the ${b.name.toLowerCase()}`
    : `how this crowd reacts`;
  return `You set this business to ${PRICE_DESC[biz.price]} with ${RET_DESC[biz.retention]}. Run it as is, then change one thing — ${COUNTER[biz.price]} — and run it again. Compare ${pair}. Which customer world punishes the move hardest, and what does loss aversion (at the current setting, a loss feels about ${lambda.toFixed(2)}× as heavy as the same-size gain) say about why?`;
}

// ── Finance read: optional unit economics on the frozen engine ───────
// Opt-in. The engine's per-round `revenue` is in price-index points (full
// price = priceIndex, 100 at launch). The student supplies the launch
// price in dollars, a gross margin, an optional CAC, and a per-round
// discount rate; this reads the existing result into cohort LTV, NPV, and
// CAC payback. Nothing here touches sim.ts — it only converts and discounts
// numbers the engine already produced. Off (returns on:false) until a real
// launch price is entered, so the default freshman path stays unit-free.
export interface FinanceInput {
  launchPrice: number;   // $ at price-index 100 (0 ⇒ finance off)
  marginPct: number;     // gross margin %, 0..100
  cac: number;           // acquisition cost per customer, $ (0 ⇒ unknown)
  discountPct: number;   // discount rate % PER ROUND (0 ⇒ undiscounted)
}

export interface FinanceRead {
  on: boolean;
  grossPerStart: number;        // $ revenue (net of promo) per starting customer
  contribPerStart: number;      // $ gross-margin contribution per starting customer
  npvPerStart: number;          // $ discounted contribution per starting customer
  promoLeak: number;            // $ leaked defending churn (0 when immaterial)
  ltvCac: number | null;        // NPV contribution : CAC
  paybackRound: number | null;  // first round cumulative discounted contrib/cust ≥ CAC
}

export function financeRead(cfg: SimConfig, r: SimResult, fin: FinanceInput): FinanceRead {
  const on = !!fin.launchPrice && fin.launchPrice > 0;
  const toUSD = (points: number) => points * (fin.launchPrice / 100);
  const m = Math.max(0, Math.min(100, fin.marginPct)) / 100;
  const d = Math.max(0, fin.discountPct) / 100;
  const start = r.startingActive || 1;

  const grossPerStart = toUSD(r.totalRevenue) / start;
  const contribPerStart = grossPerStart * m;

  let npvTotal = 0, cum = 0;
  let paybackRound: number | null = null;
  for (const rd of r.rounds) {
    const disc = (toUSD(rd.revenue) * m) / Math.pow(1 + d, rd.round);
    npvTotal += disc;
    cum += disc;
    if (paybackRound === null && fin.cac > 0 && cum / start >= fin.cac) paybackRound = rd.round;
  }
  const npvPerStart = npvTotal / start;
  const promoLeak = r.exploitationCost > r.totalRevenue * 0.08 ? toUSD(r.exploitationCost) : 0;
  const ltvCac = fin.cac > 0 ? npvPerStart / fin.cac : null;

  return { on, grossPerStart, contribPerStart, npvPerStart, promoLeak, ltvCac, paybackRound };
}

// ── Finance, BANDED across the seed set (so it reads like everything else) ──
// financeRead is a point read on one roll. But the headline, the band strip
// and the A/B bars are all luck-bands, and a lone one-decimal LTV:CAC printed
// next to them invites exactly the third-digit reading the tool warns against.
// So read finance across the SAME REF_SEEDS already computed in the sweep and
// report each figure as a typical run (median) with its luck range. Pure:
// reuses sweep.runs, touches no engine state.
export interface BandStat { lo: number; mid: number; hi: number }
const bandOf = (xs: number[]): BandStat => {
  const s = [...xs].sort((a, b) => a - b);
  return { lo: s[0], mid: s[Math.floor(s.length / 2)], hi: s[s.length - 1] };
};

export interface FinanceBand {
  world: CustomerWorld;
  on: boolean;
  cacKnown: boolean;
  gross: BandStat;
  contrib: BandStat;
  npv: BandStat;
  ltvCac: BandStat | null;     // null when CAC unknown
  payback: BandStat | null;    // in rounds; null when CAC unknown or never pays back on any roll
  paybackNever: boolean;       // at least one roll never pays back
  promoLeak: number;           // median leak $, 0 when immaterial
}

export function financeBand(sweep: WorldSweep, fin: FinanceInput): FinanceBand {
  const reads = sweep.runs.map((sr) => financeRead(sr.cfg, sr.r, fin));
  const cacKnown = fin.cac > 0;
  const ltvVals = reads.map((x) => x.ltvCac).filter((v): v is number => v !== null);
  const payVals = reads.map((x) => x.paybackRound).filter((v): v is number => v !== null);
  const leaks = reads.map((x) => x.promoLeak).filter((v) => v > 0);
  return {
    world: sweep.world,
    on: reads[0]?.on ?? false,
    cacKnown,
    gross: bandOf(reads.map((x) => x.grossPerStart)),
    contrib: bandOf(reads.map((x) => x.contribPerStart)),
    npv: bandOf(reads.map((x) => x.npvPerStart)),
    ltvCac: cacKnown && ltvVals.length ? bandOf(ltvVals) : null,
    payback: cacKnown && payVals.length ? bandOf(payVals) : null,
    paybackNever: cacKnown && reads.some((x) => x.paybackRound === null),
    promoLeak: leaks.length ? bandOf(leaks).mid : 0,
  };
}

// ── Shareable seeded run-link (the grading / answer-key primitive) ───
// Encode a whole displayed run — business levers, the chosen customer
// worlds, difficulty, λ, rounds, and the optional finance inputs — into a
// URL-safe token, stamped with ENGINE_VERSION. Opening the link re-runs the
// frozen engine on those inputs, so a graded result reproduces exactly
// against a KNOWN engine; if the reader's engine differs, the version stamp
// surfaces the mismatch instead of silently returning a different answer.
// No raw seed travels: the headline band comes from the fixed internal
// REF_SEEDS, which the engine version pins. Pure and client-safe.
export interface RunLinkState {
  biz: BizInput;
  bizB: BizInput;
  compare: boolean;
  fragility: boolean;
  selected: Record<string, boolean>;
  adv: { rounds: number; lossAversion: number; difficulty: Difficulty };
  fin: FinanceInput;
}
export interface DecodedRunLink {
  state: RunLinkState;
  engineVersion: string;   // the engine the link was authored against
  linkVersion: number;     // token schema version
}

const LINK_SCHEMA = 1;
const PRICES: PriceMove[] = ["cut", "hold", "raiseS", "raiseB"];
const VALUES: ValuePosture[] = ["premium", "par", "thin"];
const RETENTIONS: Retention[] = ["none", "loyalty", "lockin", "promo"];
const THREATS: Threat[] = ["none", "mild", "hard"];
const DIFFS: Difficulty[] = ["calm", "normal", "harsh"];

// Tokens are lz-string (compressToEncodedURIComponent): synchronous, URI-safe
// output, deterministic, and the de-facto standard for state-in-URL. It beats
// hand-rolled base64url at every size (a small run ~17% smaller, a long pasted
// model 3-4x smaller). New tokens carry a leading codec marker "1"; the raw
// base64url path below is kept only to decode any pre-compression link.
const CODEC_LZ = "1";

// base64url → bytes, kept for legacy (pre-compression) tokens only.
function b64urlToBytes(token: string): Uint8Array {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (token.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeRunLink(s: RunLinkState): string {
  const enc = (z: BizInput) => ({
    n: z.name, s: z.sell, m: z.model?.trim() || undefined,
    p: z.price, q: z.value, r: z.retention, t: z.threat,
  });
  const payload = {
    v: LINK_SCHEMA,
    e: ENGINE_VERSION,
    b: enc(s.biz),
    c: s.compare ? 1 : 0,
    fr: s.fragility ? 1 : 0,
    bb: s.compare ? enc(s.bizB) : undefined,
    w: WORLDS.filter((w) => s.selected[w.key]).map((w) => w.key),
    a: { r: s.adv.rounds, l: s.adv.lossAversion, d: s.adv.difficulty },
    f: s.fin.launchPrice > 0
      ? { lp: s.fin.launchPrice, mp: s.fin.marginPct, c: s.fin.cac, dp: s.fin.discountPct }
      : undefined,
  };
  return CODEC_LZ + compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeRunLink(token: string): DecodedRunLink | null {
  try {
    let json: string | null;
    if (token[0] === CODEC_LZ) json = decompressFromEncodedURIComponent(token.slice(1));
    else json = new TextDecoder().decode(b64urlToBytes(token)); // legacy raw base64url
    if (!json) return null;
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== "object") return null;
    const pick = <T,>(allowed: readonly T[], v: unknown, fb: T): T =>
      (allowed as readonly unknown[]).includes(v) ? (v as T) : fb;
    const decBiz = (o: unknown): BizInput => {
      const z = (o ?? {}) as Record<string, unknown>;
      return {
        name: typeof z.n === "string" ? z.n : "",
        sell: typeof z.s === "string" ? z.s : "",
        model: typeof z.m === "string" ? z.m : undefined,
        price: pick(PRICES, z.p, "hold"),
        value: pick(VALUES, z.q, "par"),
        retention: pick(RETENTIONS, z.r, "none"),
        threat: pick(THREATS, z.t, "none"),
      };
    };
    const biz = decBiz(raw.b);
    const compare = raw.c === 1 || raw.c === true;
    const fragility = raw.fr === 1 || raw.fr === true;
    const bizB = raw.bb ? decBiz(raw.bb) : { name: "", sell: "", price: "hold" as PriceMove, value: "par" as ValuePosture, retention: "none" as Retention, threat: "none" as Threat };

    const wkeys = new Set(WORLDS.map((w) => w.key));
    const selected: Record<string, boolean> = {};
    if (Array.isArray(raw.w)) {
      for (const k of raw.w) if (typeof k === "string" && wkeys.has(k)) selected[k] = true;
    } else {
      selected.mainstream = true; selected.fickle = true; selected.loyal = true;
    }

    const a = (raw.a ?? {}) as Record<string, unknown>;
    const adv = {
      rounds: clampInt(a.r, 10, 80, 40),
      lossAversion: clampNum(a.l, 1, 3.5, 2.25),
      difficulty: pick(DIFFS, a.d, "normal" as Difficulty),
    };

    const f = (raw.f ?? null) as Record<string, unknown> | null;
    const fin: FinanceInput = f
      ? {
          launchPrice: clampNum(f.lp, 0, 1e9, 0),
          marginPct: clampNum(f.mp, 0, 100, 60),
          cac: clampNum(f.c, 0, 1e9, 0),
          discountPct: clampNum(f.dp, 0, 100, 1),
        }
      : { launchPrice: 0, marginPct: 60, cac: 0, discountPct: 1 };

    return {
      state: { biz, bizB, compare, fragility, selected, adv, fin },
      engineVersion: typeof raw.e === "string" ? raw.e : "unknown",
      linkVersion: typeof raw.v === "number" ? raw.v : 0,
    };
  } catch {
    return null;
  }
}

function clampNum(v: unknown, lo: number, hi: number, fb: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fb;
}
function clampInt(v: unknown, lo: number, hi: number, fb: number): number {
  return Math.round(clampNum(v, lo, hi, fb));
}


// ── Two-business A/B compare + worst-case inversion finder ───────────
// Same customers, two strategies. For each chosen world, sweep BOTH
// businesses (reusing sweepWorld) and compare their typical-run bands. The
// payoff is the inversion: a world where the per-world winner contradicts the
// overall winner, i.e. "A keeps more on average, but with THIS crowd B wins."
// That is the reference-class lesson made concrete — the better plan can
// depend on who the customers are, not on the plan alone. Engine untouched.
export type Side = "a" | "b" | "tie";
export interface WorldCompare {
  world: CustomerWorld;
  a: WorldSweep;
  b: WorldSweep;
  winner: Side;
  gap: number;            // |a.mid − b.mid|, in kept-per-100
}
export interface CompareResult {
  perWorld: WorldCompare[];
  overall: Side;
  overallGap: number;     // |avg(a.mid) − avg(b.mid)|
  inversion: WorldCompare | null;  // strongest world that bucks the overall winner
  summary: string;
}

const TIE_BAND = 3;       // within 3 kept-per-100 is a wash, not a winner
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const sideName = (s: Side, a: string, b: string) => (s === "a" ? a : s === "b" ? b : "neither");

export function compareBusinesses(a: BizInput, b: BizInput, worlds: CustomerWorld[], adv?: AdvOverride): CompareResult {
  const perWorld: WorldCompare[] = worlds.map((w) => {
    const sa = sweepWorld(a, w, adv);
    const sb = sweepWorld(b, w, adv);
    const d = sa.mid - sb.mid;
    const winner: Side = Math.abs(d) < TIE_BAND ? "tie" : d > 0 ? "a" : "b";
    return { world: w, a: sa, b: sb, winner, gap: Math.abs(d) };
  });

  const avgA = mean(perWorld.map((x) => x.a.mid));
  const avgB = mean(perWorld.map((x) => x.b.mid));
  const od = avgA - avgB;
  const overall: Side = Math.abs(od) < TIE_BAND ? "tie" : od > 0 ? "a" : "b";
  const overallGap = Math.abs(Math.round(od));

  // Inversion: a world whose winner is the OPPOSITE side from the overall winner
  // (ties don't count as a flip). The widest such gap is the headline inversion.
  const inversion = overall === "tie" ? null
    : perWorld
        .filter((x) => x.winner !== "tie" && x.winner !== overall)
        .sort((p, q) => q.gap - p.gap)[0] ?? null;

  const an = a.name || "Business A";
  const bn = b.name || "Business B";
  let summary: string;
  if (overall === "tie") {
    summary = `Across the crowds you picked, ${an} and ${bn} end up about even (within a few customers per 100). Look world by world below — the averages hide where each one pulls ahead.`;
  } else {
    const win = sideName(overall, an, bn);
    summary = `Overall, ${win} keeps more across the crowds you picked, by about ${overallGap} per 100 on the typical run.`;
    if (inversion) {
      const flipWin = sideName(inversion.winner, an, bn);
      summary += ` But it isn't that simple: with ${inversion.world.name.toLowerCase()}, ${flipWin} actually wins by about ${Math.round(inversion.gap)}. Same two businesses, opposite answer — the better plan depends on who your customers are.`;
    } else {
      summary += ` And it holds up: ${win} wins or ties in every crowd you picked, so the ranking is robust.`;
    }
  }
  return { perWorld, overall, overallGap, inversion, summary };
}


// ── Per-round CSV export (raw engine rows; the answer-key data dump) ──
// Flattens the representative (median) run of each swept world into one CSV:
// the engine's per-round RoundMetric rows, prefixed with the world they came
// from. This is the displayed result's underlying data, so a professor can
// load it into a spreadsheet, build a problem set, and check students'
// reading against the same numbers the cards show. Pure: reads sweeps the UI
// already computed, touches no engine state. Median run, to match the chart
// and headline rather than a luckier or unluckier roll.
const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function runsToCsv(sweeps: WorldSweep[]): string {
  const header = [
    "world", "round", "active", "churned_this_round", "exploiting",
    "revenue_index", "reputation", "churn_rate",
  ];
  const lines = [header.join(",")];
  for (const s of sweeps) {
    for (const m of s.median.r.rounds) {
      lines.push([
        csvCell(s.world.name),
        m.round,
        m.active,
        m.churnedThisRound,
        m.exploiting,
        Math.round(m.revenue * 100) / 100,
        m.reputation,
        Math.round(m.churnRate * 1000) / 1000,
      ].join(","));
    }
  }
  return lines.join("\n");
}


// ── Within-world single-lever fragility sweep ────────────────────────
// Hold ONE customer world fixed and ask: how close is this business to a
// different verdict? Enumerate every single-lever change to the four
// business moves (each lever to each of its OTHER allowed values, the rest
// held), re-sweep with the same seed set, and find the changes that cross a
// verdict-tone boundary. The "lightest" flip is the one whose new band-mid
// lands closest to the line it crosses — the smallest nudge that still tips
// the verdict, i.e. the most fragile trigger. If nothing flips, the business
// is robust in that world. Reuses sweepWorld + bandPhrase, so tone matches
// the cards exactly. Engine untouched; this is just more runs.
export type VerdictTone = Layman["tone"];           // "" | "good" | "warn" | "bad"
const TONE_RANK: Record<string, number> = { bad: 0, warn: 1, "": 2, good: 3 };
const LEVER_NOUN: Record<LeverKey, string> = {
  price: "price move", value: "value level",
  retention: "retention play", threat: "competitive threat",
};
function optLabel(lever: LeverKey, v: string): string {
  const f = FIELDS.find((x) => x.key === lever);
  return f?.opts.find((o) => o.v === v)?.t ?? v;
}

export interface LeverFlip {
  lever: LeverKey;
  leverNoun: string;
  fromLabel: string;
  toLabel: string;
  mid: number;            // new band mid (kept per 100)
  tone: VerdictTone;
  delta: number;          // mid − baselineMid (signed)
  improves: boolean;      // tone class moved up vs baseline
}
export interface FragilityResult {
  world: CustomerWorld;
  baselineMid: number;
  baselineTone: VerdictTone;
  flips: LeverFlip[];           // every single-lever change that flips the tone class
  lightest: LeverFlip | null;   // smallest |delta| among flips: the most fragile trigger
  totalVariants: number;        // how many single-lever changes were tried
  robust: boolean;              // no single-lever change flips the verdict
}

export function fragilityScan(biz: BizInput, world: CustomerWorld, adv?: AdvOverride): FragilityResult {
  const base = sweepWorld(biz, world, adv);
  const baselineMid = base.mid;
  const baselineTone = bandPhrase(world, base).tone;
  const baseRank = TONE_RANK[baselineTone];

  const levers: LeverKey[] = ["price", "value", "retention", "threat"];
  const flips: LeverFlip[] = [];
  let totalVariants = 0;

  for (const lever of levers) {
    const field = FIELDS.find((f) => f.key === lever);
    if (!field) continue;
    for (const opt of field.opts) {
      if (opt.v === biz[lever]) continue;      // a real change only
      totalVariants++;
      const variant: BizInput = { ...biz, [lever]: opt.v };
      const sw = sweepWorld(variant, world, adv);
      const tone = bandPhrase(world, sw).tone;
      const rank = TONE_RANK[tone];
      if (rank !== baseRank) {
        flips.push({
          lever, leverNoun: LEVER_NOUN[lever],
          fromLabel: optLabel(lever, biz[lever]),
          toLabel: opt.t,
          mid: sw.mid, tone,
          delta: sw.mid - baselineMid,
          improves: rank > baseRank,
        });
      }
    }
  }

  // Lightest = the flip that crosses a verdict line by the least: the smallest
  // band-mid move that still changes the tone class. Ties break toward the
  // smaller |delta| then the bigger absolute mid (closer to a "holds" read).
  const lightest = flips.length
    ? [...flips].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || b.mid - a.mid)[0]
    : null;

  return {
    world, baselineMid, baselineTone,
    flips, lightest, totalVariants,
    robust: flips.length === 0,
  };
}

// One plain sentence per world for the fragility block.
export function fragilityPhrase(f: FragilityResult): string {
  if (f.robust) {
    return `Robust here: no single change to one move flips the verdict. Every one-lever tweak (of ${f.totalVariants} tried) leaves it in the same band.`;
  }
  const lf = f.lightest!;
  const dir = lf.improves ? "up to a better verdict" : "down to a worse one";
  const verb = lf.improves ? "rescues" : "breaks";
  return `One move from a different verdict. The lightest flip ${verb} it: change ${lf.leverNoun} from "${lf.fromLabel}" to "${lf.toLabel}" and the typical run moves ${dir} (about ${f.baselineMid} → ${lf.mid} per 100). ${f.flips.length} of ${f.totalVariants} single-lever changes flip it.`;
}
