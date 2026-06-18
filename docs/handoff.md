# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and decision log live in docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 input + comprehension + finance layers LIVE. The demographic-fit redesign
shipped this session (two-mode UI, per-world Monte-Carlo band headline,
Calm/Normal/Harsh difficulty knob, 8th-grade term hovers, selective export);
engine untouched. Next phase is v1 close-out: a shareable seeded run-link and a
two-business A/B compare.

## LAST COMMIT
900b648 — demographic-fit redesign: two-mode UI, per-world Monte-Carlo band,
difficulty knob, term hovers, selective export. Engine (sim.ts) not touched.
tsc clean, build green (17.3 kB).

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine
2.0.0 (untouched) is an agent-based, seeded Monte Carlo: a HJF-1993 / TK-1992
reference-dependent logit per customer per round, λ default 2.25. A top control
picks Class (default, plain, no dials), Instructor (dials + behavioral detail),
or Finance focus (Instructor with the dollar table led and behavioral methodology
folded away); no gates on any mode. Each customer-world card now leads with a
Monte-Carlo BAND headline (typical run + luck range from a per-world multi-seed
sweep), a dot-strip of every roll, and a "watch it play out" button that re-rolls
the live chart; the representative roll is the median seed so chart/story/numbers
agree. Randomness is a Calm/Normal/Harsh difficulty knob (engine noise
0.02/0.05/0.12); "seed" is gone from the surface. Surviving jargon carries
8th-grade hover defs. Save/Print and Copy read #result-printable; an
instructor-only selective-export panel hides optional sections, but verdict +
warning chips have no toggle and survive every saved copy by construction.

## NEXT MOVE
v1 close-out, on the current frozen engine (cfg + result reads only):
(1) shareable seeded run-link — encode business inputs + difficulty + λ + rounds
+ ENGINE_VERSION into the URL so any saved/graded result reproduces against a
known engine (this is the grading/answer-key primitive); (2) two-business A/B
side-by-side compare, with the worst-case inversion finder folded in (hold the
world fixed, sweep the small lever space — same sweep primitive as sweepWorld /
referenceBand). Then the cheap faculty-requested pair: a glossary page and a
per-round CSV export. The optional single-model LLM voice stays after v1.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session.
- Vercel: live at customer-model.council.fyi; this session's pushes auto-deploy.
- Env vars: NO. v1 is key-free.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent tool. Templates are CUSTOMER WORLDS applied to a user business. λ
default 2.25, held constant across worlds. Engine evolves by versioned release,
never live auto-tuning; ENGINE_VERSION stamps every result. Optional LLM voice is
single-model, after v1, never a committee. Business paste travels with the run, not
LLM-parsed into levers in v1. ALWAYS PUSH. (a) NO machine
learning — "Monte Carlo" here means run many rolls and show the distribution, never
fit or train a model; ML would destroy the auditable-not-a-black-box differentiator.
(b) Two-mode UI (SHIPPED): jargon-free Class view by default, Instructor view for the
knobs / numbers / export. Finance focus is an EMPHASIS within Instructor (lead with
dollars, fold behavioral econ), NOT a third access tier. No gates on any mode — any
mode is open to anyone, for ease of reading, not access control. (c) Randomness is
an instructor difficulty knob (Calm/Normal/Harsh → noise), never a student-facing
"seed." (d) The headline is a band (median + range over many rolls), not a
single-seed point. (e) λ and seed claims stay CONDITIONAL — never reassert
"slide λ and the verdicts move" or "the seed only freezes noise" (both verified
false).

## OPEN QUESTIONS
1. LLM voice layer: still "after v1"; the only question is whether it ever ships,
   and as archetype narration vs business autofill. Not urgent.
2. (RESOLVED) Instructor-view access is a plain toggle, no gate — Jeff: no gates on
   any mode. Moved to history.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy over
   #result-printable; verdict + warning chips must-show per card; details.numbers
   force-opened into both saved paths. Selective export SHIPPED this session: an
   instructor-only checkbox panel hides optional sections via .export-hidden
   (@media print drops them; copyWriteup display:none's them before reading), but
   verdict + warning chips carry NO class and NO toggle, so they survive every
   saved copy BY CONSTRUCTION. Confirmed holding. Never build a separate clean
   export that drops the verdict; never add a toggle that can drop verdict/warnings.
2. ALWAYS PUSH (standing, Jeff): push every code-changing session; stale prod breaks
   the embedded-reviewer loop. Hard stops only: no secrets, never drop the verdict.
3. ENGINE IS MONTE CARLO (load-bearing for the band work): runSimulation seeds a
   mulberry32 RNG used in FIVE places — population sampling in spawn(), the pDefect
   Bernoulli, the noise flip, competitor-pull, and the friction-gate churn. The seed
   fixes the whole roll, not just noise; the per-100 headline is one sample, and a
   different seed moves it ~5-8 pts even at noise 0. That is why the band is the
   right headline. Verified by an offline sweep (tmp compile of sim.ts + business.ts).
4. λ IS CONDITIONAL (verified by sweep): swing runs 0 (no perceived loss) to ~40 pts
   (big unbuffered loss with headroom: raiseB + premium + no retention), single
   digits on buffered/absorbed losses, ~1 when floored. The old "15-24 pts monotonic"
   claim was overstated; corrected in copy and here.
5. EMBEDDED AUDIT HARNESS lesson: the next audit prompt must NOT seed the session
   with this dev bootstrap — the first audit read its own seed back off the clipboard
   and falsely reported "Copy emits the bootstrap." Require read-back-literally
   (navigator.clipboard.readText) for any save/copy claim, and judge Print via the
   printAll force-open in the click handler, not @media print CSS alone (that error
   produced the second audit's false "Print drops finance/segment tables" finding;
   its "rival early/late lever cosmetic" was also wrong — mild = 0.6*rounds/offer 30,
   hard = 0.4*rounds/offer 60). Build quirk: cmd shell, npm install --include=dev,
   npx tsc, commit -F (PowerShell mangles ; and quotes).
