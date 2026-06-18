# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and decision log live in docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 input + comprehension + finance layers LIVE. Two embedded faculty audits run
this session and reconciled against the source and an offline engine sweep; an
honesty pass shipped (λ and seed claims are now conditional). Next phase is a
demographic-fit UI redesign (two modes + a Monte-Carlo distribution headline),
decided and researched this session, not yet built.

## LAST COMMIT
643577e — condition the λ and seed claims to match measured behavior (Methodology
+ Advanced panel). Earlier this session: c9d1157 (copyWriteup force-opens
details.numbers so the finance and segment blocks survive Copy).

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine
2.0.0 is an agent-based, seeded Monte Carlo: a HJF-1993 / TK-1992 reference-
dependent logit per customer per round, λ default 2.25. Results lead with a plain-
language headline, a short-version synth banner, per-world verdict + warning chips,
an optional finance block ($ revenue / contribution / NPV / LTV:CAC / payback), and
a collapsed numbers dashboard. Save/Print and Copy writeup both force-open every
details.numbers inside #result-printable, so both saved paths carry the full record
including finance. tsc clean, build green (14.3 kB).

## NEXT MOVE
Demographic-fit redesign for an average business-school freshman, built in one
coherent pass (do NOT half-ship): (1) a two-mode UI — a default jargon-free "Class
view" and an "Instructor view" that holds the knobs; (2) replace the single-seed
point headline with a Monte-Carlo BAND — run many rolls per world, report median +
range in plain words ("usually keeps ~84 of 100, somewhere between 78 and 90");
(3) optional HOPs-style "watch it play out" re-roll animation so the spread is felt,
not decoded; (4) info hovers at ~8th-grade reading level on every surviving term;
(5) move randomness to an instructor difficulty control (the Capsim pattern) and
kill the word "seed" from the student surface; (6) selective export (instructor
picks which sections travel into the saved copy), save-invariant preserved. The
band work lives in business.ts (a per-world multi-seed sweep, reuse referenceBand's
machinery) plus page.tsx. The frozen engine (sim.ts) is NOT touched.

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
LLM-parsed into levers in v1. ALWAYS PUSH. NEW THIS SESSION: (a) NO machine
learning — "Monte Carlo" here means run many rolls and show the distribution, never
fit or train a model; ML would destroy the auditable-not-a-black-box differentiator.
(b) Two-mode UI: jargon-free Class view by default, Instructor view for the
knobs / numbers / export. (c) Randomness is an instructor difficulty knob, never a
student-facing "seed." (d) The headline is a band (median + range over many rolls),
not a single-seed point. (e) λ and seed claims stay CONDITIONAL — never reassert
"slide λ and the verdicts move" or "the seed only freezes noise" (both verified
false this session).

## OPEN QUESTIONS
1. LLM voice layer: still "after v1"; the only question is whether it ever ships,
   and as archetype narration vs business autofill. Not urgent.
2. Instructor view access: plain toggle vs gated by link/param? Product call for
   Jeff when the redesign starts; default to a plain toggle unless he says otherwise.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy over
   #result-printable; verdict + warning chips must-show per card; details.numbers
   force-opened into both saved paths. Confirmed holding this session. Never build a
   separate clean export that drops the verdict. The planned selective export must
   keep verdict + warnings non-optional.
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
