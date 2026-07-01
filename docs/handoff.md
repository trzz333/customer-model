# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and the LLM-voice recommendation live in docs/plan.md. The v2
build spec, pre-registered sweeps, and RESOLVED taste-fork decisions live in
docs/design-note-v2.md. The evolution challenger's pre-registration lives in
docs/design-note-evolution.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v2 SHIPPED and stable at ENGINE_VERSION 2.2.0. New active thread: an EVOLUTION
(EGT / Moran) challenger. Jeff deliberately reopened the deterministic-core lock
on 2026-06-30 to add a stochastic selection layer, under the hard invariant that
stochastic in mechanism still means reproducible in output (seed regenerates the
run bit for bit). The challenger MODULE is built, committed, and isolated; it is
NOT promoted. The LLM voice layer is still a separate, later, unstarted session.

## LAST COMMIT
e4025ec — feat(evo): 2.3.0 evolution challenger module + pre-registration. Adds
src/lib/evolution.ts (isolated; wraps the frozen runSimulation, never edits it) and
docs/design-note-evolution.md. Champion path git-verified untouched, ENGINE_VERSION
still 2.2.0, nothing imports the module, / bundle unchanged at 27.7 kB, typecheck and
build green. Re-confirm HEAD with git rev-parse; do not trust a hardcoded hash.

## CURRENT STATE
The live site is exactly 2.2.0, functionally unchanged: define one business in plain
terms, run it across named customer worlds; seeded agent-based Monte Carlo on a
reference-dependent logit core (λ 2.25, headline a band), with reference-price
anchoring and peak-end reputation memory. New on disk (not live-visible): a Moran-
adjacent evolution layer in src/lib/evolution.ts. It measures a retention payoff
matrix from the real engine, then runs a deterministic replicator or a stochastic
Fermi/Moran ensemble with mutation, plus a closed-form pairwise fixation and the
small-mutation analytic stationary distribution. Its reproducibility spine is CRN
substreams keyed by (runSeed, rep, step, channel), so the ensemble is order-
independent and regenerates from runSeed. It carries a settled-composition verdict
and fragility warnings. Nothing imports it; the champion is byte-identical.

## NEXT MOVE
Write and run sweep-evolution.ts at the repo ROOT (excluded from tsconfig by glob),
run via `npx --yes tsx sweep-evolution.ts`. Gates, pre-registered in
design-note-evolution.md: G1 champion untouched, G2 regeneration (same runSeed
deep-equal; different seed moves), G3 order-independence (forward vs reversed replicate
order aggregate identically; replicateFinal and measureMatrix are exported for this),
G4 fixation-formula Monte Carlo vs closed form (tolerance ~0.03). The multi-type
stationary-vs-ensemble comparison is a DIAGNOSTIC, not a hard gate. Report gate results
honestly; a G4 fail is an acceptable outcome, not a thing to fudge. ONLY if G1-G4 pass:
promote — bump ENGINE_VERSION to 2.3.0, extend runLinkReproducesExactly for the
2.2.0<->2.3.0 evolution-off pair (mirror the 2.0.0<->2.1.0 anchor-off precedent), add
run-link fields emitted only when the layer is on (existing tokens stay byte-identical),
and surface in the Deep tier only with the settled-composition verdict + warnings inside
#result-printable. The LLM voice layer stays a separate later session.

## DEPLOY STATE
- Local repo: YES, main, scoped commits. GitHub: trzz333/customer-model — PUBLIC.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push. The
  e4025ec deploy is functionally identical to 2.2.0 (the new module is inert, unimported).
- Open Graph / social unfurl: SET UP; layout.tsx exports metadata; src/app/opengraph-image.png (1200x630) via Next's file convention. Image generator off-repo at C:\Users\Public\cm_make_og.py.
- Env vars: NO. Still key-free. @anthropic-ai/sdk present but unused (voice layer). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. λ default
2.25. Engine evolves by versioned release; ENGINE_VERSION stamps every result. NO
machine learning. ALWAYS PUSH. Champion-challenger discipline: bump ENGINE_VERSION,
pre-registered sweep before promote, off/identity paths byte-identical, rollback via git.
- EVOLUTION LAYER (2026-06-30): the deterministic-core lock was deliberately reopened by
  Jeff to add a stochastic selection layer. Hard invariant: stochastic in mechanism,
  reproducible in output — every run regenerates bit for bit from its seed via seeded CRN
  substreams. Ships as an ISOLATED challenger, promoted only via a passing sweep. The
  analytic stationary distribution is the theory anchor. QRE (McKelvey-Palfrey 1995) +
  risk-averse QRE (Mazumdar 2025) are the STAGED next stochastic-choice lever, not built.
- AUTONOMY (standing): Claude makes all engineering and engineering-adjacent calls,
  including taste forks and effect-sizing. Surface a question ONLY for a genuine
  vision/values fork. PRIOR-ART FIRST; when prior art contradicts the plan, prior art wins.
- MINIMAL BY DEFAULT, depth on demand. Three DEPTH tiers (Student / Teaching / Deep),
  Finance a toggle in Teaching + Deep. Fresh visit opens BLANK with a How-this-works panel.
  A run-link opens at the author's shared tier (Teaching/Deep carried as `vw`). The
  evolution layer, when promoted, surfaces in Deep only.
- LLM voice: single-model, narration-first, cached/pinned to the run-link, labeled the one
  non-reproducible layer. DIRECTION LOCKED (2026-06-19). Its own dedicated session with its
  own pre-registration. Still unbuilt.

## OPEN QUESTIONS
None for Jeff. The determinism reopening was his explicit call; the sweep is execution,
not a fork. Deep-tier-only placement for the evolution surface is Claude's taste call,
already decided (see design-note-evolution.md). The LLM-voice direction is resolved.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; the verdict + warning chips carry NO export class and NO toggle, so
   they survive every saved copy by construction; export is gated to the post-run expanded
   state. Confirmed structurally intact this session: no page.tsx or globals.css change (git
   shows only evolution.ts + design-note-evolution.md). When the evolution layer is surfaced,
   its settled-composition verdict + fragility warnings MUST live inside #result-printable
   with no export/toggle class, same as WorldCard. Re-confirm on any page.tsx change.
2. EVOLUTION MODULE (src/lib/evolution.ts, committed e4025ec, NOT promoted): imports only
   ./sim. Defaults EVO_DEFAULTS (probeFreq 0.12, fitnessPop 400, fitnessSeed 991, slots 60,
   beta 6, mutation 0.02, replicates 24; generations 240000 is sized for a long single-chain
   diagnostic, the ensemble uses fewer per replicate — the sweep tunes these). subRng is the
   CRN substream. replicateFinal + measureMatrix + fixation are exported for the sweep. A
   leaf beyond ./sim, so the sweep needs `npx --yes tsx` (extensionless ./src imports).
3. SWEEP not yet written. Gates G1-G4 in design-note-evolution.md. Root sweep*.ts / smoke*.ts
   are excluded from tsconfig by glob, so a new sweep file won't break typecheck; delete or
   leave-unstaged scratch, commit the sweep as reproducibility evidence like sweep-peakend.ts.
4. PRIOR ART verified 2026-06-30 (do not re-derive): Axelrod ecological + Axelrod-Python;
   Fudenberg-Imhof 2006 (SSWM stationary, closed form); Traulsen et al 2007 (Fermi/selection
   temp); Hindersin et al 2019 (fixation numerics); Starsim/Covasim 2024 + L'Ecuyer (CRN
   per-entity substreams = the order-dependence fix); QRE + RQE (staged next lever).
5. BUILD/VALIDATE: cmd shell (PowerShell mangles && and git args). `npm run typecheck` then
   `npm run build`. Scoped git add (never -A), commit via `git commit -F C:\Users\Public\
   cm_commit.txt` then delete it in the same chained command, push. A bare `npm install <pkg>`
   prunes devDeps and breaks the build; restore with `npm install --include=dev`.
