"use client";

import { useMemo, useState } from "react";
import {
  runSimulation,
  verdict,
  DEFAULT_CONFIG,
  ARCHETYPES,
  type SimConfig,
  type SimResult,
  type StratKey,
} from "@/lib/sim";

// Verified-harsh preset (mirrors smoke.ts: collapses ~98%).
const HARSH_CONFIG: SimConfig = {
  ...DEFAULT_CONFIG,
  friction: 8,
  hikeRound: 6,
  hikeSize: 40,
  incidentRound: 10,
  competitorRound: 8,
  competitorOffer: 60,
  promoActive: true,
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// ── Small control primitives ─────────────────────────────────────────
function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
  format?: (v: number) => string;
}) {
  const { label, value, min, max, step, onChange, hint, format } = props;
  return (
    <label className="block mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-medium text-primary-light tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      {hint ? <div className="text-xs text-muted-fg mt-1 leading-snug">{hint}</div> : null}
    </label>
  );
}

function Toggle(props: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const { label, value, onChange, hint } = props;
  return (
    <label className="flex items-start gap-3 mb-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-card-border"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span>
        <span className="text-sm text-foreground">{label}</span>
        {hint ? <span className="block text-xs text-muted-fg leading-snug">{hint}</span> : null}
      </span>
    </label>
  );
}

function Section(props: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-1">{props.title}</h3>
      {props.sub ? <p className="text-xs text-muted-fg mb-3">{props.sub}</p> : null}
      <div className="mt-2">{props.children}</div>
    </div>
  );
}

// ── Hand-rolled SVG chart (no recharts) ──────────────────────────────
interface EventMark {
  round: number;
  label: string;
  color: string;
}

function buildEvents(cfg: SimConfig): EventMark[] {
  const ev: EventMark[] = [];
  if (cfg.hikeRound > 0) ev.push({ round: cfg.hikeRound, label: "hike", color: "var(--color-warn)" });
  if (cfg.incidentRound > 0) ev.push({ round: cfg.incidentRound, label: "incident", color: "var(--color-bad)" });
  if (cfg.competitorRound > 0) ev.push({ round: cfg.competitorRound, label: "rival", color: "var(--color-mixed)" });
  return ev;
}

function SimChart({ result, events }: { result: SimResult; events: EventMark[] }) {
  const rounds = result.rounds;
  const n = rounds.length;
  if (n === 0) return null;

  // Geometry
  const W = 720, padL = 44, padR = 14, plotW = W - padL - padR;
  const hA = 168, hB = 120, gap = 26, axisH = 18;
  const totalH = hA + gap + hB + axisH;

  const lastR = n - 1;
  const x = (i: number) => padL + (n === 1 ? 0 : (i / lastR) * plotW);

  const maxActive = Math.max(result.startingActive, ...rounds.map((r) => r.active)) || 1;
  const yA = (v: number) => 8 + (hA - 16) * (1 - v / maxActive);

  const repTop = 160;
  const yB0 = hA + gap;
  const yB = (v: number) => yB0 + 6 + (hB - 12) * (1 - v / repTop);

  const maxChurn = Math.max(1, ...rounds.map((r) => r.churnedThisRound));
  const barW = Math.max(1, plotW / n - 1);

  const activeLine = rounds.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yA(r.active).toFixed(1)}`).join(" ");
  const activeArea =
    `M${x(0).toFixed(1)},${yA(rounds[0].active).toFixed(1)} ` +
    rounds.map((r, i) => `L${x(i).toFixed(1)},${yA(r.active).toFixed(1)}`).join(" ") +
    ` L${x(lastR).toFixed(1)},${(hA - 8).toFixed(1)} L${x(0).toFixed(1)},${(hA - 8).toFixed(1)} Z`;
  const repLine = rounds.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yB(r.reputation).toFixed(1)}`).join(" ");

  const tip = result.tippingRound;

  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full h-auto" role="img"
      aria-label="Active customers, reputation, and churn per round">
      {/* Panel A gridlines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={`ga${f}`} x1={padL} x2={W - padR} y1={yA(maxActive * f)} y2={yA(maxActive * f)}
          stroke="var(--color-card-border)" strokeWidth={1} opacity={0.5} />
      ))}
      <text x={4} y={yA(maxActive) + 4} fontSize={10} fill="var(--color-muted-fg)">{fmt(maxActive)}</text>
      <text x={4} y={yA(0)} fontSize={10} fill="var(--color-muted-fg)">0</text>
      <text x={padL} y={yA(maxActive) - 4} fontSize={11} fill="var(--color-primary-light)" fontWeight={600}>Active customers</text>

      {/* event + tipping markers across panel A */}
      {events.map((e) => (
        <g key={`evA${e.label}`}>
          <line x1={x(e.round)} x2={x(e.round)} y1={6} y2={hA - 8} stroke={e.color} strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
          <text x={x(e.round) + 3} y={16} fontSize={9} fill={e.color}>{e.label}</text>
        </g>
      ))}
      {tip !== null && (
        <line x1={x(tip)} x2={x(tip)} y1={6} y2={hA - 8} stroke="var(--color-bad)" strokeWidth={1.5} opacity={0.9} />
      )}

      <path d={activeArea} fill="var(--color-primary)" opacity={0.16} />
      <path d={activeLine} fill="none" stroke="var(--color-primary-light)" strokeWidth={2} />

      {/* Panel B: churn bars + reputation line */}
      <line x1={padL} x2={W - padR} y1={yB(100)} y2={yB(100)} stroke="var(--color-card-border)" strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
      <text x={4} y={yB(100) + 3} fontSize={9} fill="var(--color-muted-fg)">rep 100</text>
      <text x={padL} y={yB0 + 2} fontSize={11} fill="var(--color-researcher)" fontWeight={600}>Reputation</text>
      <text x={W - padR} y={yB0 + 2} fontSize={11} fill="var(--color-muted-fg)" textAnchor="end">churn / round</text>

      {rounds.map((r, i) => {
        const h = (r.churnedThisRound / maxChurn) * (hB - 16);
        const bx = x(i) - barW / 2;
        return (
          <rect key={`cb${i}`} x={bx} y={yB0 + (hB - 8) - h} width={barW} height={Math.max(0, h)}
            fill="var(--color-bad)" opacity={0.32} />
        );
      })}
      {events.map((e) => (
        <line key={`evB${e.label}`} x1={x(e.round)} x2={x(e.round)} y1={yB0} y2={yB0 + hB - 8}
          stroke={e.color} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
      ))}
      {tip !== null && (
        <g>
          <line x1={x(tip)} x2={x(tip)} y1={yB0} y2={yB0 + hB - 8} stroke="var(--color-bad)" strokeWidth={1.5} opacity={0.9} />
          <text x={x(tip) + 3} y={yB0 + hB + 14} fontSize={9} fill="var(--color-bad)">tipping → r{tip}</text>
        </g>
      )}
      <path d={repLine} fill="none" stroke="var(--color-researcher)" strokeWidth={2} />

      {/* X axis labels */}
      {[0, Math.floor(lastR / 2), lastR].map((i) => (
        <text key={`xl${i}`} x={x(i)} y={totalH - 4} fontSize={10} fill="var(--color-muted-fg)" textAnchor="middle">r{rounds[i].round}</text>
      ))}
    </svg>
  );
}

// ── Metric card ──────────────────────────────────────────────────────
function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  const c = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-foreground";
  return (
    <div className="rounded-lg border border-card-border bg-card-muted px-3 py-2">
      <div className="text-xs text-muted-fg">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

interface Warning { label: string; tone: "bad" | "warn" }

function deriveWarnings(cfg: SimConfig, r: SimResult): Warning[] {
  const w: Warning[] = [];
  const churnPct = Math.round((1 - r.endingActive / r.startingActive) * 100);
  if (churnPct >= 60) w.push({ label: `Bleed-out: ~${churnPct}% of base lost`, tone: "bad" });
  else if (churnPct >= 30) w.push({ label: `Erosion: ~${churnPct}% of base lost`, tone: "warn" });
  if (r.tippingRound !== null) w.push({ label: `Tipping point at round ${r.tippingRound}`, tone: "bad" });
  if (r.exploitationCost > r.totalRevenue * 0.08) w.push({ label: "Promo margin leak from exploiters", tone: "warn" });
  if (r.minReputation < 70) w.push({ label: `Reputation rot to ${Math.round(r.minReputation)}`, tone: "warn" });
  const worst = ARCHETYPES
    .map((a) => ({ a, lost: r.perArch[a.key].start ? r.perArch[a.key].churned / r.perArch[a.key].start : 0 }))
    .filter((xx) => r.perArch[xx.a.key].start > 0)
    .sort((p, q) => q.lost - p.lost)[0];
  if (worst && worst.lost > 0.5) w.push({ label: `Segment loss: ${worst.a.name} ${Math.round(worst.lost * 100)}% gone`, tone: "bad" });
  return w;
}

// ── Page ─────────────────────────────────────────────────────────────
export default function Page() {
  const [cfg, setCfg] = useState<SimConfig>(DEFAULT_CONFIG);
  const [ran, setRan] = useState<SimConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  // Results are computed from the last *run* config, so the chart never
  // silently disagrees with the sliders.
  const result = useMemo<SimResult>(() => runSimulation(ran), [ran]);
  const verdictText = useMemo(() => verdict(ran, result), [ran, result]);
  const warnings = useMemo(() => deriveWarnings(ran, result), [ran, result]);
  const events = useMemo(() => buildEvents(ran), [ran]);

  const stale = JSON.stringify(cfg) !== JSON.stringify(ran);
  const churnPct = Math.round((1 - result.endingActive / result.startingActive) * 100);

  const set = <K extends keyof SimConfig>(k: K, v: SimConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const setMix = (k: StratKey, v: number) => setCfg((c) => ({ ...c, mix: { ...c.mix, [k]: v } }));
  const mixTotal = ARCHETYPES.reduce((s, a) => s + Math.max(0, cfg.mix[a.key]), 0) || 1;

  function run() { setRan(cfg); }

  function copySummary() {
    const lines = [
      "CUSTOMER MODEL — stress test result",
      `Scenario: ${ran.population} customers, ${ran.rounds} rounds, seed ${ran.seed}`,
      "",
      "VERDICT",
      verdictText,
      "",
      `Net churn: ${churnPct}%  |  Ending active: ${fmt(result.endingActive)} / ${fmt(result.startingActive)}`,
      `Revenue: ${fmt(result.totalRevenue)}  |  Exploit cost: ${fmt(result.exploitationCost)}`,
      `Reputation: ended ${Math.round(result.endingReputation)}, low ${Math.round(result.minReputation)}`,
      `Tipping round: ${result.tippingRound ?? "none"}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Model</h1>
        <p className="text-muted-fg mt-1 max-w-3xl">
          A deterministic game-theory and behavioral-economics simulation that stress-tests a business
          model against synthetic customer archetypes. Same inputs give the same result, every time:
          it is an audit instrument, not a black box.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* ── Controls ── */}
        <aside className="no-print rounded-xl border border-card-border bg-card p-5 h-fit lg:sticky lg:top-6">
          <div className="flex gap-2 mb-5">
            <button onClick={() => setCfg(DEFAULT_CONFIG)} className="flex-1 text-sm rounded-lg border border-card-border bg-card-muted py-2 hover:border-primary transition-colors">Default</button>
            <button onClick={() => setCfg(HARSH_CONFIG)} className="flex-1 text-sm rounded-lg border border-card-border bg-card-muted py-2 hover:border-primary transition-colors">Harsh</button>
          </div>

          <Section title="Market">
            <Slider label="Population" value={cfg.population} min={100} max={3000} step={100} onChange={(v) => set("population", v)} format={fmt} />
            <Slider label="Rounds" value={cfg.rounds} min={10} max={80} step={1} onChange={(v) => set("rounds", v)} />
            <label className="block mb-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-foreground">Seed</span>
                <button onClick={() => set("seed", Math.floor(Math.random() * 1e6))} className="text-xs text-primary-light hover:underline">new seed</button>
              </div>
              <input type="number" value={cfg.seed} onChange={(e) => set("seed", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-card-border bg-card-muted px-3 py-1.5 text-sm tabular-nums" />
            </label>
          </Section>

          <Section title="Market mix" sub="Relative weights; normalized to the share shown.">
            {ARCHETYPES.map((a) => (
              <Slider
                key={a.key}
                label={a.name}
                value={cfg.mix[a.key]}
                min={0}
                max={40}
                step={1}
                onChange={(v) => setMix(a.key, v)}
                format={() => `${Math.round((Math.max(0, cfg.mix[a.key]) / mixTotal) * 100)}%`}
                hint={a.axelrod}
              />
            ))}
          </Section>

          <Section title="Policy levers">
            <Slider label="Price index" value={cfg.priceIndex} min={60} max={200} step={1} onChange={(v) => set("priceIndex", v)} hint="100 = launch price" />
            <Slider label="Value index" value={cfg.valueIndex} min={40} max={160} step={1} onChange={(v) => set("valueIndex", v)} hint="100 = promised value" />
            <Slider label="Friction / lock-in" value={cfg.friction} min={0} max={100} step={1} onChange={(v) => set("friction", v)} hint="switching cost; damps churn" />
            <Toggle label="Standing retention promo" value={cfg.promoActive} onChange={(v) => set("promoActive", v)} hint="Defends churn, leaks margin to exploiters." />
          </Section>

          <Section title="Behavioral params">
            <Slider label="Loss aversion (λ)" value={cfg.lossAversion} min={1} max={3.5} step={0.05} onChange={(v) => set("lossAversion", v)} format={(v) => v.toFixed(2)} hint="Tversky-Kahneman default 2.25" />
            <Slider label="Present bias" value={cfg.presentBias} min={1} max={3} step={0.1} onChange={(v) => set("presentBias", v)} format={(v) => v.toFixed(1)} hint="overweight on immediate rival lures" />
            <Slider label="Reference re-anchoring" value={cfg.refAdapt} min={0} max={1} step={0.05} onChange={(v) => set("refAdapt", v)} format={(v) => v.toFixed(2)} hint="how fast expectations reset to current price" />
            <Slider label="Perception noise" value={cfg.noise} min={0} max={0.3} step={0.01} onChange={(v) => set("noise", v)} format={(v) => v.toFixed(2)} hint="chance a move is misread" />
          </Section>

          <Section title="Scenario events" sub="Round 0 = none.">
            <Slider label="Price-hike round" value={cfg.hikeRound} min={0} max={cfg.rounds} step={1} onChange={(v) => set("hikeRound", v)} />
            <Slider label="Hike size (pts)" value={cfg.hikeSize} min={0} max={80} step={1} onChange={(v) => set("hikeSize", v)} />
            <Slider label="Service-incident round" value={cfg.incidentRound} min={0} max={cfg.rounds} step={1} onChange={(v) => set("incidentRound", v)} />
            <Slider label="Competitor-entry round" value={cfg.competitorRound} min={0} max={cfg.rounds} step={1} onChange={(v) => set("competitorRound", v)} />
            <Slider label="Competitor lure" value={cfg.competitorOffer} min={0} max={100} step={1} onChange={(v) => set("competitorOffer", v)} hint="strength of the rival's opening offer" />
          </Section>

          <button
            onClick={run}
            className={`w-full rounded-lg py-2.5 font-medium transition-colors ${
              stale ? "bg-primary hover:bg-primary-light text-white" : "bg-card-muted border border-card-border text-muted-fg"
            }`}
          >
            {stale ? "Run simulation →" : "Re-run"}
          </button>
        </aside>

        {/* ── Results ── */}
        <section>
          <div className="no-print flex items-center gap-2 mb-4">
            <button onClick={() => window.print()} title="Save or print this. The saved copy keeps the verdict and every warning shown here."
              className="rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2 transition-colors">
              Save / Print
            </button>
            <button onClick={copySummary} className="rounded-lg border border-card-border bg-card text-sm px-4 py-2 hover:border-primary transition-colors">
              {copied ? "Copied" : "Copy summary"}
            </button>
            {stale && <span className="text-xs text-warn ml-1">Controls changed — re-run to update results.</span>}
          </div>

          <div id="result-printable">
            <div className="mb-1 flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold">Stress-test result</h2>
              <span className="text-sm text-muted-fg tabular-nums">
                {fmt(ran.population)} customers · {ran.rounds} rounds · seed {ran.seed}
              </span>
            </div>

            {/* MUST-SHOW: verdict + warnings. Never dropped from the saved copy. */}
            <div className="rounded-xl border border-card-border bg-card p-5 my-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Verdict</h3>
              <p className="text-[15px] leading-relaxed text-foreground">{verdictText}</p>
              {warnings.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {warnings.map((w, i) => (
                    <span key={i} className={`text-xs rounded-full px-2.5 py-1 border ${
                      w.tone === "bad" ? "border-bad/40 text-bad bg-bad/10" : "border-warn/40 text-warn bg-warn/10"
                    }`}>{w.label}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Headline metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <Metric label="Net churn" value={`${churnPct}%`} tone={churnPct >= 30 ? "bad" : churnPct <= 0 ? "good" : undefined} />
              <Metric label="Ending active" value={`${fmt(result.endingActive)} / ${fmt(result.startingActive)}`} />
              <Metric label="Total revenue" value={fmt(result.totalRevenue)} />
              <Metric label="Exploit cost" value={fmt(result.exploitationCost)} tone={result.exploitationCost > result.totalRevenue * 0.08 ? "warn" : undefined} />
              <Metric label="Ending rep." value={`${Math.round(result.endingReputation)}`} tone={result.endingReputation < 70 ? "bad" : result.endingReputation > 100 ? "good" : undefined} />
              <Metric label="Lowest rep." value={`${Math.round(result.minReputation)}`} tone={result.minReputation < 70 ? "warn" : undefined} />
              <Metric label="Tipping round" value={result.tippingRound !== null ? `r${result.tippingRound}` : "none"} tone={result.tippingRound !== null ? "bad" : "good"} />
              <Metric label="Loss aversion λ" value={ran.lossAversion.toFixed(2)} />
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-card-border bg-card p-4 mb-5">
              <SimChart result={result} events={events} />
            </div>

            {/* Per-archetype survival */}
            <div className="rounded-xl border border-card-border bg-card p-5 mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-3">Segment survival</h3>
              <div className="space-y-2.5">
                {ARCHETYPES.map((a) => {
                  const pa = result.perArch[a.key];
                  const survRate = pa.start ? pa.survived / pa.start : 0;
                  return (
                    <div key={a.key} className="flex items-center gap-3">
                      <div className="w-40 shrink-0">
                        <div className="text-sm leading-tight" style={{ color: a.color }}>{a.name}</div>
                        <div className="text-xs text-muted-fg">{a.axelrod}</div>
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-card-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${survRate * 100}%`, backgroundColor: a.color, opacity: 0.85 }} />
                      </div>
                      <div className="w-24 shrink-0 text-right text-sm tabular-nums text-muted-fg">
                        {fmt(pa.survived)}/{fmt(pa.start)} <span className="text-foreground">{Math.round(survRate * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methodology */}
            <div className="rounded-xl border border-card-border bg-card-muted p-5 text-sm text-muted-fg leading-relaxed">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-fg mb-2">Methodology</h3>
              <p className="mb-2">
                The seven archetypes are adapted from strategies that did well in Axelrod&apos;s iterated
                prisoner&apos;s-dilemma tournaments (Axelrod, <em>The Evolution of Cooperation</em>, 1984):
                Tit-for-Tat, Tit-for-Two-Tats, Grim Trigger, Pavlov, and relatives. Each pairs that strategy
                with a behavioral-economics bias profile.
              </p>
              <p className="mb-2">
                Perception of a price or value change runs through prospect theory: losses loom larger than
                equivalent gains by a factor λ, set to 2.25 after Tversky &amp; Kahneman (1992). That figure
                is the classic anchor, not a law; meta-analytic estimates put the mean nearer 1.96 with a
                spread of roughly 1.5–3, so λ is exposed as a tunable dial rather than hard-coded.
              </p>
              <p>
                The engine is deliberately deterministic rather than a committee of LLM personas answering
                as fake customers. Correlated language models tend to agree with each other and with you,
                which manufactures false consensus; a transparent rule-based model is reproducible, auditable,
                and is itself the independent check on AI hand-waving. Same seed, same result, every run.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
