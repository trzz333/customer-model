"use client";

import { useMemo, useState } from "react";
import {
  runSimulation,
  verdict,
  ARCHETYPES,
  ENGINE_VERSION,
  type SimConfig,
  type SimResult,
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
  financeRead,
  type BizInput,
  type CustomerWorld,
  type Layman,
  type FinanceInput,
  type FinanceRead,
} from "@/lib/business";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

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

interface Run { world: CustomerWorld; cfg: SimConfig; r: SimResult; lay: Layman; fin: FinanceRead }
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

interface Warning { label: string; tone: "bad" | "warn" }
function deriveWarnings(cfg: SimConfig, r: SimResult): Warning[] {
  const w: Warning[] = [];
  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
  if (churnPct >= 60) w.push({ label: `Bleed-out: ~${churnPct}% lost`, tone: "bad" });
  else if (churnPct >= 30) w.push({ label: `Erosion: ~${churnPct}% lost`, tone: "warn" });
  if (r.tippingRound !== null) w.push({ label: `Tipping point at round ${r.tippingRound}`, tone: "bad" });
  if (r.exploitationCost > r.totalRevenue * 0.08) w.push({ label: "Promo margin leak", tone: "warn" });
  if (r.minReputation < 70) w.push({ label: `Reputation rot to ${Math.round(r.minReputation)}`, tone: "warn" });
  const worst = ARCHETYPES.map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((x) => r.perArch[x.a.key].start > 0).sort((p, q) => q.lost - p.lost)[0];
  if (worst && worst.lost > 0.5) w.push({ label: `${worst.a.name} ${Math.round(worst.lost * 100)}% gone`, tone: "bad" });
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

// ── Page ─────────────────────────────────────────────────────────────
const DEFAULT_BIZ: BizInput = { ...EXAMPLES[0] };
const DEFAULT_SELECTED: Record<string, boolean> = { mainstream: true, fickle: true, loyal: true, skeptic: false, grudge: false };
const DEFAULT_ADV = { rounds: 40, lossAversion: 2.25, noise: 0.05, seed: 12345 };
const DEFAULT_FIN: FinanceInput = { launchPrice: 0, marginPct: 60, cac: 0, discountPct: 1 };

interface RanState { biz: BizInput; selected: Record<string, boolean>; adv: typeof DEFAULT_ADV; fin: FinanceInput }

export default function Page() {
  const [biz, setBiz] = useState<BizInput>(DEFAULT_BIZ);
  const [selected, setSelected] = useState<Record<string, boolean>>(DEFAULT_SELECTED);
  const [adv, setAdv] = useState(DEFAULT_ADV);
  const [fin, setFin] = useState<FinanceInput>(DEFAULT_FIN);
  const [ran, setRan] = useState<RanState>({ biz: DEFAULT_BIZ, selected: DEFAULT_SELECTED, adv: DEFAULT_ADV, fin: DEFAULT_FIN });
  const [copied, setCopied] = useState(false);

  const derived = useMemo(() => {
    const chosen = WORLDS.filter((w) => ran.selected[w.key]);
    const runs: Run[] = chosen.map((world) => {
      const cfg = businessToCfg(ran.biz, world, ran.adv);
      const r = runSimulation(cfg);
      return { world, cfg, r, lay: laymanAnalysis(cfg, r, world), fin: financeRead(cfg, r, ran.fin) };
    });
    let synth = "";
    if (runs.length >= 2) {
      const sorted = [...runs].sort((a, b) => b.lay.keep - a.lay.keep);
      const best = sorted[0], worst = sorted[sorted.length - 1], spread = best.lay.keep - worst.lay.keep;
      if (spread >= 25) synth = `Same business, very different fates. Across the worlds you picked it does best with ${best.world.name.toLowerCase()} (ends with about ${best.lay.keep} per 100 started) and worst with ${worst.world.name.toLowerCase()} (about ${worst.lay.keep}). The gap isn't your business plan, it's who your customers are and how hard your moves land on them.`;
      else if (best.lay.keep < 55) synth = `This business struggles across every crowd you picked (it ends with between ${worst.lay.keep} and ${best.lay.keep} per 100 started). That points at the business moves themselves, not the customer mix.`;
      else synth = `This business holds up fairly evenly across the crowds you picked (it ends with between ${worst.lay.keep} and ${best.lay.keep} per 100 started), so it isn't very sensitive to who the customers are.`;
    } else if (runs.length === 1) {
      synth = `Tested against one customer world. Add another to see how much the outcome depends on who your customers are, not just your business.`;
    }
    const teaching = chosen.length ? teachingPrompt(ran.biz, chosen, ran.adv.lossAversion) : "";
    const band = runs.length ? referenceBand(ran.biz, ran.adv) : null;
    if (band && runs.length >= 1 && band.spread >= 8) {
      synth += ` Across all five customer worlds (not only the ones you picked) this business ends with between about ${band.lo} and ${band.hi} per 100 started, so where it lands is mostly about which crowd it meets.`;
    }
    return { runs, synth, teaching, band };
  }, [ran]);

  const stale = JSON.stringify({ biz, selected, adv, fin }) !== JSON.stringify(ran);
  const setField = (k: keyof BizInput, v: string) => setBiz((b) => ({ ...b, [k]: v }));
  const toggleWorld = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  function run() { setRan({ biz, selected, adv, fin }); }
  function copyWriteup() {
    const el = document.getElementById("result-printable");
    if (!el) return;
    // Mirror printAll: innerText skips collapsed <details>, so force-open the
    // numbers/finance blocks before reading, then restore their prior state.
    const blocks = Array.from(el.querySelectorAll("details.numbers")) as HTMLDetailsElement[];
    const prior = blocks.map((d) => d.open);
    blocks.forEach((d) => (d.open = true));
    const text = el.innerText;
    blocks.forEach((d, i) => (d.open = prior[i]));
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }
  function printAll() { document.querySelectorAll("details.numbers").forEach((d) => ((d as HTMLDetailsElement).open = true)); window.print(); }

  const toneClass = (t: Layman["tone"]) => t === "good" ? "text-good" : t === "warn" ? "text-warn" : t === "bad" ? "text-bad" : "text-foreground";

  return (
    <main className="min-h-screen max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <header className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Model</h1>
        <p className="text-muted-fg mt-1 max-w-3xl">
          Describe one business, then stress-test it against different customer worlds. The deterministic engine
          plays each crowd out over repeated rounds under loss aversion and present bias. Same inputs give the same
          result, every time: an audit instrument, not a black box.
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

          <button onClick={run} className={`w-full mt-4 rounded-lg py-2.5 font-medium transition-colors ${stale ? "bg-primary hover:bg-primary-light text-white" : "bg-card-muted border border-card-border text-muted-fg"}`}>
            {stale ? "Run stress test →" : "Re-run"}
          </button>

          <details className="mt-4 border-t border-card-border pt-3">
            <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-muted-fg">Advanced — engine parameters</summary>
            <p className="text-xs text-muted-fg my-2">Applied to every world. λ now drives the outcome — slide it and the verdicts move. It&apos;s held constant across worlds as the shared science; what changes between worlds is who the customers are.</p>
            <AdvSlider label="Rounds" value={adv.rounds} min={10} max={80} step={1} onChange={(v) => setAdv((a) => ({ ...a, rounds: Math.round(v) }))} />
            <AdvSlider label="Loss aversion λ" value={adv.lossAversion} min={1} max={3.5} step={0.05} onChange={(v) => setAdv((a) => ({ ...a, lossAversion: v }))} format={(v) => v.toFixed(2)} />
            <AdvSlider label="Perception noise" value={adv.noise} min={0} max={0.3} step={0.01} onChange={(v) => setAdv((a) => ({ ...a, noise: v }))} format={(v) => v.toFixed(2)} />
            <AdvSlider label="Seed" value={adv.seed} min={1} max={999999} step={1} onChange={(v) => setAdv((a) => ({ ...a, seed: Math.round(v) }))} />
          </details>

          <details className="mt-3 border-t border-card-border pt-3">
            <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-muted-fg">Finance — optional unit economics</summary>
            <p className="text-xs text-muted-fg my-2">Put real numbers on the run: cohort LTV, NPV, and CAC payback in dollars. Leave price at 0 to keep the unit-free read. The simulation is unchanged; this only reads its output in money.</p>
            <FinNum label="Launch price / round" prefix="$" value={fin.launchPrice} step={1} onChange={(v) => setFin((f) => ({ ...f, launchPrice: v }))} />
            <FinNum label="Gross margin" suffix="%" value={fin.marginPct} step={1} onChange={(v) => setFin((f) => ({ ...f, marginPct: Math.min(100, v) }))} />
            <FinNum label="Acquisition cost / customer" prefix="$" value={fin.cac} step={1} onChange={(v) => setFin((f) => ({ ...f, cac: v }))} />
            <FinNum label="Discount rate / round" suffix="%" value={fin.discountPct} step={0.5} onChange={(v) => setFin((f) => ({ ...f, discountPct: v }))} />
          </details>
        </aside>

        <section>
          <div className="no-print flex items-center gap-2 mb-4">
            <button onClick={printAll} title="Save or print this. The saved copy keeps every verdict and warning shown here."
              className="rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2 transition-colors">Save / Print</button>
            <button onClick={copyWriteup} className="rounded-lg border border-card-border bg-card text-sm px-4 py-2 hover:border-primary transition-colors">{copied ? "Copied" : "Copy writeup"}</button>
            {stale && <span className="text-xs text-warn ml-1">Inputs changed — re-run to update.</span>}
          </div>

          <div id="result-printable">
            <div className="mb-1 flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold">{ran.biz.name || "Your business"}{ran.biz.sell ? <span className="text-muted-fg text-sm font-normal"> ({ran.biz.sell})</span> : null}</h2>
              <span className="text-sm text-muted-fg tabular-nums">{ran.adv.rounds} rounds · λ {ran.adv.lossAversion.toFixed(2)} · seed {ran.adv.seed} · engine {ENGINE_VERSION}</span>
            </div>
            <p className="text-xs text-muted-fg mb-4 max-w-3xl">A structural model for seeing how customer types react to your moves, not a forecast of real-world numbers. The value is the mechanism and the comparison, not the exact count.</p>

            {ran.biz.model?.trim() ? (
              <details className="numbers mb-4 rounded-xl border border-card-border bg-card-muted p-4">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-fg">Business model under test</summary>
                <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{ran.biz.model.trim()}</p>
              </details>
            ) : null}

            {derived.runs.length === 0 ? (
              <div className="rounded-xl border border-card-border bg-card p-5 text-sm text-muted-fg">Pick at least one customer world on the left, then run.</div>
            ) : (
              <>
                {derived.synth && (
                  <div className="rounded-xl border border-primary bg-primary/10 p-5 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">The short version</h3>
                    <p className="text-[15px] leading-relaxed">{derived.synth}</p>
                  </div>
                )}
                {derived.teaching && (
                  <div className="rounded-xl border border-dashed border-primary/60 bg-card-muted p-4 mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-2">Use this in class</h3>
                    <p className="text-sm leading-relaxed">{derived.teaching}</p>
                  </div>
                )}

                {derived.runs.map(({ world, cfg, r, lay }) => {
                  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
                  const worst = ARCHETYPES.map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
                    .filter((x) => r.perArch[x.a.key].start > 0).sort((x, y) => y.lost - x.lost)[0];
                  const warns = deriveWarnings(cfg, r);
                  return (
                    <div key={world.key} className="rounded-xl border border-card-border bg-card p-5 mb-4">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <span className="text-sm font-bold tracking-wide text-primary-light">{world.name}</span>
                        <span className="text-xs text-muted-fg">{world.blurb}</span>
                      </div>
                      <div className={`text-[19px] font-bold tracking-tight mt-2 mb-1.5 ${toneClass(lay.tone)}`}>{lay.headline}</div>
                      <p className="text-[14.5px] leading-relaxed mb-3">{lay.analysis}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-fg mb-3">
                        <span>End with <b className="text-foreground">~{lay.keep}</b> per 100 started</span>
                        <span>First to leave: <b className="text-foreground">{worst && worst.lost > 0.3 ? worst.a.name : "no single segment cracked"}</b></span>
                        <span>{r.tippingRound !== null ? <>Sudden break at <b className="text-foreground">round {r.tippingRound}</b></> : <>No sudden break, <b className="text-foreground">gradual</b></>}</span>
                      </div>
                      {derived.band && (
                        <p className="text-xs text-muted-fg mb-3 leading-relaxed">
                          <b className="text-foreground">Is ~{lay.keep} good?</b> {placeInBand(lay.keep, derived.band)} — across every customer world this same business ends with {derived.band.lo}–{derived.band.hi} per 100 started. {unitEconomics(cfg, r)}
                        </p>
                      )}
                      <SimChart result={r} events={buildEvents(cfg)} />
                      <div className="text-xs text-muted-fg border-t border-card-border pt-2.5 mt-2.5 leading-relaxed">
                        <b className="text-foreground">Engine verdict:</b> {verdict(cfg, r)}
                      </div>
                      {warns.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {warns.map((w, i) => (
                            <span key={i} className={`text-xs rounded-full px-2.5 py-1 border ${w.tone === "bad" ? "border-bad/40 text-bad bg-bad/10" : "border-warn/40 text-warn bg-warn/10"}`}>{w.label}</span>
                          ))}
                        </div>
                      )}
                      <details className="numbers mt-3">
                        <summary className="cursor-pointer text-xs text-primary-light">Show the numbers</summary>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                          {[["Net churn", `${churnPct}%`], ["Ending / start", `${fmt(r.endingActive)} / ${fmt(r.startingActive)}`], ["Lowest rep.", `${Math.round(r.minReputation)}`], ["Tipping", r.tippingRound !== null ? `r${r.tippingRound}` : "none"]].map((m, i) => (
                            <div key={i} className="rounded-lg border border-card-border bg-card-muted px-3 py-2"><div className="text-xs text-muted-fg">{m[0]}</div><div className="text-base font-semibold tabular-nums">{m[1]}</div></div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          {ARCHETYPES.map((a) => {
                            const pa = r.perArch[a.key]; const sr = pa.start ? pa.survived / pa.start : 0;
                            return (
                              <div key={a.key} className="flex items-center gap-3">
                                <div className="w-36 shrink-0 text-xs" style={{ color: a.color }}>{a.name}</div>
                                <div className="flex-1 h-2.5 rounded-full bg-card-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sr * 100}%`, backgroundColor: a.color, opacity: 0.85 }} /></div>
                                <div className="w-16 text-right text-xs tabular-nums text-muted-fg"><b className="text-foreground">{Math.round(sr * 100)}%</b> stay</div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </>
            )}

            {ran.fin.launchPrice > 0 && derived.runs.length > 0 && (
              <details className="numbers mb-4 rounded-xl border border-card-border bg-card p-5">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-fg">Finance — unit economics in dollars</summary>
                <p className="text-xs text-muted-fg mt-2 mb-3 leading-relaxed">
                  Each run read into money at <b className="text-foreground">${fmt(ran.fin.launchPrice)}</b>/round, <b className="text-foreground">{ran.fin.marginPct}%</b> gross margin{ran.fin.discountPct > 0 ? <>, discounted <b className="text-foreground">{ran.fin.discountPct}%</b>/round</> : null}{ran.fin.cac > 0 ? <>, <b className="text-foreground">${fmt(ran.fin.cac)}</b> to acquire each customer</> : null}. Per starting customer, over {ran.adv.rounds} rounds.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-xs text-muted-fg text-left border-b border-card-border">
                        <th className="py-1.5 pr-3 font-medium">Customer world</th>
                        <th className="py-1.5 px-2 font-medium text-right">Revenue</th>
                        <th className="py-1.5 px-2 font-medium text-right">Contribution</th>
                        <th className="py-1.5 px-2 font-medium text-right">NPV</th>
                        {ran.fin.cac > 0 && <th className="py-1.5 px-2 font-medium text-right">LTV:CAC</th>}
                        {ran.fin.cac > 0 && <th className="py-1.5 pl-2 font-medium text-right">Payback</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {derived.runs.map(({ world, fin }) => (
                        <tr key={world.key} className="border-b border-card-border/50">
                          <td className="py-1.5 pr-3">{world.name}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">${fmt(fin.grossPerStart)}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">${fmt(fin.contribPerStart)}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">${fmt(fin.npvPerStart)}</td>
                          {ran.fin.cac > 0 && (
                            <td className={`py-1.5 px-2 text-right tabular-nums font-medium ${fin.ltvCac !== null && fin.ltvCac < 1 ? "text-bad" : fin.ltvCac !== null && fin.ltvCac >= 3 ? "text-good" : "text-foreground"}`}>
                              {fin.ltvCac !== null ? `${fin.ltvCac.toFixed(1)}×` : "—"}
                            </td>
                          )}
                          {ran.fin.cac > 0 && <td className="py-1.5 pl-2 text-right tabular-nums">{fin.paybackRound !== null ? `r${fin.paybackRound}` : "never"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {derived.runs.some((x) => x.fin.promoLeak > 0) && (
                  <p className="text-xs text-warn mt-3 leading-relaxed">Promo leak: {derived.runs.filter((x) => x.fin.promoLeak > 0).map((x) => `${x.world.name} ~$${fmt(x.fin.promoLeak)}`).join(", ")} bled back out defending churn instead of building margin.</p>
                )}
                <p className="text-[11px] text-muted-fg mt-3 leading-relaxed">Revenue is net of promo spend, as the engine books it. Contribution applies gross margin; NPV discounts the per-round contribution stream. LTV:CAC under 1 destroys value, 3+ is the common healthy-growth rule of thumb. Payback is the round where discounted contribution per starting customer first covers acquisition cost. Dollars follow from one assumed launch price, so read the ranking across worlds, not the third significant figure.</p>
              </details>
            )}

            <div className="rounded-xl border border-card-border bg-card-muted p-5 text-sm text-muted-fg leading-relaxed">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Methodology</h3>
              <p className="mb-2">Seven customer archetypes named after strategies from Axelrod&apos;s tournaments (Tit-for-Tat and its relatives), used here as a vocabulary for how different customers react. This is not a symmetric game played between players: your four moves are the scenario, and each archetype reacts to them by a fixed rule. A customer world is a particular mix of those archetypes.</p>
              <p className="mb-2">Each round the customer judges price and value against an adapting reference point. A perceived loss (price above what they&apos;re used to, or value below it) is weighted by a factor λ against an equal-size gain, with diminishing sensitivity, and a logit turns the resulting utility into a graded chance of defecting. This is the reference-dependent choice model of Hardie, Johnson &amp; Fader (1993, Marketing Science), built on the Tversky &amp; Kahneman (1992) value function (λ default 2.25; meta-analytic estimates run lower). λ is load-bearing here: hold the business fixed, slide λ, and the verdicts move. It is held constant across customer worlds as the shared science; what changes between worlds is who the customers are. A present-bias term adds the pull of an immediate competitor discount.</p>
              <p>Deterministic by design, not a committee of LLM personas answering as fake customers: same seed, same result, every run. The perception-noise control adds a small chance any customer misreads a move in a given round; the seed freezes those draws, so reproducibility holds. Counts are shown per 100 starting customers — the engine runs a larger population and rescales for readability, and word-of-mouth can push the ending count above 100 because it acquires as well as loses.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
