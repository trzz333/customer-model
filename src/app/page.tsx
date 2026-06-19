"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  runSimulation,
  verdict,
  ARCHETYPES,
  ENGINE_VERSION,
  type SimConfig,
  type SimResult,
  type StratKey,
} from "@/lib/sim";
import {
  FIELDS,
  EXAMPLES,
  WORLDS,
  businessToCfg,
  laymanAnalysis,
  teachingPrompt,
  referenceBand,
  placeInBand,
  unitEconomics,
  financeBand,
  sweepWorld,
  bandPhrase,
  compareBusinesses,
  runsToCsv,
  fragilityScan,
  fragilityPhrase,
  TERM_DEFS,
  ARCH_DEF,
  DIFFICULTY_NOISE,
  DIFFICULTY_LABEL,
  DIFFICULTY_NOTE,
  encodeRunLink,
  decodeRunLink,
  runLinkReproducesExactly,
  type Difficulty,
  type BizInput,
  type CustomerWorld,
  type Layman,
  type FinanceInput,
  type WorldSweep,
  type CompareResult,
  type FragilityResult,
} from "@/lib/business";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const DIFFS: Difficulty[] = ["calm", "normal", "harsh"];

// Banded finance cells: a "~" median with the luck range only when it's wide
// enough to matter, so the finance table reads like the rest of the page
// (typical run plus spread) instead of a lone precise-looking number.
type Band = { lo: number; mid: number; hi: number };
const money$ = (b: Band) =>
  b.hi - b.lo >= 1
    ? <>~${fmt(b.mid)} <span className="text-muted-fg font-normal">(${fmt(b.lo)}–${fmt(b.hi)})</span></>
    : <>~${fmt(b.mid)}</>;
const ltvCell = (b: Band) =>
  b.hi - b.lo >= 0.2
    ? <>~{b.mid.toFixed(1)}× <span className="text-muted-fg font-normal">({b.lo.toFixed(1)}–{b.hi.toFixed(1)})</span></>
    : <>~{b.mid.toFixed(1)}×</>;
const paybackCell = (b: Band | null, never: boolean): string => {
  if (!b) return never ? "never" : "—";
  const core = b.hi > b.lo ? `r${b.mid} (r${b.lo}–r${b.hi})` : `r${b.mid}`;
  return never ? `${core}, some never` : core;
};

// First sentence of a paste, collapsed to one line for the snapshot card.
function snapshot(text: string): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(/^.*?[.!?](\s|$)/);
  let s = m ? m[0].trim() : t;
  if (s.length > 96) s = s.slice(0, 96).trimEnd() + "…";
  else if (!m) s = s + "…";
  return s;
}

// ── Plain-language term with an 8th-grade hover (desktop) + tap (mobile) ──
// The word prints fine; the popover is no-print. title= covers hover, the
// click toggle covers touch where there is no hover.
function Term({ children, def }: { children: React.ReactNode; def: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button type="button" title={def} onClick={() => setOpen((o) => !o)}
        className="cursor-help underline decoration-dotted decoration-muted-fg/70 underline-offset-2 text-foreground">
        {children}
      </button>
      {open && (
        <span className="no-print absolute z-30 left-0 top-full mt-1 w-56 rounded-lg border border-card-border bg-card px-3 py-2 text-xs leading-snug text-muted-fg shadow-xl">
          {def}
        </span>
      )}
    </span>
  );
}
const DEF = TERM_DEFS;

interface EventMark { round: number; label: string; color: string }
function buildEvents(cfg: SimConfig): EventMark[] {
  const ev: EventMark[] = [];
  if (cfg.hikeRound > 0) ev.push({ round: cfg.hikeRound, label: "hike", color: "var(--color-warn)" });
  if (cfg.incidentRound > 0) ev.push({ round: cfg.incidentRound, label: "incident", color: "var(--color-bad)" });
  if (cfg.competitorRound > 0) ev.push({ round: cfg.competitorRound, label: "rival", color: "var(--color-mixed)" });
  return ev;
}

// ── Hand-rolled SVG chart (no recharts), compact two-panel ───────────
function SimChart({ result, events }: { result: SimResult; events: EventMark[] }) {
  const rounds = result.rounds;
  const n = rounds.length;
  if (n === 0) return null;
  const W = 720, padL = 40, padR = 12, plotW = W - padL - padR;
  const hA = 140, hB = 92, gap = 22, axisH = 16, totalH = hA + gap + hB + axisH;
  const lastR = n - 1;
  const x = (i: number) => padL + (n === 1 ? 0 : (i / lastR) * plotW);
  const maxActive = Math.max(result.startingActive, ...rounds.map((r) => r.active)) || 1;
  const yA = (v: number) => 8 + (hA - 16) * (1 - v / maxActive);
  const yB0 = hA + gap;
  const yB = (v: number) => yB0 + 6 + (hB - 12) * (1 - v / 160);
  const maxChurn = Math.max(1, ...rounds.map((r) => r.churnedThisRound));
  const barW = Math.max(1, plotW / n - 1);
  const line = rounds.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yA(r.active).toFixed(1)}`).join(" ");
  const area = `M${x(0).toFixed(1)},${yA(rounds[0].active).toFixed(1)} ` +
    rounds.map((r, i) => `L${x(i).toFixed(1)},${yA(r.active).toFixed(1)}`).join(" ") +
    ` L${x(lastR).toFixed(1)},${(hA - 8).toFixed(1)} L${x(0).toFixed(1)},${(hA - 8).toFixed(1)} Z`;
  const repLine = rounds.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yB(r.reputation).toFixed(1)}`).join(" ");
  const tip = result.tippingRound;
  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full h-auto" role="img" aria-label="Active customers, reputation, and churn per round">
      {[0.5, 1].map((f) => (
        <line key={`g${f}`} x1={padL} x2={W - padR} y1={yA(maxActive * f)} y2={yA(maxActive * f)} stroke="var(--color-card-border)" strokeWidth={1} opacity={0.5} />
      ))}
      <text x={2} y={yA(maxActive) + 4} fontSize={9} fill="var(--color-muted-fg)">{fmt(maxActive)}</text>
      <text x={2} y={yA(0)} fontSize={9} fill="var(--color-muted-fg)">0</text>
      <text x={padL} y={yA(maxActive) - 3} fontSize={10} fill="var(--color-primary-light)" fontWeight={600}>Active customers</text>
      {events.map((e) => (
        <g key={`eA${e.label}`}>
          <line x1={x(e.round)} x2={x(e.round)} y1={6} y2={hA - 8} stroke={e.color} strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
          <text x={x(e.round) + 3} y={14} fontSize={8.5} fill={e.color}>{e.label}</text>
        </g>
      ))}
      {tip !== null && <line x1={x(tip)} x2={x(tip)} y1={6} y2={hA - 8} stroke="var(--color-bad)" strokeWidth={1.5} opacity={0.9} />}
      <path d={area} fill="var(--color-primary)" opacity={0.16} />
      <path d={line} fill="none" stroke="var(--color-primary-light)" strokeWidth={2} />
      <line x1={padL} x2={W - padR} y1={yB(100)} y2={yB(100)} stroke="var(--color-card-border)" strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
      <text x={2} y={yB(100) + 3} fontSize={8.5} fill="var(--color-muted-fg)">rep</text>
      <text x={padL} y={yB0 + 1} fontSize={10} fill="var(--color-researcher)" fontWeight={600}>Reputation</text>
      <text x={W - padR} y={yB0 + 1} fontSize={10} fill="var(--color-muted-fg)" textAnchor="end">churn/round</text>
      {rounds.map((r, i) => {
        const h = (r.churnedThisRound / maxChurn) * (hB - 14);
        return <rect key={`cb${i}`} x={x(i) - barW / 2} y={yB0 + (hB - 8) - h} width={barW} height={Math.max(0, h)} fill="var(--color-bad)" opacity={0.32} />;
      })}
      {tip !== null && (
        <g>
          <line x1={x(tip)} x2={x(tip)} y1={yB0} y2={yB0 + hB - 8} stroke="var(--color-bad)" strokeWidth={1.5} opacity={0.9} />
          <text x={x(tip) + 3} y={yB0 + hB + 12} fontSize={8.5} fill="var(--color-bad)">tipping r{tip}</text>
        </g>
      )}
      <path d={repLine} fill="none" stroke="var(--color-researcher)" strokeWidth={2} />
      {[0, Math.floor(lastR / 2), lastR].map((i) => (
        <text key={`x${i}`} x={x(i)} y={totalH - 3} fontSize={9} fill="var(--color-muted-fg)" textAnchor="middle">r{rounds[i].round}</text>
      ))}
    </svg>
  );
}

interface Warning { label: string; tone: "bad" | "warn"; archKey?: StratKey; archName?: string; archSuffix?: string; def?: string; lead?: string; tail?: string }
function deriveWarnings(cfg: SimConfig, r: SimResult): Warning[] {
  const w: Warning[] = [];
  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
  if (churnPct >= 60) w.push({ label: `Bleed-out: ~${churnPct}% lost`, tone: "bad" });
  else if (churnPct >= 30) w.push({ label: `Erosion: ~${churnPct}% lost`, tone: "warn" });
  if (r.tippingRound !== null) w.push({ label: `Tipping point at round ${r.tippingRound}`, tone: "bad" });
  if (r.exploitationCost > r.totalRevenue * 0.08) w.push({ label: "Promo margin leak", tone: "warn" });
  if (r.minReputation < 70) w.push({ label: `Reputation rot to ${Math.round(r.minReputation)}`, tone: "warn", def: DEF.reputation, lead: "Reputation", tail: `rot to ${Math.round(r.minReputation)}` });
  const worst = ARCHETYPES.map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((x) => r.perArch[x.a.key].start > 0).sort((p, q) => q.lost - p.lost)[0];
  if (worst && worst.lost > 0.5) w.push({ label: `${worst.a.name} ${Math.round(worst.lost * 100)}% gone`, tone: "bad", archKey: worst.a.key, archName: worst.a.name, archSuffix: `${Math.round(worst.lost * 100)}% gone` });
  return w;
}

// ── small primitives ─────────────────────────────────────────────────
function OptionGroup({ value, opts, onChange }: { value: string; opts: { v: string; t: string; note?: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {opts.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${value === o.v ? "border-primary bg-primary/10" : "border-card-border bg-card-muted hover:border-primary"}`}>
          {o.t}{o.note ? <span className="block text-xs text-muted-fg mt-0.5">{o.note}</span> : null}
        </button>
      ))}
    </div>
  );
}

function AdvSlider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block mb-2">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-muted-fg">{label}</span>
        <span className="text-xs text-primary-light tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </label>
  );
}

function FinNum({ label, value, min, step, prefix, suffix, onChange }: { label: string; value: number; min?: number; step?: number; prefix?: string; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 mb-2">
      <span className="text-xs text-muted-fg">{label}</span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-fg">
        {prefix}
        <input type="number" value={value} min={min ?? 0} step={step ?? 1}
          onChange={(e) => onChange(Math.max(min ?? 0, parseFloat(e.target.value) || 0))}
          className="w-20 rounded-lg border border-card-border bg-card-muted px-2 py-1 text-sm text-right tabular-nums text-foreground" />
        {suffix}
      </span>
    </label>
  );
}

// ── Band strip: every roll's outcome as a dot on a small track, so the
//    spread is visible at rest and the playing roll lights up while it runs.
function BandStrip({ sweep, activeKeep }: { sweep: WorldSweep; activeKeep: number | null }) {
  const W = 300, H = 30, padX = 8;
  const lo = Math.max(0, sweep.lo - 6), hi = Math.min(140, sweep.hi + 6);
  const xf = (k: number) => padX + ((k - lo) / (hi - lo || 1)) * (W - 2 * padX);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[320px] h-auto" role="img" aria-label="Spread of outcomes across many runs">
      <line x1={xf(sweep.lo)} x2={xf(sweep.hi)} y1={H / 2} y2={H / 2} stroke="var(--color-card-border)" strokeWidth={3} strokeLinecap="round" />
      {sweep.runs.map((r, i) => (
        <circle key={i} cx={xf(r.keep)} cy={H / 2} r={r.keep === activeKeep ? 6 : 3.5}
          fill={r.keep === activeKeep ? "var(--color-primary-light)" : "var(--color-muted-fg)"}
          opacity={r.keep === activeKeep ? 1 : 0.55} />
      ))}
      <circle cx={xf(sweep.mid)} cy={H / 2} r={4.5} fill="none" stroke="var(--color-foreground)" strokeWidth={1.5} opacity={0.8} />
      <text x={xf(sweep.lo)} y={H - 1} fontSize={8.5} fill="var(--color-muted-fg)" textAnchor="middle">{sweep.lo}</text>
      <text x={xf(sweep.hi)} y={H - 1} fontSize={8.5} fill="var(--color-muted-fg)" textAnchor="middle">{sweep.hi}</text>
    </svg>
  );
}

interface CardProps { sweep: WorldSweep; band: ReturnType<typeof referenceBand> | null; exportCharts: boolean; exportNumbers: boolean }
function WorldCard({ sweep, band, exportCharts, exportNumbers }: CardProps) {
  const { world } = sweep;
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  // Play rolls in seed order (luck), not sorted-by-outcome (which would look like a ramp).
  const order = useMemo(() => [...sweep.runs].sort((a, b) => a.seed - b.seed), [sweep]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % order.length), 650);
    return () => clearInterval(id);
  }, [playing, order.length]);
  useEffect(() => { setPlaying(false); setFrame(0); }, [sweep]);

  const shown = playing ? order[frame] : sweep.median;
  const cfg = shown.cfg, r = shown.r;
  const lay = laymanAnalysis(cfg, r, world);
  const phrase = bandPhrase(world, sweep);
  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
  const worst = ARCHETYPES.map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((x) => r.perArch[x.a.key].start > 0).sort((x, y) => y.lost - x.lost)[0];
  const warns = deriveWarnings(cfg, r);
  const toneClass = phrase.tone === "good" ? "text-good" : phrase.tone === "warn" ? "text-warn" : phrase.tone === "bad" ? "text-bad" : "text-foreground";

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 mb-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="text-sm font-bold tracking-wide text-primary-light">{world.name}</span>
        <span className="text-xs text-muted-fg">{world.blurb}</span>
      </div>
      <div className={`text-[19px] font-bold tracking-tight mt-2 mb-1.5 ${toneClass}`}>{phrase.text}</div>
      <p className="text-[14.5px] leading-relaxed mb-3">{lay.analysis}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <BandStrip sweep={sweep} activeKeep={playing ? shown.keep : null} />
        <div className="text-xs text-muted-fg">
          <button onClick={() => setPlaying((p) => !p)}
            className="no-print rounded-full border border-card-border bg-card-muted px-3 py-1 hover:border-primary transition-colors text-foreground">
            {playing ? "■ Stop" : "▶ Watch it play out"}
          </button>
          <span className="ml-2 tabular-nums">{playing ? <>this run ends with <b className="text-foreground">{shown.keep}</b> of 100</> : <>typical run: <b className="text-foreground">{sweep.mid}</b> of 100</>}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-fg mb-3">
        <span>Typically end with <b className="text-foreground">~{sweep.mid}</b> per 100 started</span>
        <span>First to leave: {worst && worst.lost > 0.3 ? <b className="text-foreground"><Term def={ARCH_DEF[worst.a.key]}>{worst.a.name}</Term></b> : <b className="text-foreground">no single segment cracked</b>}</span>
        <span>{r.tippingRound !== null ? <><Term def={DEF.tipping}>Sudden break</Term> at <b className="text-foreground">round {r.tippingRound}</b></> : <>No sudden break, <b className="text-foreground">gradual</b></>}</span>
      </div>
      {band && (
        <p className="text-xs text-muted-fg mb-3 leading-relaxed">
          <b className="text-foreground">Is ~{sweep.mid} good?</b> {placeInBand(sweep.mid, band)} — across every customer world this same business ends with {band.lo}–{band.hi} per 100 started. {unitEconomics(cfg, r)}
        </p>
      )}

      <div className={exportCharts ? "" : "export-hidden"}><SimChart result={r} events={buildEvents(cfg)} /></div>

      <div className="text-xs text-muted-fg border-t border-card-border pt-2.5 mt-2.5 leading-relaxed">
        <b className="text-foreground">Engine verdict:</b> {verdict(cfg, r)}
      </div>
      {warns.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {warns.map((w, i) => (
            <span key={i} className={`text-xs rounded-full px-2.5 py-1 border ${w.tone === "bad" ? "border-bad/40 text-bad bg-bad/10" : "border-warn/40 text-warn bg-warn/10"}`}>{w.archKey ? <><Term def={ARCH_DEF[w.archKey]}>{w.archName}</Term> {w.archSuffix}</> : w.def ? <><Term def={w.def}>{w.lead}</Term> {w.tail}</> : w.label}</span>
          ))}
        </div>
      )}
      <details className={`numbers mt-3 ${exportNumbers ? "" : "export-hidden"}`}>
        <summary className="cursor-pointer text-xs text-primary-light">Show the numbers</summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
          {[[<Term key="c" def={DEF.churn}>Net churn</Term>, `${churnPct}%`], ["Ending / start", `${fmt(r.endingActive)} / ${fmt(r.startingActive)}`], [<Term key="rep" def={DEF.reputation}>Lowest rep.</Term>, `${Math.round(r.minReputation)}`], [<Term key="t" def={DEF.tipping}>Tipping</Term>, r.tippingRound !== null ? `r${r.tippingRound}` : "none"]].map((m, i) => (
            <div key={i} className="rounded-lg border border-card-border bg-card-muted px-3 py-2"><div className="text-xs text-muted-fg">{m[0]}</div><div className="text-base font-semibold tabular-nums">{m[1]}</div></div>
          ))}
        </div>
        <div className="space-y-1.5">
          {ARCHETYPES.map((a) => {
            const pa = r.perArch[a.key]; const sr = pa.start ? pa.survived / pa.start : 0;
            return (
              <div key={a.key} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-xs" style={{ color: a.color }}><Term def={ARCH_DEF[a.key]}>{a.name}</Term></div>
                <div className="flex-1 h-2.5 rounded-full bg-card-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sr * 100}%`, backgroundColor: a.color, opacity: 0.85 }} /></div>
                <div className="w-16 text-right text-xs tabular-nums text-muted-fg"><b className="text-foreground">{Math.round(sr * 100)}%</b> stay</div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

// ── A vs B compare block (always saved; the inversion is a warning-class
//    insight, so it carries no export toggle) ──────────────────────────
function CmpBar({ mid, lo, hi, max, color, win }: { mid: number; lo: number; hi: number; max: number; color: string; win: boolean }) {
  const pct = Math.max(2, Math.min(100, (mid / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 rounded-full bg-card-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: win ? 1 : 0.5 }} />
      </div>
      <div className={`w-28 text-right text-xs tabular-nums ${win ? "text-foreground font-semibold" : "text-muted-fg"}`}>
        ~{mid} <span className="text-muted-fg font-normal">({lo}–{hi})</span>
      </div>
    </div>
  );
}

function CompareBlock({ cmp, nameA, nameB }: { cmp: CompareResult; nameA: string; nameB: string }) {
  const an = nameA || "Business A", bn = nameB || "Business B";
  const winLabel = (s: "a" | "b" | "tie") => (s === "a" ? an : s === "b" ? bn : "Even");
  return (
    <div className="mb-4">
      <div className="rounded-xl border border-primary bg-primary/10 p-5 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">A vs B — the short version</h3>
        <p className="text-[15px] leading-relaxed">{cmp.summary}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-fg">
          <span><span className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" style={{ backgroundColor: "var(--color-primary)" }} />A: <b className="text-foreground">{an}</b></span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" style={{ backgroundColor: "var(--color-researcher)" }} />B: <b className="text-foreground">{bn}</b></span>
        </div>
      </div>
      {cmp.inversion && (
        <div className="rounded-lg border border-warn/50 bg-warn/10 px-4 py-2.5 mb-3 text-xs leading-relaxed text-warn">
          <b>Ranking flips.</b> Overall {winLabel(cmp.overall)} keeps more, but with {cmp.inversion.world.name.toLowerCase()} the winner is {winLabel(cmp.inversion.winner)} by about {Math.round(cmp.inversion.gap)} per 100. A single average would have hidden that.
        </div>
      )}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-3">Kept per 100, world by world</div>
        <div className="space-y-3">
          {cmp.perWorld.map((wc) => {
            const max = Math.max(wc.a.hi, wc.b.hi, 100);
            return (
              <div key={wc.world.key}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium">{wc.world.name}</span>
                  <span className={`text-xs ${wc.winner === "tie" ? "text-muted-fg" : "text-foreground"}`}>
                    {wc.winner === "tie" ? "about even" : <>{winLabel(wc.winner)} wins by <b>{Math.round(wc.gap)}</b></>}
                  </span>
                </div>
                <div className="space-y-1">
                  <CmpBar mid={wc.a.mid} lo={wc.a.lo} hi={wc.a.hi} max={max} color="var(--color-primary)" win={wc.winner === "a"} />
                  <CmpBar mid={wc.b.mid} lo={wc.b.lo} hi={wc.b.hi} max={max} color="var(--color-researcher)" win={wc.winner === "b"} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-fg mt-3 leading-relaxed">Bars are the typical run (median over many rolls); the range in parentheses is the luck spread. A gap under {3} per 100 is treated as a wash, not a win.</p>
      </div>
    </div>
  );
}

// ── Within-world fragility block (how close A is to a different verdict) ──
function FragilityBlock({ frags }: { frags: FragilityResult[] }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-1">How fragile is this verdict?</h3>
      <p className="text-xs text-muted-fg mb-3 leading-relaxed">
        Holding each crowd fixed, this changes <b className="text-foreground">one</b> business move at a time and re-runs. The lightest flip is the smallest single move that tips the verdict into a different band — the trigger this business is most sensitive to.
      </p>
      <div className="space-y-3">
        {frags.map((f) => {
          const lf = f.lightest;
          const tone = f.robust ? "good" : lf?.improves ? "warn" : "bad";
          const dotColor = tone === "good" ? "var(--color-good)" : tone === "warn" ? "var(--color-warn)" : "var(--color-bad)";
          return (
            <div key={f.world.key} className="border-t border-card-border/60 pt-2.5 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="h-2 w-2 rounded-full shrink-0 self-center" style={{ backgroundColor: dotColor }} />
                <span className="text-sm font-medium">{f.world.name}</span>
                {!f.robust && lf && (
                  <span className="text-xs text-muted-fg tabular-nums">~{f.baselineMid} → {lf.mid} per 100</span>
                )}
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-fg">{fragilityPhrase(f)}</p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-fg mt-3 leading-relaxed">A &quot;flip&quot; means the typical run crosses a verdict band (holds / mostly holds / erodes / walks out). Single-lever only: combinations aren&apos;t counted, so a robust read here means no <i>one</i> move tips it, not that nothing can.</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
const DEFAULT_BIZ: BizInput = { ...EXAMPLES[0] };
const DEFAULT_BIZ_B: BizInput = { ...EXAMPLES[1] };
const DEFAULT_SELECTED: Record<string, boolean> = { mainstream: true, fickle: true, loyal: true, skeptic: false, grudge: false };
const DEFAULT_ADV = { rounds: 40, lossAversion: 2.25, difficulty: "normal" as Difficulty, anchorShift: 0, anchorRound: 0 };
const DEFAULT_FIN: FinanceInput = { launchPrice: 0, marginPct: 60, cac: 0, discountPct: 1 };
const DEFAULT_EXPORT = { model: true, teaching: true, charts: true, numbers: true, finance: true, fragility: true, methodology: true };

type View = "student" | "teaching" | "deep";
type Emphasis = "behavioral" | "finance";
type ExportSel = typeof DEFAULT_EXPORT;
interface RanState { biz: BizInput; bizB: BizInput; compare: boolean; fragility: boolean; selected: Record<string, boolean>; adv: typeof DEFAULT_ADV; fin: FinanceInput }

export default function Page() {
  const [biz, setBiz] = useState<BizInput>(DEFAULT_BIZ);
  const [bizB, setBizB] = useState<BizInput>(DEFAULT_BIZ_B);
  const [compare, setCompare] = useState(false);
  const [fragility, setFragility] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(DEFAULT_SELECTED);
  const [adv, setAdv] = useState(DEFAULT_ADV);
  const [fin, setFin] = useState<FinanceInput>(DEFAULT_FIN);
  const [ran, setRan] = useState<RanState>({ biz: DEFAULT_BIZ, bizB: DEFAULT_BIZ_B, compare: false, fragility: false, selected: DEFAULT_SELECTED, adv: DEFAULT_ADV, fin: DEFAULT_FIN });
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadedEngine, setLoadedEngine] = useState<string | null>(null);
  const [view, setView] = useState<View>("teaching");
  const [emphasis, setEmphasis] = useState<Emphasis>("behavioral");
  const [exp, setExp] = useState<ExportSel>(DEFAULT_EXPORT);
  const deep = view === "deep";                            // behavioral-econ veteran: λ + cited methodology
  const hasControls = view === "teaching" || view === "deep";  // any professor mode: dials + finance + export
  const financeLed = hasControls && emphasis === "finance";
  // Reference-price frame provenance for the run header, so a saved/shared copy
  // records that a non-default frame was in play (the result already reflects it).
  const anchorOn = ran.adv.anchorShift > 0;
  const anchorTag = anchorOn ? ` · ref +${ran.adv.anchorShift}@r${ran.adv.anchorRound}` : "";

  const derived = useMemo(() => {
    const advEng = { rounds: ran.adv.rounds, lossAversion: ran.adv.lossAversion, noise: DIFFICULTY_NOISE[ran.adv.difficulty], anchorShift: ran.adv.anchorShift, anchorRound: ran.adv.anchorRound };
    const chosen = WORLDS.filter((w) => ran.selected[w.key]);
    const sweeps = chosen.map((world) => sweepWorld(ran.biz, world, advEng));
    let synth = "";
    if (sweeps.length >= 2) {
      const sorted = [...sweeps].sort((a, b) => b.mid - a.mid);
      const best = sorted[0], worst = sorted[sorted.length - 1], spread = best.mid - worst.mid;
      if (spread >= 25) synth = `Same business, very different fates. Across the worlds you picked it does best with ${best.world.name.toLowerCase()} (usually about ${best.mid} per 100 started) and worst with ${worst.world.name.toLowerCase()} (about ${worst.mid}). The gap isn't your business plan, it's who your customers are and how hard your moves land on them.`;
      else if (best.mid < 55) synth = `This business struggles across every crowd you picked (it usually ends with between ${worst.mid} and ${best.mid} per 100 started). That points at the business moves themselves, not the customer mix.`;
      else synth = `This business holds up fairly evenly across the crowds you picked (usually between ${worst.mid} and ${best.mid} per 100 started), so it isn't very sensitive to who the customers are.`;
    } else if (sweeps.length === 1) {
      synth = `Tested against one customer world. Add another to see how much the outcome depends on who your customers are, not just your business.`;
    }
    const teaching = chosen.length ? teachingPrompt(ran.biz, chosen, ran.adv.lossAversion) : "";
    const band = sweeps.length ? referenceBand(ran.biz, advEng) : null;
    if (band && sweeps.length >= 1 && band.spread >= 8) {
      synth += ` Across all five customer worlds (not only the ones you picked) this business usually ends with between about ${band.lo} and ${band.hi} per 100 started, so where it lands is mostly about which crowd it meets.`;
    }
    const finRows = sweeps.map((s) => ({ world: s.world, fin: financeBand(s, ran.fin) }));
    const cmp = ran.compare && chosen.length ? compareBusinesses(ran.biz, ran.bizB, chosen, advEng) : null;
    const frag = ran.fragility && chosen.length ? chosen.map((w) => fragilityScan(ran.biz, w, advEng)) : null;
    return { sweeps, synth, teaching, band, finRows, cmp, frag };
  }, [ran]);

  const stale = JSON.stringify({ biz, bizB, compare, fragility, selected, adv, fin }) !== JSON.stringify(ran);
  const setField = (k: keyof BizInput, v: string) => setBiz((b) => ({ ...b, [k]: v }));
  const setFieldB = (k: keyof BizInput, v: string) => setBizB((b) => ({ ...b, [k]: v }));
  const toggleWorld = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  function run() { setRan({ biz, bizB, compare, fragility, selected, adv, fin }); setLoadedEngine(null); }

  // Load a shared run-link on first mount: decode ?r and apply it to the inputs
  // AND to `ran`, so the identical result renders immediately. The link re-runs
  // the frozen engine, so verdict + warnings regenerate from the numbers — they
  // can't be lost in transit. If the link was authored on a different engine,
  // surface the mismatch rather than passing a different result off as the same.
  // A malformed token is ignored. Runs once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("r");
    if (!token) return;
    const decoded = decodeRunLink(token);
    if (!decoded) return;
    const { biz: b, bizB: bb, compare: cm, fragility: fr, selected: s, adv: a, fin: f } = decoded.state;
    setBiz(b); setBizB(bb); setCompare(cm); setFragility(fr); setSelected(s); setAdv(a); setFin(f);
    setRan({ biz: b, bizB: bb, compare: cm, fragility: fr, selected: s, adv: a, fin: f });
    setView("student");   // a shared link is a finished artifact; open it in the clean read, not the configurer's controls
    // Surface an engine mismatch ONLY when the result would actually differ. An
    // anchor-off 2.0.0 link reproduces byte-for-byte on 2.1.0 (off-path identity),
    // so warning on it would be a false alarm; runLinkReproducesExactly gates that.
    if (!runLinkReproducesExactly(decoded, ENGINE_VERSION)) setLoadedEngine(decoded.engineVersion);
  }, []);

  // Copy a link that reproduces the DISPLAYED run (ran), not the live inputs.
  function copyRunLink() {
    if (typeof window === "undefined") return;
    const token = encodeRunLink(ran);
    const url = `${window.location.origin}${window.location.pathname}?r=${token}`;
    navigator.clipboard?.writeText(url).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800); });
  }

  // Save/Copy both read the LIVE printable region. Deselected export sections
  // are display:none'd (so innerText skips them) and collapsed numbers blocks
  // are force-opened, then everything is restored. The verdict + warning chips
  // carry NO export class and NO toggle, so they are in every saved copy by
  // construction — the save-button invariant, enforced through the save path.
  function withExportView(read: (el: HTMLElement) => void) {
    const el = document.getElementById("result-printable");
    if (!el) return;
    const hidden = Array.from(el.querySelectorAll(".export-hidden")) as HTMLElement[];
    const priorDisp = hidden.map((h) => h.style.display);
    hidden.forEach((h) => (h.style.display = "none"));
    const blocks = Array.from(el.querySelectorAll("details.numbers")) as HTMLDetailsElement[];
    const priorOpen = blocks.map((d) => d.open);
    blocks.forEach((d) => (d.open = true));
    read(el);
    blocks.forEach((d, i) => (d.open = priorOpen[i]));
    hidden.forEach((h, i) => (h.style.display = priorDisp[i]));
  }
  function copyWriteup() {
    withExportView((el) => {
      const text = el.innerText;
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    });
  }
  function printAll() {
    // The @media print rules hide deselected (.export-hidden) sections; here we
    // only force-open the collapsed numbers blocks so they print, then restore.
    const blocks = Array.from(document.querySelectorAll("details.numbers")) as HTMLDetailsElement[];
    const priorOpen = blocks.map((d) => d.open);
    blocks.forEach((d) => (d.open = true));
    window.print();
    blocks.forEach((d, i) => (d.open = priorOpen[i]));
  }
  const toggleExp = (k: keyof ExportSel) => setExp((e) => ({ ...e, [k]: !e[k] }));

  // Per-round CSV of the displayed run: the engine's own rows for the median
  // roll of each swept world, the data behind the charts. Raw data dump, so it
  // carries no verdict/warning text (those live on the results surface); the
  // save-button invariant governs the printable copy, not this.
  function downloadCsv() {
    if (typeof window === "undefined" || derived.sweeps.length === 0) return;
    const csv = runsToCsv(derived.sweeps);
    const slug = (ran.biz.name || "customer-model").trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "customer-model";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${slug}-per-round.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const seg = (active: boolean) => `px-3 py-1.5 text-sm rounded-md transition-colors ${active ? "bg-primary text-white" : "text-muted-fg hover:text-foreground"}`;

  return (
    <main className="min-h-screen max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Model</h1>
            <p className="text-muted-fg mt-1 max-w-2xl">
              Describe one business, then stress-test it against different <Term def={DEF.worlds}>customer worlds</Term>.
              The engine plays each crowd out over many rounds and shows the typical result and the luck around it.
              Same inputs give the same result, every time: an audit instrument, not a black box.
            </p>
          </div>
          <div className="no-print shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <div className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card-muted p-1">
                <button onClick={() => setView("student")} className={seg(view === "student")}>Student</button>
                <button onClick={() => setView("teaching")} className={seg(view === "teaching")}>Teaching</button>
                <button onClick={() => setView("deep")} className={seg(view === "deep")}>Deep dive</button>
              </div>
              {hasControls && (
                <button onClick={() => setEmphasis((e) => (e === "finance" ? "behavioral" : "finance"))}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${emphasis === "finance" ? "border-primary bg-primary/10 text-foreground" : "border-card-border bg-card-muted text-muted-fg hover:text-foreground"}`}>
                  {emphasis === "finance" ? "✓ Finance focus" : "Finance focus"}
                </button>
              )}
            </div>
            <a href="/glossary" className="text-xs text-muted-fg hover:text-foreground underline decoration-dotted underline-offset-2">Glossary ↗</a>
          </div>
        </div>
        <p className="no-print text-xs text-muted-fg mt-2">
          {view === "student"
            ? "Student view: plain language, no dials. The result reads at a freshman level."
            : financeLed
              ? "Finance focus: leads with the dollars (LTV, payback, NPV); the behavioral read stays one click away."
              : view === "teaching"
                ? "Teaching mode: plain language with the full teaching controls. No behavioral-science background needed — click any underlined term and it defines itself."
                : "Deep dive: adds the loss-aversion dial (λ) and the cited methodology on top of the teaching controls."}
          {" "}Any mode is open to anyone — these set how much is shown, not who may see it.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <aside className="no-print rounded-xl border border-card-border bg-card p-5 h-fit lg:sticky lg:top-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Your business</h3>
          <input value={biz.name} onChange={(e) => setField("name", e.target.value)} placeholder="Name this business idea"
            className="w-full rounded-lg border border-card-border bg-card-muted px-3 py-2 text-sm mb-2" />
          <input value={biz.sell} onChange={(e) => setField("sell", e.target.value)} placeholder="What you sell (e.g. a $12/mo note app)"
            className="w-full rounded-lg border border-card-border bg-card-muted px-3 py-2 text-sm" />
          <details className="mt-2 [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none">
              {biz.model?.trim() ? (
                <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 hover:border-primary transition-colors">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-light mb-0.5">Business model · click to view / edit</div>
                  <div className="text-sm text-foreground truncate">{snapshot(biz.model)}</div>
                </div>
              ) : (
                <span className="text-xs text-muted-fg hover:text-foreground">+ Paste a full business model (optional)</span>
              )}
            </summary>
            <textarea value={biz.model ?? ""} onChange={(e) => setField("model", e.target.value)}
              placeholder="Paste a detailed business model here — e.g. a worked-up idea from an AI. It travels with your write-up and saved copy. You still set the four moves below; that translation is the exercise."
              rows={6}
              className="w-full mt-2 rounded-lg border border-card-border bg-card-muted px-3 py-2 text-sm leading-relaxed resize-y min-h-[6rem] max-h-[22rem]" />
          </details>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setBiz({ ...ex })}
                className="text-xs rounded-full border border-card-border bg-card-muted text-muted-fg px-2.5 py-1 hover:border-primary hover:text-foreground transition-colors">{ex.name}</button>
            ))}
          </div>

          {FIELDS.map((f) => (
            <div key={f.key} className="mt-4">
              <div className="text-sm mb-1.5">{f.q}</div>
              <OptionGroup value={biz[f.key]} opts={f.opts} onChange={(v) => setField(f.key, v)} />
            </div>
          ))}

          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mt-6 mb-1">Customer worlds to test</h3>
          <p className="text-xs text-muted-fg mb-2">Same business, different customers. Pick the crowds to drop it into.</p>
          {WORLDS.map((w) => (
            <button key={w.key} onClick={() => toggleWorld(w.key)}
              className={`w-full text-left flex items-start gap-2.5 rounded-lg border px-3 py-2 mb-1.5 transition-colors ${selected[w.key] ? "border-primary bg-primary/10" : "border-card-border bg-card-muted hover:border-primary"}`}>
              <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] ${selected[w.key] ? "bg-primary border-primary text-white" : "border-muted-fg"}`}>{selected[w.key] ? "✓" : ""}</span>
              <span><span className="text-sm font-medium">{w.name}</span><span className="block text-xs text-muted-fg leading-snug">{w.blurb}</span></span>
            </button>
          ))}

          <div className="mt-5 border-t border-card-border pt-3">
            <button onClick={() => setCompare((c) => !c)}
              className={`w-full text-left flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${compare ? "border-primary bg-primary/10" : "border-card-border bg-card-muted hover:border-primary"}`}>
              <span className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] ${compare ? "bg-primary border-primary text-white" : "border-muted-fg"}`}>{compare ? "✓" : ""}</span>
              <span><span className="text-sm font-medium">Compare a second business</span><span className="block text-xs text-muted-fg leading-snug">Same customers, two strategies. See where the winner flips.</span></span>
            </button>
            {compare && (
              <div className="mt-3 rounded-lg border border-card-border bg-card-muted p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">Business B</div>
                <input value={bizB.name} onChange={(e) => setFieldB("name", e.target.value)} placeholder="Name the second idea"
                  className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm mb-1" />
                <input value={bizB.sell} onChange={(e) => setFieldB("sell", e.target.value)} placeholder="What B sells"
                  className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm" />
                <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                  {EXAMPLES.map((ex, i) => (
                    <button key={i} onClick={() => setBizB({ ...ex })}
                      className="text-xs rounded-full border border-card-border bg-card text-muted-fg px-2.5 py-1 hover:border-primary hover:text-foreground transition-colors">{ex.name}</button>
                  ))}
                </div>
                {FIELDS.map((f) => (
                  <div key={f.key} className="mt-3">
                    <div className="text-sm mb-1.5">{f.q}</div>
                    <OptionGroup value={bizB[f.key]} opts={f.opts} onChange={(v) => setFieldB(f.key, v)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3">
            <button onClick={() => setFragility((c) => !c)}
              className={`w-full text-left flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${fragility ? "border-primary bg-primary/10" : "border-card-border bg-card-muted hover:border-primary"}`}>
              <span className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] ${fragility ? "bg-primary border-primary text-white" : "border-muted-fg"}`}>{fragility ? "✓" : ""}</span>
              <span><span className="text-sm font-medium">Fragility check</span><span className="block text-xs text-muted-fg leading-snug">Smallest single move that flips each world&apos;s verdict. Robust, or one tweak away?</span></span>
            </button>
          </div>

          <button onClick={run} className={`w-full mt-4 rounded-lg py-2.5 font-medium transition-colors ${stale ? "bg-primary hover:bg-primary-light text-white" : "bg-card-muted border border-card-border text-muted-fg"}`}>
            {stale ? "Run stress test →" : "Re-run"}
          </button>

          {hasControls && (
            <>
              <div className="mt-5 border-t border-card-border pt-3">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-fg mb-1.5">Difficulty</div>
                <div className="inline-flex rounded-lg border border-card-border bg-card-muted p-0.5 w-full">
                  {DIFFS.map((d) => (
                    <button key={d} onClick={() => setAdv((a) => ({ ...a, difficulty: d }))}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${adv.difficulty === d ? "bg-primary text-white" : "text-muted-fg hover:text-foreground"}`}>
                      {DIFFICULTY_LABEL[d]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-fg mt-1.5 leading-snug">{DIFFICULTY_NOTE[adv.difficulty]} This is the randomness knob; it also widens the run-to-run band.</p>
              </div>

              <div className="mt-4 border-t border-card-border pt-3">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-fg mb-1.5">Reference-price framing</div>
                <AdvSlider label={'"Was $X" reference lift'} value={adv.anchorShift} min={0} max={20} step={1}
                  onChange={(v) => setAdv((a) => ({ ...a, anchorShift: Math.round(v) }))}
                  format={(v) => (v === 0 ? "off" : `+${v} pts`)} />
                {adv.anchorShift > 0 && (
                  <AdvSlider label="Frame starts at round" value={Math.min(adv.anchorRound, adv.rounds)} min={0} max={adv.rounds} step={1}
                    onChange={(v) => setAdv((a) => ({ ...a, anchorRound: Math.round(v) }))}
                    format={(v) => `r${v}`} />
                )}
                <p className="text-xs text-muted-fg mt-1.5 leading-snug">
                  An external &quot;was $X&quot; list price lifts the point customers <i>judge</i> against, so the same real price reads as a smaller loss. Real price and revenue are unchanged; the frame fades as expectations re-anchor. The robust marketing form of anchoring (not the contested decoy effect). Off at 0.
                </p>
              </div>

              {deep && (
                <details className="mt-4 border-t border-card-border pt-3">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-muted-fg">Advanced — engine parameters</summary>
                  <p className="text-xs text-muted-fg my-2"><Term def={DEF.lambda}>λ</Term> drives the outcome wherever your moves create a perceived loss; with no loss to weight, it does little. It&apos;s held constant across worlds as the shared science; what changes between worlds is who the customers are.</p>
                  <AdvSlider label="Rounds" value={adv.rounds} min={10} max={80} step={1} onChange={(v) => setAdv((a) => ({ ...a, rounds: Math.round(v) }))} />
                  <AdvSlider label="Loss aversion λ" value={adv.lossAversion} min={1} max={3.5} step={0.05} onChange={(v) => setAdv((a) => ({ ...a, lossAversion: v }))} format={(v) => v.toFixed(2)} />
                </details>
              )}

              <details className="mt-3 border-t border-card-border pt-3" open={financeLed}>
                <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-muted-fg">Finance — optional unit economics</summary>
                <p className="text-xs text-muted-fg my-2">Put real numbers on the run: cohort LTV, NPV, and CAC payback in dollars. Leave price at 0 to keep the unit-free read. The simulation is unchanged; this only reads its output in money.</p>
                <FinNum label="Launch price / round" prefix="$" value={fin.launchPrice} step={1} onChange={(v) => setFin((f) => ({ ...f, launchPrice: v }))} />
                <FinNum label="Gross margin" suffix="%" value={fin.marginPct} step={1} onChange={(v) => setFin((f) => ({ ...f, marginPct: Math.min(100, v) }))} />
                <FinNum label="Acquisition cost / customer" prefix="$" value={fin.cac} step={1} onChange={(v) => setFin((f) => ({ ...f, cac: v }))} />
                <FinNum label="Discount rate / round" suffix="%" value={fin.discountPct} step={0.5} onChange={(v) => setFin((f) => ({ ...f, discountPct: v }))} />
              </details>
            </>
          )}
        </aside>

        <section>
          <div className="no-print mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={printAll} title="Save or print this. The saved copy keeps every verdict and warning shown here."
                className="rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2 transition-colors">Save / Print</button>
              <button onClick={copyWriteup} className="rounded-lg border border-card-border bg-card text-sm px-4 py-2 hover:border-primary transition-colors">{copied ? "Copied" : "Copy writeup"}</button>
              <button onClick={copyRunLink} title="Copy a link that reproduces this exact run against the same engine version — the graded answer-key primitive."
                className="rounded-lg border border-card-border bg-card text-sm px-4 py-2 hover:border-primary transition-colors">{linkCopied ? "Link copied" : "Copy link"}</button>
              {derived.sweeps.length > 0 && (
                <button onClick={downloadCsv} title="Download the per-round numbers behind these charts as a CSV — one block of rows per customer world, for building a problem set or answer key."
                  className="rounded-lg border border-card-border bg-card text-sm px-4 py-2 hover:border-primary transition-colors">Download CSV</button>
              )}
              {stale && <span className="text-xs text-warn ml-1">Inputs changed — re-run to update.</span>}
            </div>
            {hasControls && (
              <div className="mt-2 rounded-lg border border-card-border bg-card-muted p-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-fg mb-1.5">Saved copy includes</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {([["model", "Business model"], ["teaching", "Class prompt"], ["charts", "Charts"], ["numbers", "Numbers"], ["finance", "Finance table"], ["fragility", "Fragility check"], ["methodology", "Methodology"]] as [keyof ExportSel, string][]).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                      <input type="checkbox" checked={exp[k]} onChange={() => toggleExp(k)} className="accent-primary" />
                      {label}
                    </label>
                  ))}
                  <span className="text-xs text-muted-fg">Verdict &amp; warnings: <b className="text-foreground">always included</b></span>
                </div>
              </div>
            )}
          </div>

          {loadedEngine && (
            <div className="no-print mb-4 rounded-lg border border-warn/50 bg-warn/10 px-4 py-2.5 text-xs leading-relaxed text-warn">
              <b>Engine mismatch.</b> This link was created on engine {loadedEngine}; you&apos;re running {ENGINE_VERSION}. The result below is computed on {ENGINE_VERSION} and may differ from the original. Re-run to dismiss.
            </div>
          )}

          <div id="result-printable">
            <div className="mb-1 flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold">{ran.biz.name || "Your business"}{ran.biz.sell ? <span className="text-muted-fg text-sm font-normal"> ({ran.biz.sell})</span> : null}</h2>
              {deep ? (
                <span className="text-sm text-muted-fg tabular-nums">{ran.adv.rounds} rounds · λ {ran.adv.lossAversion.toFixed(2)} · {DIFFICULTY_LABEL[ran.adv.difficulty]}{anchorTag} · engine {ENGINE_VERSION}</span>
              ) : view === "teaching" ? (
                <span className="text-sm text-muted-fg tabular-nums">{ran.adv.rounds} rounds · {DIFFICULTY_LABEL[ran.adv.difficulty]}{anchorTag} · engine {ENGINE_VERSION}</span>
              ) : (
                <span className="text-sm text-muted-fg">Tested across {derived.sweeps.length} customer world{derived.sweeps.length === 1 ? "" : "s"} over {ran.adv.rounds} rounds{anchorOn ? " · reference-price frame on" : ""}</span>
              )}
            </div>
            <p className="text-xs text-muted-fg mb-4 max-w-3xl">A structural model for seeing how customer types react to your moves, not a forecast of real-world numbers. The value is the mechanism and the comparison, not the exact count.</p>

            {ran.biz.model?.trim() ? (
              <details className={`numbers mb-4 rounded-xl border border-card-border bg-card-muted p-4 ${exp.model ? "" : "export-hidden"}`}>
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-fg">Business model under test</summary>
                <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{ran.biz.model.trim()}</p>
              </details>
            ) : null}

            {derived.sweeps.length === 0 ? (
              <div className="rounded-xl border border-card-border bg-card p-5 text-sm text-muted-fg">Pick at least one customer world on the left, then run.</div>
            ) : (
              <>
                {derived.cmp && (
                  <CompareBlock cmp={derived.cmp} nameA={ran.biz.name} nameB={ran.bizB.name} />
                )}
                {derived.synth && !derived.cmp && (
                  <div className="rounded-xl border border-primary bg-primary/10 p-5 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">The short version</h3>
                    <p className="text-[15px] leading-relaxed">{derived.synth}</p>
                  </div>
                )}
                {derived.teaching && (
                  <div className={`rounded-xl border border-dashed border-primary/60 bg-card-muted p-4 mb-5 ${exp.teaching ? "" : "export-hidden"}`}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">Use this in class</h3>
                    <p className="text-sm leading-relaxed">{derived.teaching}</p>
                  </div>
                )}

                {derived.cmp && (
                  <h3 className="text-sm font-semibold mt-2 mb-3">{ran.biz.name || "Business A"} in detail<span className="text-muted-fg font-normal text-xs"> — the deep dive stays on A; B&apos;s bands are in the comparison above</span></h3>
                )}
                {derived.sweeps.map((s) => (
                  <WorldCard key={s.world.key} sweep={s} band={derived.band} exportCharts={exp.charts} exportNumbers={exp.numbers} />
                ))}
              </>
            )}

            {derived.frag && derived.frag.length > 0 && (
              <div className={exp.fragility ? "" : "export-hidden"}>
                <FragilityBlock frags={derived.frag} />
              </div>
            )}

            {hasControls && ran.fin.launchPrice > 0 && derived.sweeps.length > 0 && (
              <details className={`numbers mb-4 rounded-xl border border-card-border bg-card p-5 ${exp.finance ? "" : "export-hidden"}`} open={financeLed}>
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-fg">Finance — unit economics in dollars</summary>
                <p className="text-xs text-muted-fg mt-2 mb-3 leading-relaxed">
                  Each run read into money at <b className="text-foreground">${fmt(ran.fin.launchPrice)}</b>/round, <b className="text-foreground">{ran.fin.marginPct}%</b> gross margin{ran.fin.discountPct > 0 ? <>, discounted <b className="text-foreground">{ran.fin.discountPct}%</b>/round</> : null}{ran.fin.cac > 0 ? <>, <b className="text-foreground">${fmt(ran.fin.cac)}</b> to acquire each customer</> : null}. Per starting customer, over {ran.adv.rounds} rounds, each figure a typical run with its luck range across many rolls.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-xs text-muted-fg text-left border-b border-card-border">
                        <th className="py-1.5 pr-3 font-medium">Customer world</th>
                        <th className="py-1.5 px-2 font-medium text-right">Revenue</th>
                        <th className="py-1.5 px-2 font-medium text-right"><Term def={DEF.contribution}>Contribution</Term></th>
                        <th className="py-1.5 px-2 font-medium text-right"><Term def={DEF.npv}>NPV</Term></th>
                        {ran.fin.cac > 0 && <th className="py-1.5 px-2 font-medium text-right"><Term def={DEF.ltvcac}>LTV:CAC</Term></th>}
                        {ran.fin.cac > 0 && <th className="py-1.5 pl-2 font-medium text-right"><Term def={DEF.payback}>Payback</Term></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {derived.finRows.map(({ world, fin }) => (
                        <tr key={world.key} className="border-b border-card-border/50">
                          <td className="py-1.5 pr-3">{world.name}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">{money$(fin.gross)}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">{money$(fin.contrib)}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">{money$(fin.npv)}</td>
                          {ran.fin.cac > 0 && (
                            <td className={`py-1.5 px-2 text-right tabular-nums font-medium ${fin.ltvCac && fin.ltvCac.mid < 1 ? "text-bad" : fin.ltvCac && fin.ltvCac.mid >= 3 ? "text-good" : "text-foreground"}`}>
                              {fin.ltvCac ? ltvCell(fin.ltvCac) : "—"}
                            </td>
                          )}
                          {ran.fin.cac > 0 && <td className="py-1.5 pl-2 text-right tabular-nums">{paybackCell(fin.payback, fin.paybackNever)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {derived.finRows.some((x) => x.fin.promoLeak > 0) && (
                  <p className="text-xs text-warn mt-3 leading-relaxed">Promo leak: {derived.finRows.filter((x) => x.fin.promoLeak > 0).map((x) => `${x.world.name} ~$${fmt(x.fin.promoLeak)}`).join(", ")} bled back out defending churn instead of building margin.</p>
                )}
                <p className="text-[11px] text-muted-fg mt-3 leading-relaxed">Revenue is net of promo spend, as the engine books it. Contribution applies gross margin; NPV discounts the per-round contribution stream. LTV:CAC under 1 destroys value, 3+ is the common healthy-growth rule of thumb. Payback is the round where discounted contribution per starting customer first covers acquisition cost. Each figure is the typical run (median) with its luck range in parentheses; dollars follow from one assumed launch price, so read the ranking across worlds, not any single number.</p>
              </details>
            )}

            {!deep ? (
              <div className={`rounded-xl border border-card-border bg-card-muted p-5 text-sm text-muted-fg leading-relaxed ${exp.methodology ? "" : "export-hidden"}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">How to read this</h3>
                <p className="mb-2">Each customer world is a different mix of people, from loyal regulars to deal-chasers. The engine plays your four moves out over many rounds and counts who stays and who leaves. It leans on two everyday facts about people: <Term def={DEF.loss}>loss aversion</Term> (a price rise or a quality drop stings more than an equal-size improvement pleases) and <Term def={DEF.present}>present bias</Term> (a discount right now is tempting even when staying would be smarter).</p>
                <p>Because luck plays a part, the headline is a typical run with a range around it, not one fixed number. Same inputs always give the same set of runs, so two people can compare the exact same result. Counts are shown per 100 starting customers, and word of mouth can push the ending count above 100 because a good <Term def={DEF.reputation}>reputation</Term> brings new people in.</p>
              </div>
            ) : (
              <details className={`rounded-xl border border-card-border bg-card-muted p-5 text-sm text-muted-fg leading-relaxed ${exp.methodology ? "" : "export-hidden"}`} open={!financeLed}>
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-fg">Methodology</summary>
                <p className="mt-2 mb-2">Seven customer archetypes named after strategies from Axelrod&apos;s tournaments (Tit-for-Tat and its relatives), used here as a vocabulary for how different customers react. This is not a symmetric game played between players: your four moves are the scenario, and each archetype reacts to them by a fixed rule. A customer world is a particular mix of those archetypes.</p>
                <p className="mb-2">Each round the customer judges price and value against an adapting reference point. A perceived loss (price above what they&apos;re used to, or value below it) is weighted by a factor <Term def={DEF.lambda}>λ</Term> against an equal-size gain, with diminishing sensitivity, and a logit turns the resulting utility into a graded chance of defecting. This is the reference-dependent choice model of Hardie, Johnson &amp; Fader (1993, Marketing Science), built on the Tversky &amp; Kahneman (1992) value function (λ default 2.25; meta-analytic estimates run lower). λ is load-bearing wherever your moves create a perceived loss: raise price or cut value with nothing to buffer it and sliding λ moves the verdicts, a large unbuffered loss by tens of points. Where there is no loss to weight, or the model has already collapsed, λ has little to move. It is held constant across customer worlds as the shared science; what changes between worlds is who the customers are. A present-bias term adds the pull of an immediate competitor discount.</p>
                <p>Deterministic by design, not a committee of LLM personas answering as fake customers: same seed, same result, every run. The simulation rolls many individual customers, so the underlying randomness fixes the whole roll (who is in the crowd, who reads each round as a loss, who actually leaves), not only the perception-noise misreads. A different roll is equally valid and can move the per-100 count by several points, which is why the headline is a typical run with a range, not a single number, and why the randomness is exposed as a difficulty setting rather than a raw seed. Counts are shown per 100 starting customers; the engine runs a larger population and rescales for readability, and word-of-mouth can push the ending count above 100 because it acquires as well as loses.</p>
              </details>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
