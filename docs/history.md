# Customer Model — History

Evicted detail from handoff.md. Append-only, dated.

## 2026-06-17 — Engine calibration (resolved)

The engine was built then calibrated through three real bugs, each caught by
running `smoke.ts` rather than eyeballing the code:

1. Death spiral. First run: default scenario lost 100% of customers and
   reputation hit 0 every time. Cause: a price hike read through λ=2.25 as a
   large perceived loss for ~13 rounds before expectations re-anchored, so
   nearly everyone defected at once; reputation only ever decayed, with no
   equilibrium, so acquisition starved permanently. Fix: reputation now
   mean-reverts toward a target set by survivor satisfaction minus churn-driven
   negative word-of-mouth; competitor lure fades after entry; churn is gentler
   and friction-protected; a deadband (fairness < -15) means only real
   grievances flip a customer to defect, not every small gap; faster
   re-anchoring (refAdapt 0.25).

2. Over-forgiving acquisition. After fix 1, the default read as net growth
   because acquisition masked the loss of the grim-trigger segment. Fix:
   acquisition rate lowered (0.05 → 0.03) and gated at reputation > 100.

3. Misleading reputation readout. Harsh scenario showed reputation ~107 despite
   98% churn, because by the final round almost no one was left to churn and the
   handful of survivors were content. Fix: report `minReputation` (the trough),
   not the final tick, in the verdict's reputation clause.

Final calibrated behavior: default holds (~14% net churn) but wipes the
grim-trigger segment at the round-12 hike; harsh preset collapses (~98%);
determinism verified across reruns. Default scenario also softened (hikeSize
18→10, competitorOffer 35→28, friction 30→35, competitorRound 22→26).

## 2026-06-17 — Architecture decisions (settled, see handoff DECISIONS LOCKED)

Prisoner's-dilemma adaptation: kept the Axelrod strategy personalities + the
iterated tournament structure; dropped the symmetric payoff matrix (business↔
customer is asymmetric). Multi-model deliberation verified as redundant among
correlated models; bounded single-model is the default, with the deterministic
engine serving as the independent verification channel. URL settled as a
subdomain (a path on council.fyi would route through the council project).

## 2026-06-17 — UI build + validation gate + repo init (resolved)

Built `src/app/page.tsx` against the real engine API. Controls cover the full
SimConfig; results recompute from the last-run config with a stale badge so the
chart can't silently disagree with the sliders. Results surface wrapped as
`#result-printable` with the verdict + warning chips first (must-show), then
metrics, a hand-rolled two-panel SVG chart, per-archetype survival bars, and a
sourced methodology note. Save/Print + Copy kept outside the printable region;
`@media print` isolation added to globals.css with `print-color-adjust: exact`
so the chart and bars survive on white while text is forced dark.

Validation gate run and GREEN. Snags resolved along the way: (1) this machine's
npm defaults to production installs, so dev deps (typescript, tailwind, types)
were missing and `tsc` wasn't found — fixed with `npm install --include=dev`;
(2) typecheck failed only on `smoke.ts` (imports `sim.ts` with a `.ts`
extension) — excluded it in tsconfig per its scratch-file status; (3) `next
build` then compiled clean, page prerenders static at 8.25 kB. Local git repo
initialized on `main` with scoped adds (never -A); `.gitignore` extended to
cover `next-env.d.ts` and `*.tsbuildinfo`. No remote yet.

## 2026-06-17 — DNS question resolved + save-button baked into the skill

DNS for the subdomain is no longer an open question. Checked Vercel directly:
council.fyi is attached to the council project (prj_OpOXxeBjNpjWcykSfd9oegJPmuOF)
on team_Lh2oOhJYVaJF4VhuRQPnyNa9, and an NS lookup shows council.fyi on
ns1/ns2.vercel-dns.com — Vercel-managed DNS. So the subdomain is zero-touch:
add it to the new Vercel project and Vercel provisions the record + cert. No
registrar CNAME.

The save-button invariant was promoted from a handoff NOTE into the ai-handoff
skill itself (skills/ai-handoff/SKILL.md): a dedicated do-not-violate section, a
reserved permanent NOTES slot in the schema, and a clause in the always-loaded
description. Packaged via skill-creator to an installable `ai-handoff.skill`
(description trimmed to fit the 1024-char cap). Repo copy and packaged copy are
identical.
