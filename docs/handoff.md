# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and decision log live in docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 close-out, in progress. Shipped this session on the frozen engine: the
shareable seeded run-link, lz-string token compression, and the two-business
A/B compare with a cross-world inversion finder. Remaining v1: the cheap
faculty pair (glossary page + per-round CSV export), then optionally the
within-world single-lever fragility sweep. Engine (sim.ts) untouched all session.

## LAST COMMIT
4dc62b9 — v1 close-out: two-business A/B compare with cross-world inversion
finder. (Preceded this session by a601e75 compression, e67f31a run-link.)
typecheck clean, build green (21.3 kB).

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.0.0 (untouched) is a seeded agent-based Monte Carlo, λ default 2.25. Three new
v1 surfaces. (1) Run-link: a "Copy link" button encodes the displayed run
(levers, chosen worlds, difficulty, λ, rounds, finance) into a URL stamped with
ENGINE_VERSION; opening it re-runs the frozen engine, so a graded result
reproduces and the verdict + warnings regenerate from the numbers rather than
riding along as droppable text. A different engine version shows a mismatch
banner instead of silently returning different numbers. (2) Tokens are
compressed with lz-string (compressToEncodedURIComponent), marker "1"; a legacy
base64url decode path remains. (3) A "Compare a second business" toggle adds an
A-vs-B view: each chosen world is swept for both businesses, bands compared, and
any world whose winner contradicts the overall winner is surfaced as a
warning-class inversion callout ("overall A keeps more, but with the grudge crowd
B wins"). CompareBlock + the inversion sit inside #result-printable with no
export toggle, so they survive every saved copy. Save/Print, Copy writeup, and
Copy link are no-print chrome.

## NEXT MOVE
Finish v1 with the cheap faculty pair on the frozen engine: (1) a glossary page
(the Term defs already in page.tsx, surfaced as a standalone reference) and
(2) per-round CSV export (the engine's per-round rows: round, active, churned,
reputation, revenue — one CSV per swept world or per displayed run). Then,
optionally, the deferred within-world fragility sweep: hold one world fixed,
sweep A's small lever space, report the smallest single-lever change that flips
the verdict (reuses sweepWorld). The optional single-model LLM voice stays after
v1 closes.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: YES, trzz333/customer-model (private), pushed this session (4dc62b9).
- Vercel: live at customer-model.council.fyi; this session's pushes auto-deploy.
- Env vars: NO. v1 is key-free. New runtime dep: lz-string@1.5.0 (in
  dependencies). @anthropic-ai/sdk is present for the post-v1 voice layer, unused.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent tool. Templates are CUSTOMER WORLDS applied to a user business. λ
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. Optional LLM voice is single-model, after v1,
never a committee. ALWAYS PUSH. NO machine learning ("Monte Carlo" = run many
rolls, show the distribution). Two-mode UI (Class / Instructor; Finance is an
emphasis within Instructor, not a tier; no gates). Randomness is a
Calm/Normal/Harsh difficulty knob, never a student "seed." Headline is a band,
not a point. λ and seed claims stay CONDITIONAL. New this session: (a) the
run-link carries DIFFICULTY, not a raw seed — the band reproduces because
REF_SEEDS is fixed in code and pinned by the engine version. (b) lz-string is the
token codec; do not hand-roll compression. (c) the A/B inversion finder is the
CROSS-WORLD one (reference-class: winner flips between crowds); the within-world
single-lever fragility sweep is the deferred other reading, not a replacement.

## OPEN QUESTIONS
1. LLM voice layer: still "after v1"; the only question is whether it ever ships,
   and as archetype narration vs business autofill. Not urgent.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips must-show per card; details.numbers
   force-opened into both saved paths; selective export hides optional sections
   but verdict + warnings carry NO class and NO toggle, surviving every saved copy
   by construction. CONFIRMED HOLDING this session: CompareBlock and the inversion
   callout were added inside #result-printable with no export-hidden class, so the
   A/B verdict and the inversion survive Save/Print and Copy. Copy-link is no-print
   chrome. Never build a clean export that drops the verdict; never add a toggle
   that can drop verdict/warnings/inversion.
2. ALWAYS PUSH (standing, Jeff): push every code-changing session. Three pushes
   this session.
3. BUILD QUIRK (load-bearing): a bare `npm install <pkg>` PRUNES devDependencies
   (typescript included) and breaks the build. Always restore with
   `npm install --include=dev`. Validate sequence: cmd shell, npm run typecheck
   (NOT `npx tsc` — npx misresolves to a bogus tsc@2.0.4), npm run build,
   git add <scoped paths>, commit -F, push. typescript pinned 5.8.2.
4. RUN-LINK URL BOUNDARY: lz-string keeps typical links tiny, but a pasted
   novel-length business model can still exceed practical URL limits. The schema
   is version-marked, so a stronger codec (e.g. a gzip CompressionStream variant)
   can be added later without breaking existing links. Not worth solving for v1.
5. ENGINE IS MONTE CARLO / REF_SEEDS FIXED (load-bearing for run-link + compare):
   runSimulation seeds a mulberry32 RNG; the per-100 headline is one sample and a
   different seed moves it ~5-8 pts even at noise 0, which is why the headline is a
   band over the fixed internal REF_SEEDS. Both the run-link and the A/B sweep rely
   on REF_SEEDS being constant in code and pinned by ENGINE_VERSION.
