# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md. The v2 build spec, pre-registered sweeps, and the caveat-
reconciliation literature pass live in docs/design-note-v2.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v2 BUILD. Engine mechanisms #1 (retention vocabulary), #2 (anchoring), #3
(peak-end memory) all SHIPPED and verified; engine is ENGINE_VERSION 2.2.0,
unchanged this session. This session was UI + research: the landing now opens
summary-first with a categorized control rail, and a literature pass reconciled
the three conservative effect-sizing caveats (written to design-note-v2.md).
Engine freeze is LIFTED (standing).

## LAST COMMIT
7852247 — feat(ui): summary-first landing + categorized control rail. page.tsx
only, no engine touch; typecheck clean, build green, / at 26.2 kB. A docs commit
(handoff + history + design-note reconciliation) follows. Re-confirm HEAD with
git rev-parse; don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine
2.2.0 is a seeded agent-based Monte Carlo on a reference-dependent logit core (λ
2.25, headline a band), with reference-price anchoring and peak-end reputation
memory live. The landing now opens MINIMAL in every mode: the worked example
still computes but renders as a one-paragraph teaser with a "See the full
analysis" button, and the export toolbar is hidden until the reader expands (via
that button, a Run, or a run-link). The left rail is grouped into tight
categories: Your business and Customer worlds open; Run sits directly under the
worlds; Comparisons & checks (Compare, Fragility) and Tuning (Difficulty,
Reference-price, Advanced) collapse into labeled sections; Finance its own block.
All v1/v2 surfaces remain: per-world cards (verdict + warn chips), A/B compare +
inversion finder, fragility sweep, seeded run-link, /glossary, per-round CSV,
three depth tiers + Finance toggle.

## NEXT MOVE
My call: build the DEFERRED RETENTION SCHEMA-BUMP (design-note §1), now re-based
by the caveat pass. Two versioned input-layer steps, not an ENGINE_VERSION bump:
(a) add default/auto-renew as a NEW Retention enum value, sized on
default-specific evidence (defaults are the most robust nudge subcategory, but at
the conservative field lower bound, conditioned on the endorsement/transparency
pathway), REPLACING the old "contested, near-null" caveat in its def; (b) split
"lock-in" into "contract" vs "switching cost". Both touch Retention enum +
businessToCfg + RETENTION_MECHANISMS + run-link RETENTIONS (additive,
backward-compatible via the pick fallback). Single source of truth: extend
RETENTION_MECHANISMS; FIELDS / RET_DESC / GLOSSARY derive. No engine math.
Alternatives from the caveat pass, both Jeff-gated or low-priority: expose the
reference-price lever in the Student tier (the robust teachable form; evidence
tips this YES, still Jeff's call); an optional pre-registered peak-end
negative-peak test (gated by G4/G2). See design-note-v2.md "CAVEAT
RECONCILIATION" for the evidence behind all three.

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: trzz333/customer-model — PUBLIC (Professor Bonner can read docs without
  an account). Pushed this session's UI commit (7852247) + the docs commit.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push.
  Runtime carries the summary-first landing now; engine still 2.2.0.
- Env vars: NO. v2 is key-free so far. @anthropic-ai/sdk present but unused
  (post-spine voice layer). lz-string@1.5.0 is the one runtime dep.

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
  plan is reconciled in writing.
- Three DEPTH tiers (Student / Teaching / Deep), Finance a toggle in Teaching + Deep.
  Fresh visit opens Teaching summary-first; a run-link opens Student, fully expanded.
- Anchoring exposure: currently Teaching/Deep only. Peak-end weights are calibrated
  science, not a user lever.
- Term defs are CLICK/TAP popovers (native title fallback), not CSS :hover.
- LLM voice: single-model, after the deterministic spine, never a committee.
  Narration-first, cached to the run-link. Still deferred and unbuilt.

## OPEN QUESTIONS
1. LLM voice — the one genuine product/values fork (narration vs autofill, or whether
   it ships at all). A non-deterministic narration layer sits in tension with the
   determinism pitch. Absent input, the recorded recommendation stands: narration-first,
   deferred, cached/pinned to the run-link, clearly labelled as the one non-reproducible
   layer.
2. Two parked taste forks, both now informed by the caveat pass: whether named retention
   mechanisms surface in the Student tier or only Teaching/Deep; whether the
   reference-price lever is faculty-only or also student-visible. The anchoring evidence
   tips the second toward student-visible (it is the robust, teachable form, not the
   contested decoy), but it stays Jeff's call.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO toggle, so
   they survive every saved copy by construction; details.numbers force-opened into both
   saved paths. This session added a summary-first COLLAPSE, but export is gated to the
   expanded state, where the full cards (verdict + warnings) render, so the only saveable
   state is the complete one. Invariant holds by construction. Re-confirm on any page.tsx
   change.
2. REPO IS PUBLIC. docs/* and AGENTS.md are world-visible; history.md carries some Vercel
   IDs + a gmail (Jeff accepted this knowingly). No keys in the repo; secrets in env only.
   The LinkedIn/career brief is kept OFF the repo (a download artifact only), because this
   code may become Washburn's at some point and self-promo doesn't belong in a repo that
   could transfer.
3. ENGINE VERSIONS: 2.0.0 logit core; 2.1.0 anchoring (anchor-off ≡ 2.0.0); 2.2.0
   peak-end memory (identity repWeights {0,0,0,1} ≡ 2.1.0). runLinkReproducesExactly()
   suppresses the mismatch banner only for the 2.0.0↔2.1.0 anchor-off pair; every other
   gap surfaces.
4. BUILD QUIRK: a bare `npm install <pkg>` PRUNES devDependencies and breaks the build;
   restore with `npm install --include=dev`. Validate: cmd shell, `npm run typecheck`
   (NOT npx tsc), `npm run build`, scoped git add, commit via `git commit -F <file>`,
   push. Sweeps/smoke run via `node <file>.ts` (sim.ts is a leaf); anything importing
   business.ts needs `npx --yes tsx`. Root scripts excluded in tsconfig. PowerShell is the
   default shell; force cmd.exe for git/npm (it word-splits && and git args otherwise).
5. SINGLE SOURCE OF TRUTH: TERM_DEFS + ARCH_DEF in business.ts; RETENTION_MECHANISMS owns
   retention words (FIELDS / RET_DESC / GLOSSARY derive); REP_MEMORY + RepWeights +
   collapseReputation in sim.ts own peak-end. Edit once.
