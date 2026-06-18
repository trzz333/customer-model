# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and decision log live in docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 input + comprehension layer LIVE and verified. This session UNFROZE the engine
to make loss aversion λ genuinely load-bearing, shipped the optional finance
layer, and completed an honesty pass triggered by a faculty/embedded audit.

## LAST COMMIT
aef3b0c — unfreeze engine to make λ load-bearing (HJF/TK reference-dependent
logit), followed by the engine-version stamp + evolution-policy commit. Prior:
945a1ba (honesty pass + finance layer).

## CURRENT STATE
Define one business in plain terms (name, what-you-sell, optional full model
paste, four levers: price move, value posture, retention play, competitive
threat), run it across named customer worlds. The perception core was rebuilt:
each round the customer scores price and value against an adapting reference
point through a reference-dependent value function (Tversky-Kahneman 1992, losses
weighted ×λ, diminishing sensitivity α=0.88) feeding a logit defect probability —
the Hardie-Johnson-Fader (1993) reference-dependent choice model. λ is now
load-bearing: a λ sweep moves the headline 15–24 points on builds with headroom,
monotonic; only the maximal-catastrophe build floors (correctly). Results lead
with a per-100-started headline (relabeled from the incoherent "keep X of 100"),
an outside-view band, an honest lifetime-value line, and verdict/warning chips.
Optional finance block (off until a launch price is entered) reads each run into
dollars: revenue, contribution, NPV, LTV:CAC, payback. `src/lib/sim.ts` holds the
new engine; `src/lib/business.ts` holds translation + reads. tsc clean, build
green (14.1 kB).

## NEXT MOVE
Two-business A/B side-by-side compare, worst-case inversion finder folded in:
hold the world fixed, show the student's move-set vs move B and vs the worst
move-set for that world (sweep the small lever space — same primitive as
referenceBand). UI + extra cfg. Then the shareable seeded run-link (encode
inputs + seed in the URL) for assignments and grading.

## DEPLOY STATE
- Local repo: YES, `main`, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session.
- Vercel: READY and live, deploy triggered by this session's push, serving
  customer-model.council.fyi over HTTPS. Commits author as masterson3433@gmail.com.
- Subdomain: attached, Vercel-managed DNS, zero-touch.
- Env vars: NO. v1 is key-free; ANTHROPIC_API_KEY only if a voice layer ships.

## DECISIONS LOCKED
Standalone project, not the council repo. Deterministic, reproducible, auditable
core — not an LLM-respondent tool. Templates are CUSTOMER WORLDS applied to a
user-defined business. λ default 2.25, held constant across worlds as the shared
science. Optional LLM voice is single-model, after v1, never a committee. The
business-model paste is context that travels with the run, NOT LLM-parsed into
levers in v1 (the student sets the levers; that's the exercise); v1 stays
key-free. NEW: the engine is disciplined but not permanently sealed — it was
unfrozen this session to make λ load-bearing (HJF 1993 / TK 1992 reference-
dependent logit), verified by a sweep, and is treated as re-frozen on this new
core. ENGINE EVOLUTION POLICY (researched, plan.md): evolve by versioned release,
never by live runtime auto-tuning; recalibrate only offline against a held-out
check; `ENGINE_VERSION` (sim.ts, now 2.0.0) is stamped on every result and will
be baked into the seeded run-link. NEW: ALWAYS PUSH (see NOTES).

## OPEN QUESTIONS
1. Voice/LLM layer: "after v1" agreed; the only question is whether it ever
   ships, and if so as archetype narration vs business autofill. Not urgent.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print over
   `#result-printable`, `@media print` in globals.css, verdict + warning chips
   must-show and always visible per card. Finance block carries class `numbers`
   so printAll() force-opens it into the saved copy. Confirmed holding this
   session. Never build a separate clean export that drops the verdict.
2. ALWAYS PUSH (standing instruction, Jeff, 2026-06): only Jeff and Claude view
   the public site, so there is no "safe to publish" gate. Push every session
   that changes code; a stale prod breaks the embedded-reviewer audit loop. Hard
   stops only: never push a secret, never ship a results surface that drops the
   verdict. Baked into the ai-handoff skill.
3. Engine API: runSimulation(cfg), verdict(cfg, r), DEFAULT_CONFIG, ARCHETYPES,
   ARCH_BY_KEY. Perception core (this session): reference-dependent utility →
   logit pDefect → strategy intent → friction-gated churn; constants PT_ALPHA,
   PERC_TOL, PERC_TEMP plus the grievance term carry λ. The input layer produces
   a cfg; keep the λ default at 2.25.
4. Build quirk: use `cmd` shell, `npm install --include=dev`, then `npx tsc
   --noEmit` / `npm run build`. PowerShell blocks npm.ps1 / defaults to prod-only
   installs. Commit messages with `;` or quotes mangle through PowerShell — use
   `git commit -F <file>`. To test the engine in isolation, compile sim.ts alone
   (`npx tsc src/lib/sim.ts --outDir tmp --module commonjs`) and sweep it in node.
5. Faculty review priorities (plan.md): A/B compare, seeded run-links, finance
   calendar-mapping for NPV, methodology appendix; retention vocabulary / nudges
   parked as the richest v2 idea.
