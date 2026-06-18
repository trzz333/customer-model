"use client";

import { useMemo, useState } from "react";
import {
  runSimulation,
  verdict,
  ARCHETYPES,
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
  type BizInput,
  type CustomerWorld,
  type Layman,
} from "@/lib/business";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

interface Run { world: CustomerWorld; cfg: SimConfig; r: SimResult; lay: Layman }
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

// ── Page ─────────────────────────────────────────────────────────────
const DEFAULT_BIZ: BizInput = { ...EXAMPLES[0] };
const DEFAULT_SELECTED: Record<string, boolean> = { mainstream: true, fickle: true, loyal: true, skeptic: false, grudge: false };
const DEFAULT_ADV = { rounds: 40, lossAversion: 2.25, noise: 0.05, seed: 12345 };

interface RanState { biz: BizInput; selected: Record<string, boolean>; adv: typeof DEFAULT_ADV }

export default function Page() {
  const [biz, setBiz] = useState<BizInput>(DEFAULT_BIZ);
  const [selected, setSelected] = useState<Record<string, boolean>>(DEFAULT_SELECTED);
  const [adv, setAdv] = useState(DEFAULT_ADV);
  const [ran, setRan] = useState<RanState>({ biz: DEFAULT_BIZ, selected: DEFAULT_SELECTED, adv: DEFAULT_ADV });
  const [copied, setCopied] = useState(false);

  const derived = useMemo(() => {
    const chosen = WORLDS.filter((w) => ran.selected[w.key]);
    const runs: Run[] = chosen.map((world) => {
      const cfg = businessToCfg(ran.biz, world, ran.adv);
      const r = runSimulation(cfg);
      return { world, cfg, r, lay: laymanAnalysis(cfg, r, world) };
    });
    let synth = "";
    if (runs.length >= 2) {
      const sorted = [...runs].sort((a, b) => b.lay.keep - a.lay.keep);
      const best = sorted[0], worst = sorted[sorted.length - 1], spread = best.lay.keep - worst.lay.keep;
      if (spread >= 25) synth = `Same business, very different fates. It does best with ${best.world.name.toLowerCase()} (keeps about ${best.lay.keep} of 100) and worst with ${worst.world.name.toLowerCase()} (keeps about ${worst.lay.keep}). The gap isn't your business plan, it's who your customers are and how hard your moves land on them.`;
      else if (best.lay.keep < 55) synth = `This business struggles across every crowd tested (it keeps between ${worst.lay.keep} and ${best.lay.keep} of 100). That points at the business moves themselves, not the customer mix.`;
      else synth = `This business holds up fairly evenly across these crowds (keeps between ${worst.lay.keep} and ${best.lay.keep} of 100), so it isn't very sensitive to who the customers are.`;
    } else if (runs.length === 1) {
      synth = `Tested against one customer world. Add another to see how much the outcome depends on who your customers are, not just your business.`;
    }
    const teaching = chosen.length ? teachingPrompt(ran.biz, chosen) : "";
    return { runs, synth, teaching };
  }, [ran]);

  const stale = JSON.stringify({ biz, selected, adv }) !== JSON.stringify(ran);
  const setField = (k: keyof BizInput, v: string) => setBiz((b) => ({ ...b, [k]: v }));
  const toggleWorld = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  function run() { setRan({ biz, selected, adv }); }
  function copyWriteup() {
    const el = document.getElementById("result-printable");
    if (el) navigator.clipboard?.writeText(el.innerText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
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
            <p className="text-xs text-muted-fg my-2">Applied to every world. λ is the shared science; what changes between worlds is who the customers are.</p>
            <AdvSlider label="Rounds" value={adv.rounds} min={10} max={80} step={1} onChange={(v) => setAdv((a) => ({ ...a, rounds: Math.round(v) }))} />
            <AdvSlider label="Loss aversion λ" value={adv.lossAversion} min={1} max={3.5} step={0.05} onChange={(v) => setAdv((a) => ({ ...a, lossAversion: v }))} format={(v) => v.toFixed(2)} />
            <AdvSlider label="Perception noise" value={adv.noise} min={0} max={0.3} step={0.01} onChange={(v) => setAdv((a) => ({ ...a, noise: v }))} format={(v) => v.toFixed(2)} />
            <AdvSlider label="Seed" value={adv.seed} min={1} max={999999} step={1} onChange={(v) => setAdv((a) => ({ ...a, seed: Math.round(v) }))} />
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
              <span className="text-sm text-muted-fg tabular-nums">{ran.adv.rounds} rounds · λ {ran.adv.lossAversion.toFixed(2)} · seed {ran.adv.seed}</span>
            </div>
            <p className="text-xs text-muted-fg mb-4 max-w-3xl">A structural model for seeing how customer types react to your moves, not a forecast of real-world numbers. The value is the mechanism and the comparison, not the exact count.</p>

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
                        <span>Keep <b className="text-foreground">~{lay.keep}</b> of 100</span>
                        <span>First to leave: <b className="text-foreground">{worst && worst.lost > 0.3 ? worst.a.name : "no single segment cracked"}</b></span>
                        <span>{r.tippingRound !== null ? <>Sudden break at <b className="text-foreground">round {r.tippingRound}</b></> : <>No sudden break, <b className="text-foreground">gradual</b></>}</span>
                      </div>
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

            <div className="rounded-xl border border-card-border bg-card-muted p-5 text-sm text-muted-fg leading-relaxed">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Methodology</h3>
              <p className="mb-2">Seven customer archetypes adapted from strategies that did well in Axelrod&apos;s iterated prisoner&apos;s-dilemma tournaments (Tit-for-Tat and relatives), each paired with a behavioral-economics bias profile. A customer world is a particular mix of those archetypes.</p>
              <p className="mb-2">Perceived price and value changes run through prospect theory: losses loom larger than equal gains by a factor λ, default 2.25 after Tversky &amp; Kahneman (1992). λ is held constant across worlds as the shared science; what changes between worlds is who the customers are.</p>
              <p>Deterministic by design, not a committee of LLM personas answering as fake customers. A transparent rule-based model is reproducible and auditable, and is itself the check on AI hand-waving. Same seed, same result, every run.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
