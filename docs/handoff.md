# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and decision log live in docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 build complete. The whole v1 surface list is shipped on the frozen engine
(sim.ts untouched all session). What remains for "v1 closed" is one decision,
not a build: whether the optional single-model LLM voice ever ships. The
faculty-review pass (skeptical seasoned B-school reviewer) is the natural gate
on calling v1 done.

## LAST COMMIT
e0804c8 — v1: within-world single-lever fragility sweep. (Preceded this session
by 4208bbc, the glossary page + per-round CSV export.) typecheck clean, build
green (/ 23.2 kB, /glossary static 123 B).

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.0.0 (untouched) is a seeded agent-based Monte Carlo, λ default 2.25, headline
is a band. Surfaces now in place: per-world cards with verdict + warnings; the
cross-world A/B compare with its inversion finder; the shareable seeded run-link
(carries difficulty not a seed, stamped with ENGINE_VERSION, lz-string codec).
New this session: (1) a standalone /glossary route — terms, customer worlds, and
archetypes — fed by TERM_DEFS in business.ts, the single source the inline
hovers also use, reached from a no-print header link. (2) a "Download CSV" button
(no-print chrome) that dumps the median run's per-round engine rows for every
swept world as one CSV with a world column. (3) a within-world fragility sweep:
an opt-in instructor toggle that, per chosen world, reports the lightest single
business-move change that flips the verdict band (or declares the business
robust), rendered inside #result-printable, export-toggleable, and threaded
through the run-link as additive field "fr".

## NEXT MOVE
Run the faculty-review prompt (a skeptical seasoned B-school faculty persona
exercising the live tool) and triage its findings — that's the gate on declaring
v1 closed. The prompt was generated this session; it lives in chat, not the repo.
The only build-or-not fork left is the single-model LLM voice (archetype
narration vs business autofill); it stays deferred until v1 is called closed.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session (e0804c8).
- Vercel: live at customer-model.council.fyi; this session's pushes auto-deploy.
- Env vars: NO. v1 is key-free. @anthropic-ai/sdk present but unused (post-v1
  voice). lz-string@1.5.0 is the one runtime dep added for the run-link.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent tool. Templates are CUSTOMER WORLDS applied to a user business. λ
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. Optional LLM voice is single-model, after v1,
never a committee. ALWAYS PUSH. NO machine learning. Two-mode UI (Class /
Instructor; Finance is an emphasis within Instructor, not a tier; no gates).
Randomness is a Calm/Normal/Harsh difficulty knob, never a student "seed."
Headline is a band, not a point. λ and seed claims stay CONDITIONAL. The run-link
carries DIFFICULTY not a raw seed; lz-string is the token codec, do not hand-roll.
The A/B inversion finder is the CROSS-WORLD one; the fragility sweep is the
WITHIN-WORLD single-lever one — both now shipped, not alternatives. CSV is a raw
data dump and carries no verdict text; that is correct, not a save-invariant gap.

## OPEN QUESTIONS
1. LLM voice layer: still "after v1." The fork is whether it ships at all, and as
   archetype narration vs business autofill (autofill would put an API key in the
   loop for the first time). Not urgent; wait on the faculty review.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips must-show per card; details.numbers
   force-opened into both saved paths; selective export hides optional sections
   but verdict + warnings carry NO class and NO toggle, surviving every saved copy
   by construction. CONFIRMED HOLDING this session: the new FragilityBlock was
   added inside #result-printable as an optional (export-toggleable) section, not
   a verdict/warning, so it cannot dilute the invariant; the glossary link and the
   Download CSV button are no-print chrome; print CSS untouched. Never build a
   clean export that drops the verdict; never add a toggle that can drop
   verdict/warnings/inversion.
2. ALWAYS PUSH (standing, Jeff): push every code-changing session. Two pushes this
   session (4208bbc, e0804c8).
3. BUILD QUIRK (load-bearing): a bare `npm install <pkg>` PRUNES devDependencies
   (typescript included) and breaks the build. Restore with
   `npm install --include=dev`. Validate sequence: cmd shell, npm run typecheck
   (NOT `npx tsc` — npx misresolves to a bogus tsc@2.0.4), npm run build,
   git add <scoped paths>, commit -F, push. typescript pinned 5.8.2.
4. TERM DEFS SINGLE SOURCE: the plain-language hover defs live ONCE, as TERM_DEFS
   in business.ts; page.tsx aliases it (`const DEF = TERM_DEFS`) and GLOSSARY is
   derived from it. Edit defs in one place; both the inline hovers and /glossary
   update.
5. FRAGILITY COST: the sweep runs ~10 single-lever variants × 7 seeds per chosen
   world, so it is opt-in (off by default) and only computed when ran.fragility is
   set. If it ever feels slow with all five worlds picked, that is why; it is not
   on the default path.
