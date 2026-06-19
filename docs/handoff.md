# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, and the LLM-voice recommendation live in docs/plan.md. The v2
build spec, pre-registered sweeps, the caveat-reconciliation literature pass, and
the RESOLVED taste-fork decisions live in docs/design-note-v2.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v2 BUILD, engine roadmap COMPLETE. Mechanisms #1 (retention vocabulary), #2
(anchoring, fully wired: engine + Teaching/Deep dial + Student teachable note +
run-link persistence), #3 (peak-end memory) all SHIPPED; the optional peak-end
negative-peak refinement was tested and CLOSED not-material this session. Engine is
ENGINE_VERSION 2.2.0, unchanged for several sessions and stable. Social unfurl
(LinkedIn/OG) shipped this session. The next substantive item is a product/values
fork (the LLM voice layer), not an engineering task. Engine freeze is LIFTED
(standing).

## LAST COMMIT
23df3c0 — test(peakend): pre-registered negative-peak refinement test, closed
not-material. Preceded by f3b4fc5 (OG image crisp-fix) and 1d53911 (LinkedIn/OG
unfurl). All pushed; typecheck clean, build green, sweep-peakend.ts gates pass.
Re-confirm HEAD with git rev-parse; don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine
2.2.0 is a seeded agent-based Monte Carlo on a reference-dependent logit core (λ
2.25, headline a band), with reference-price anchoring and peak-end reputation
memory live. Retention now names six live mechanisms (none, loyalty, standing
promo, default/auto-renew, switching cost, contract); the old combined "lock-in"
is RETIRED to a decode-only legacy key so old shared run-links still decode and
reproduce byte-identically (friction 72 unchanged). Friction map is monotone:
none 18 < promo 32 < loyalty 45 < default 52 < switchcost 58 < contract 68 <
lockin 72. The landing opens MINIMAL in every mode (summary-first teaser; export
gated to the expanded state). Anchoring: the dial stays Teaching/Deep, but the
reference-price frame is now teachable in the Student read via a plain glossary
term and one anchoring-GATED sentence shown only when a faculty run-link turns the
frame on. All v1/v2 surfaces remain: per-world cards (verdict + warn chips), A/B
compare + inversion finder, fragility sweep, seeded run-link, /glossary, per-round
CSV, three depth tiers + Finance toggle. The site now unfurls on LinkedIn/social: root
layout exports openGraph + twitter metadata and a 1200x630 src/app/opengraph-image.png
via Next's file convention.

## NEXT MOVE
The v2 engine-mechanism roadmap is COMPLETE and verified at 2.2.0 (retention,
anchoring, peak-end all shipped; the optional peak-end negative-peak refinement was
tested and closed not-material, sweep-peakend-negpeak.ts). The social unfurl shipped.
There is no remaining no-fork engineering task on the critical path. The next
substantive item is the LLM VOICE LAYER, which is OPEN QUESTION #1: a genuine
product/values fork (a non-deterministic narration layer sits in tension with the
determinism pitch), so it is Jeff's call, not a unilateral build. Do NOT start it
without Jeff. If Jeff wants the voice layer: the recorded recommendation is
narration-first (interpret the engine numbers, tailor by reader role), cached/pinned
to the run-link token for graded-artifact stability, clearly labeled as the one
non-reproducible layer; autofill (input-side parsing) is lower priority and only
acceptable if parsed levers are shown and editable. If Jeff wants to DEFER the voice
decision, available no-fork polish only (none load-bearing): a small UI surfacing of
the v2 governing principle ("model only replicated effects at honest effect sizes"),
or later-version held mechanisms (decoy tier, network effects, reciprocity, brand —
all explicitly held, not greenlit). Otherwise the engine is stable; await direction.

## DEPLOY STATE
- Local repo: YES, main, scoped commits. GitHub: trzz333/customer-model — PUBLIC.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push.
  Runtime carries the retention schema-bump + teachable anchoring; engine 2.2.0.
- Open Graph / social unfurl: SET UP (1d53911 + f3b4fc5). layout.tsx exports
  metadataBase + openGraph + twitter; src/app/opengraph-image.png (1200x630) is the
  single image source via Next's file convention (no openGraph.images, no public/).
  Verified in built HTML. Image generator (off-repo): C:\Users\Public\cm_make_og.py.
- Env vars: NO. v2 is key-free. @anthropic-ai/sdk present but unused (post-spine
  voice layer). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. λ default
2.25, held constant across worlds. Engine evolves by versioned release; ENGINE_VERSION
stamps every result. NO machine learning. ALWAYS PUSH.
- Engine FREEZE LIFTED (standing): Claude versions sim.ts without per-edit
  authorization, champion-challenger discipline (bump ENGINE_VERSION, pre-registered
  sweep before promote, off/identity paths byte-identical, rollback via git). Never
  silent runtime auto-tuning.
- AUTONOMY (standing): Claude makes all engineering AND engineering-adjacent calls,
  including taste forks and effect-sizing. Surface a question ONLY for a genuine
  vision/values fork. PRIOR-ART FIRST; when prior art contradicts the plan, prior art
  wins and the plan is reconciled in writing.
- MINIMAL BY DEFAULT, depth on demand (standing UI principle, 2026-06-19): the
  fresh-visit surface carries only what a novice needs to act; named mechanisms and
  contested levers are revealed one tier up, in the glossary, or only when a
  faculty-shared run-link turns them on. Tie-breaker for tier-placement calls.
- Three DEPTH tiers (Student / Teaching / Deep), Finance a toggle in Teaching + Deep.
  Fresh visit opens Teaching summary-first; a run-link opens Student fully expanded.
  Student has NO dials.
- TASTE FORKS RESOLVED (2026-06-19, Jeff delegated): named retention mechanisms stay
  out of the Student read beyond their plain labels (name lives in glossary + Teaching
  terms); the anchoring DIAL stays Teaching/Deep, but the reference-price frame is
  teachable in the Student read via a gated note + glossary term. See design-note-v2
  §RESOLVED.
- Peak-end weights are calibrated science, not a user lever. Term defs are CLICK/TAP
  popovers (native title fallback), not CSS :hover.
- LLM voice: single-model, after the deterministic spine, never a committee.
  Narration-first, cached to the run-link. Still deferred and unbuilt.

## OPEN QUESTIONS
1. LLM voice — the one genuine product/values fork (narration vs autofill, or whether
   it ships at all). A non-deterministic narration layer sits in tension with the
   determinism pitch. Absent input, the recorded recommendation stands: narration-first,
   deferred, cached/pinned to the run-link, clearly labelled as the one non-reproducible
   layer.
(The two retention/anchoring taste forks are RESOLVED — see DECISIONS LOCKED,
design-note-v2 §RESOLVED, and history.)

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO toggle, so
   they survive every saved copy by construction; details.numbers force-opened into both
   saved paths. The summary-first collapse gates export to the expanded (full) state, so
   the only saveable state is the complete one. Confirmed intact this session (the gated
   anchor note is additive prose inside #result-printable; verdict/warnings untouched in
   WorldCard). Re-confirm on any page.tsx change.
2. REPO IS PUBLIC. docs/* and AGENTS.md are world-visible; history.md carries some Vercel
   IDs + a gmail (Jeff accepted this knowingly). No keys in the repo; secrets in env only.
   The LinkedIn/career brief is kept OFF the repo (download artifact only).
3. ENGINE VERSIONS: 2.0.0 logit core; 2.1.0 anchoring (anchor-off ≡ 2.0.0); 2.2.0
   peak-end (identity repWeights {0,0,0,1} ≡ 2.1.0). runLinkReproducesExactly()
   suppresses the mismatch banner only for the 2.0.0↔2.1.0 anchor-off pair. No 2.3.0:
   the peak-end negative-peak refinement was tested (sweep-peakend-negpeak.ts) and
   closed ADMISSIBLE-BUT-NOT-MATERIAL (G2 band caps the gain at 0.93 pt); 2.2.0 stays
   champion. (Stale: design-note-v2 §2's anchoring "PENDING UI/run-link" line is
   superseded — anchoring is fully wired incl. run-link persistence.)
4. BUILD/VALIDATE: cmd shell (PowerShell word-splits && and git args). `npm run
   typecheck` (NOT npx tsc), then `npm run build`. Scoped git add, commit via
   `git commit -F C:\Users\Public\cm_commit.txt`, push. Sweeps/smoke run via
   `node <file>.ts` (sim.ts is a leaf); anything importing business.ts needs
   `npx --yes tsx`. Root smoke/sweep scripts are excluded from tsconfig by GLOB
   (smoke*.ts, sweep*.ts), so a new such script won't break typecheck. A bare
   `npm install <pkg>` PRUNES devDeps and breaks the build; restore with
   `npm install --include=dev`.
5. SINGLE SOURCE OF TRUTH: TERM_DEFS (now incl. `anchor`) + ARCH_DEF in business.ts;
   RETENTION_MECHANISMS owns retention words (FIELDS / RET_DESC / GLOSSARY / retentionOpts
   derive; legacy entries carry legacy:true, hidden from form + glossary, surfaced only
   when an incoming link carries them); REP_MEMORY + RepWeights + collapseReputation in
   sim.ts own peak-end. Edit once.
