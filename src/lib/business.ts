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
  type SimConfig,
  type SimResult,
  type StratKey,
} from "./sim";

export type PriceMove = "cut" | "hold" | "raiseS" | "raiseB";
export type ValuePosture = "premium" | "par" | "thin";
export type Retention = "none" | "loyalty" | "lockin" | "promo";
export type Threat = "none" | "mild" | "hard";

export interface BizInput {
  name: string;
  sell: string;
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
export interface Field { key: keyof BizInput; q: string; opts: FieldOpt[] }

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
  if (grow) { tone = "good"; headline = `Grows. Start with 100 ${world.noun} and you'd have about ${keep} — word of mouth more than replaces who leaves.`; }
  else if (churnPct < 15) { tone = "good"; headline = `Holds. About ${keep} of every 100 ${world.noun} stay.`; }
  else if (churnPct < 30) { tone = ""; headline = `Mostly holds, with some bleed: about ${keep} of every 100 ${world.noun} stay.`; }
  else if (churnPct < 55) { tone = "warn"; headline = `Erodes. You keep about ${keep} of every 100 ${world.noun}, and lose the rest.`; }
  else { tone = "bad"; headline = `Walks out. Only about ${keep} of every 100 ${world.noun} are still with you at the end.`; }

  const tip = r.tippingRound;
  const hasHike = cfg.hikeRound > 0 && cfg.hikeSize >= 8;
  const hasComp = cfg.competitorRound > 0 && cfg.competitorOffer >= 20;
  const thinValue = cfg.valueIndex < 90 || cfg.incidentRound > 0;
  const promoLeak = r.exploitationCost > r.totalRevenue * 0.08;
  let cause: string;
  if (hasComp && (tip === null || Math.abs(tip - cfg.competitorRound) <= 3) && churnPct >= 15)
    cause = `The turning point was the cheaper rival arriving at round ${cfg.competitorRound}. ${world.impulsive ? "This crowd jumps at an instant saving" : "Even this steadier crowd felt the pull"}, and ${cfg.friction < 30 ? "with little holding them in place, plenty left." : "switching costs slowed the bleed but didn't stop it."}`;
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
  if (worst && worst.lost > 0.4) who = ` The first out the door were the ${worst.a.name.toLowerCase()} (${Math.round(worst.lost * 100)}% gone), ${GLOSS[worst.a.key]}. That's the lever to pull first.`;
  return { tone, headline, analysis: cause + who, keep, grow };
}

// ── Teaching prompt: drives a one-lever A/B by hand (the assignment hook) ──
const PRICE_DESC: Record<PriceMove, string> = { cut: "cut prices to compete", hold: "hold prices steady", raiseS: "raise prices a little", raiseB: "raise prices sharply" };
const COUNTER: Record<PriceMove, string> = { cut: "hold price instead of cutting", hold: "raise price a little", raiseS: "hold price and lean on your retention play instead", raiseB: "hold price and lean on your retention play instead" };
const RET_DESC: Record<Retention, string> = { none: "no special way to keep them", loyalty: "loyalty rewards", lockin: "a lock-in contract", promo: "a standing promo" };

export function teachingPrompt(biz: BizInput, worlds: CustomerWorld[]): string {
  const a = [...worlds].sort((x, y) => y.presentBias - x.presentBias)[0];
  const b = [...worlds].sort((x, y) => x.presentBias - y.presentBias)[0];
  const pair = worlds.length >= 2 && a.key !== b.key
    ? `how the ${a.name.toLowerCase()} react versus the ${b.name.toLowerCase()}`
    : `how this crowd reacts`;
  return `You set this business to ${PRICE_DESC[biz.price]} with ${RET_DESC[biz.retention]}. Run it as is, then change one thing — ${COUNTER[biz.price]} — and run it again. Compare ${pair}. Which customer world punishes the move hardest, and what does loss aversion (a loss feels about twice as heavy as the same-size gain) say about why?`;
}
