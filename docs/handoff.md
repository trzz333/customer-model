# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 input + comprehension layer is LIVE and verified. Engine frozen. This session
added the outside-view (reference-class + noise) band, a lifetime-value line, the
optional business-model paste with a snapshot card, and fixed the net-growth
who-leaves wart. Two production deploys landed READY (f2fcc6a, then cd40100).

## LAST COMMIT
cd40100 — fix: business-model paste shows a snapshot card. (f2fcc6a is the
substantive feature commit: outside-view band + paste + CLV line + wart fix.)

## CURRENT STATE
Two axes: define one business in plain terms (name, what-you-sell, an optional
full business-model paste, and four levers — price move, value posture, retention
play, competitive threat), then run it across named customer worlds. Each result
leads with its plain headline and, below the stat row, an outside-view anchor
("Is ~85 good? middle of the pack — across every world this business keeps 56–106
of 100") plus an honest lifetime-value line (rounds of full price per starting
customer, naming the promo leak). The cross-world "short version" banner carries
the same band. The paste shows as a one-line snapshot card that expands to the
full editable text and rides into the saved/printed copy in a `numbers` block.
`src/lib/business.ts` holds translation plus the new referenceBand / placeInBand /
unitEconomics. `src/lib/sim.ts` untouched. tsc clean, build green (12.2 kB).

## NEXT MOVE
Two-business A/B side-by-side compare, with the worst-case inversion finder folded
in: hold the customer world fixed, show the student's move-set against move B and
against the worst move-set for that world (sweep the small lever space — same
primitive as referenceBand). Engine frozen; UI + a second/third cfg. After that,
the shareable seeded run-link (encode inputs + seed in the URL) for assignments
and grading.

## DEPLOY STATE
- Local repo: YES, `main`, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed through cd40100.
- Vercel: READY and live. cd40100 → dpl_AHjsRmA, production, serving
  customer-model.council.fyi over HTTPS. Commits author as
  masterson3433@gmail.com, so the old jeff@local block can't recur.
- Subdomain: attached, Vercel-managed DNS, zero-touch.
- Env vars: NO. ANTHROPIC_API_KEY only needed if/when a voice layer ships; v1 is
  key-free and stays that way.

## DECISIONS LOCKED
Standalone project, not the council repo. Deterministic engine is the
differentiated core; not an LLM-respondent tool. Templates are CUSTOMER WORLDS
applied to a user-defined business. λ default 2.25, held constant across worlds.
Optional LLM voice is single-model, after v1, never a committee. Save invariant
ships in page.tsx + globals.css. NEW: the business-model paste is context that
travels with the run, NOT parsed into levers by an LLM in v1 — the student sets
the four levers themselves; that translation is the exercise, and v1 stays
key-free. NEW: an audit lens earns a place only if it is a cfg manipulation or a
result read on the frozen engine; reference-class + noise + inversion (one sweep)
and CLV (one read) qualified, Six Sigma and the writing-exercise lenses did not.

## OPEN QUESTIONS
1. Economic depth: the faculty review (embedded-browser, prior version) asks for
   a real finance layer — optional cost/margin input → cohort LTV / NPV, so one
   run serves marketing, finance, and managerial-econ classes. It adds input
   complexity that cuts against freshman cognitive ease. Build it, or hold v1 to
   the current unit-free CLV line? Jeff's call.
2. Voice/LLM layer: "after v1" is agreed; the only question left is whether it
   ever ships, and if so as archetype narration vs business autofill. Not urgent.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print over
   `#result-printable`, `@media print` in globals.css, verdict + warning chips
   must-show and always visible per card. Confirmed holding after this session —
   the outside-view anchor and CLV line are plain visible text; the pasted model
   rides in a `numbers` details that printAll() expands; verdict/chips unchanged.
   Never build a separate clean export that drops the verdict.
2. Engine API (frozen): runSimulation(cfg), verdict(cfg, r), DEFAULT_CONFIG,
   ARCHETYPES, ARCH_BY_KEY. The input layer only produces a cfg; never touch
   sim.ts or the λ default.
3. Build quirk: use the `cmd` shell, `npm install --include=dev`, then
   `npx tsc --noEmit` / `npm run build`. PowerShell blocks npm.ps1 and defaults
   to production-only installs. Commit messages with `;` or quotes get mangled
   through the PowerShell layer — commit via `git commit -F <file>`.
4. referenceBand sweeps 5 worlds × 7 seeds, runs in-browser via useMemo each
   render; deterministic and cheap. The NEXT MOVE inversion finder reuses the
   same sweep primitive over the lever space.
5. Faculty review priorities (history, this date), in order: A/B compare,
   shareable seeded run-links, the finance/LTV layer, a fuller methodology
   appendix; quick wins — relabel "keep ~107 of 100" as "End with ~107 (from
   100)" to stop conflating retention with acquisition, soften "the lever to pull
   first" to "the model suggests," add a glossary and a CSV of the per-round
   series. The relabel is the cheapest and rides with the A/B pass.
