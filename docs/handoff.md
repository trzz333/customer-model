# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v2 BUILD. Mechanisms #1 (retention vocabulary), #2 (anchoring / reference-price
framing), and #3 (peak-end reputation memory) are all SHIPPED and verified. #2 is now
fully user-reachable (engine + UI control + run-link). #3 is the current engine,
ENGINE_VERSION 2.2.0. Engine freeze is LIFTED (standing). What's left of the planned
v2 spine is the deferred retention schema-bump and the held mechanisms; the LLM voice
remains the one open product/values fork.

## LAST COMMIT
76016f3 — feat: peak-end reputation memory (ENGINE_VERSION 2.2.0). Preceded by 48a02ef
(anchoring UI + run-link exposure). typecheck clean, build green, / at 26 kB. Both
sweeps pass on 2.2.0; smoke determinism PASS. Re-confirm HEAD with git rev-parse;
don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine 2.2.0
is a seeded agent-based Monte Carlo on a reference-dependent logit core (λ 2.25,
headline is a band), with two off-the-shelf behavioral frames now live: reference-price
anchoring (a decaying frame that lifts the JUDGED price without moving real price) and
peak-end reputation MEMORY (acquisition runs off how the whole relationship is
remembered — average-dominant, first-impression-led, modest peak/end — not the latest
round). All v1 surfaces live: per-world cards (verdict + warn chips), A/B compare +
inversion finder, fragility sweep, seeded run-link, /glossary, per-round CSV, three
depth tiers (Student / Teaching / Deep) with a Finance toggle. Anchoring is exposed as
a Teaching/Deep control (off the Student read) and persists in the run-link
(backward-compatible, anchor-off tokens byte-identical to old links). Peak-end is
calibrated engine science, not a user lever; the deep methodology names it. The save
invariant holds (verdict + warnings can't drop from a saved copy, by construction).

## NEXT MOVE
My call: build the DEFERRED RETENTION SCHEMA-BUMP (design-note §1 reconciliation). Two
parts, both versioned input-layer steps, not an ENGINE_VERSION bump: (a) add
default/auto-renew as a NEW Retention enum value (new cfg mapping — a distinct
inertia-plus-endorsement nudge, NOT just more friction and NOT the standing promo),
carrying the contested-nudge caveat in its def (Mertens 2022 d≈0.43 vs Maier 2022 PNAS
null after publication-bias correction); (b) split the current "lock-in" option into
separate "contract" and "switching cost" options instead of the disclosed conflation.
Both touch the Retention enum + businessToCfg + RETENTION_MECHANISMS table + the
run-link RETENTIONS array (additive: old links decode via the pick fallback, so
backward-compatible). Single source of truth: extend RETENTION_MECHANISMS; FIELDS /
RET_DESC / GLOSSARY derive. No engine math. Alternative if you'd rather: surface a
peak-end visual in Deep dive (remembered vs raw reputation), but that's polish, not the
next spine step.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: trzz333/customer-model — PUBLIC (Professor Bonner can read docs without an
  account). Pushed this session's two code commits + docs.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push.
  Runtime is now engine 2.2.0 (peak-end live; anchoring control reachable in
  Teaching/Deep). Default-run numbers shifted slightly vs 2.1.0 (peak-end), expected.
- Env vars: NO. v2 so far is key-free. @anthropic-ai/sdk present but unused (post-spine
  voice layer). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. λ default
2.25, held constant across worlds. Engine evolves by versioned release; ENGINE_VERSION
stamps every result. NO machine learning. ALWAYS PUSH.
- Engine FREEZE LIFTED (standing): Claude versions sim.ts without per-edit
  authorization, keeping champion-challenger discipline (bump ENGINE_VERSION, verify
  with a pre-registered sweep before promoting, off-by-default/identity paths
  byte-identical, archive via git). Never silent runtime auto-tuning.
- AUTONOMY (standing): Claude makes all engineering AND engineering-adjacent calls,
  including parked taste forks and effect-sizing. Jeff supplies vision; Claude executes
  faithfully on evidence. Surface a question ONLY for a genuine vision/values fork.
  PRIOR-ART FIRST always; when prior art contradicts the plan, prior art wins and the
  plan is reconciled in writing (this session: peak-end gate reconciliation).
- Three DEPTH tiers (Student / Teaching / Deep), Finance a toggle in Teaching + Deep.
  Fresh visit opens Teaching; a run-link opens Student.
- Anchoring exposure: Teaching/Deep only, not the Student read (teachable but
  exploitable). Peak-end weights are calibrated science, not a user lever.
- Term defs are CLICK/TAP popovers (native title fallback), not CSS :hover.
- LLM voice: single-model, after the deterministic spine, never a committee.
  Narration-first, cached to the run-link. Still deferred and unbuilt.

## OPEN QUESTIONS
1. LLM voice — the one genuine product/values fork. A non-deterministic narration
   layer sits in tension with the determinism pitch, so before building it I want
   Jeff's read on whether it ships at all and narration vs autofill. Absent input, the
   recorded recommendation stands: narration-first, deferred, cached/pinned to the
   run-link, clearly labelled as the one non-reproducible layer.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO toggle, so
   they survive every saved copy by construction; details.numbers force-opened into
   both saved paths. This session's page.tsx edits (anchoring control in the no-print
   aside; ref tag in the printable header; peak-end sentence inside the export-gated
   methodology details) did not touch verdict/warnings, so it holds by construction.
   Re-confirm on any page.tsx change.
2. REPO IS PUBLIC. docs/* and AGENTS.md are world-visible; history.md carries some
   Vercel IDs + a gmail (Jeff accepted this knowingly). No keys in the repo; secrets in
   env only.
3. ENGINE VERSIONS: 2.0.0 logit core; 2.1.0 anchoring (anchor-off ≡ 2.0.0); 2.2.0
   peak-end memory (identity repWeights {0,0,0,1} ≡ 2.1.0). runLinkReproducesExactly()
   suppresses the mismatch banner only for the 2.0.0↔2.1.0 anchor-off pair; every other
   gap surfaces (a 2.1.0 link on 2.2.0 correctly warns — peak-end changes results).
4. BUILD QUIRK: a bare `npm install <pkg>` PRUNES devDependencies and breaks the build;
   restore with `npm install --include=dev`. Validate: cmd shell, `npm run typecheck`
   (NOT npx tsc), `npm run build`, scoped git add, commit via `git commit -F <file>`,
   push. Sweeps/smoke run via `node <file>.ts` (sim.ts is a leaf, resolves natively);
   anything importing business.ts needs `npx --yes tsx` (business.ts has extensionless
   internal imports node won't resolve). Root scripts excluded in tsconfig.
5. SINGLE SOURCE OF TRUTH: TERM_DEFS + ARCH_DEF in business.ts; RETENTION_MECHANISMS
   owns retention words (FIELDS / RET_DESC / GLOSSARY derive); REP_MEMORY + RepWeights
   + collapseReputation in sim.ts own peak-end. Edit once.
