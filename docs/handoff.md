# Customer Model — Handoff

State doc. Terse by design. Resolved detail lives in docs/history.md. Roadmap,
v2 parking lot, the LLM-voice recommendation, and the decision log live in
docs/plan.md.

## PROJECT
A business-school AI tool: a deterministic, game-theory + behavioral-economics
simulation that stress-tests a business model against synthetic customer
archetypes. Live at https://customer-model.council.fyi.

## PHASE
v1 CLOSED; v2 BUILD underway. Mechanism #1 (retention vocabulary) shipped. Mechanism
#2 (anchoring / reference-price framing) ENGINE shipped + verified this session as
ENGINE_VERSION 2.1.0: a decaying anchorEffect lifts the judged reference without
moving real price; the pre-registered sweep (sweep-anchor.ts) passes all four gates.
Engine freeze is LIFTED (standing permission from Jeff). Anchoring's user-facing
exposure (Deep-dive control + run-link persistence) is the only piece of #2 still
pending; the engine is adv-drivable now.

## LAST COMMIT
04945ac — feat: anchoring reference-price engine (ENGINE_VERSION 2.1.0); last CODE
commit. Followed by 4f8d587 (AGENTS.md working agreement) and this handoff docs
commit. typecheck clean, build green, / at 25 kB. Re-confirm HEAD with git
rev-parse; don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds. Engine 2.1.0
is a seeded agent-based Monte Carlo on a reference-dependent logit core (lambda 2.25,
headline is a band), now with an off-by-default reference-price anchoring frame.
v1 surfaces all live: per-world cards (verdict + warn.chips), cross-world A/B compare
+ inversion finder, within-world fragility sweep, seeded run-link, /glossary,
per-round CSV, three depth tiers (Student / Teaching / Deep) with a Finance toggle.
v2 so far: retention vocabulary is a single-source RETENTION_MECHANISMS table the
form/teaching-prompt/glossary derive from; anchoring is engine-shipped and verified
(sweep-anchor.ts, 4/4) but not yet user-reachable (adv-drivable only). UI (page.tsx)
unchanged this session, so the save invariant is intact by construction.

## NEXT MOVE
Two open threads, both mine to sequence. (a) FINISH anchoring's user-facing exposure:
a Deep-dive reference-price control in page.tsx (Teaching/Deep-dive tiers, not the
default Student read — my taste call: teachable but exploitable), plus run-link
persistence (add anchorShift/anchorRound to the adv token; backward-compatible,
decode-clamped to ±20; old 2.0.0 links decode to anchor-off and reproduce exactly).
Read page.tsx first; mind the version-mismatch surfacing so anchor-off 2.0.0 links
don't throw a spurious warning. (b) Mechanism #3, PEAK-END memory, per design-note §3:
reputation_memory = w_avg·mean + w_first·first + w_peak·peak + w_end·last, w_avg
largest, weights set BY the pre-registered sweep (three equal-mean series: rising,
falling, late-dip), versioned ENGINE_VERSION bump. Engine freeze is lifted, so no
authorization gate; just keep the champion-challenger discipline (bump, sweep, archive).

## DEPLOY STATE
- Local repo: YES, main, scoped commits.
- GitHub: trzz333/customer-model — PUBLIC (so Professor Bonner can read it without
  an account; docs/ are world-visible). Pushed this session's docs + code commits.
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push.
  Current runtime is engine 2.1.0 (anchoring present but off by default, so the live
  site behaves exactly as before until the control ships).
- Env vars: NO. v1 is key-free. @anthropic-ai/sdk present but unused (post-v1
  voice). lz-string@1.5.0 is the one runtime dep.

## DECISIONS LOCKED
Standalone repo, not council. Deterministic, reproducible, auditable core, not an
LLM-respondent. Templates are CUSTOMER WORLDS applied to a user business. lambda
default 2.25, held constant across worlds. Engine evolves by versioned release;
ENGINE_VERSION stamps every result. NO machine learning. ALWAYS PUSH.
- v1 is CLOSED. The engine FREEZE IS LIFTED (standing permission, 2026-06-19): Claude
  versions sim.ts as needed, no per-edit authorization, keeping champion-challenger
  discipline (bump ENGINE_VERSION, verify with a pre-registered sweep before
  promoting, archive via git, off-by-default paths stay byte-identical). Never silent
  runtime auto-tuning.
- AUTONOMY (standing, 2026-06-19): Claude makes all engineering AND engineering-
  adjacent calls, including the taste forks the design note parked. Jeff supplies the
  vision; Claude executes it faithfully (don't water it down) on the best available
  evidence. Surface a question ONLY for a genuine vision/values fork, never for
  engineering-adjacent decisions. PRIOR-ART FIRST, always: check what already exists
  (repo, prior decisions, the literature) before building; nothing is greenfield.
- Three DEPTH tiers (Student / Teaching / Deep dive), not roles. Finance is a
  toggle in Teaching + Deep. Fresh visit opens Teaching; a run-link opens Student.
- Term defs are CLICK/TAP popovers (native title fallback), not CSS :hover. A
  "does nothing on hover" report is a tester artifact. (The subhead that wrongly
  said "on hover" was corrected to click/tap this session.)
- LLM voice: single-model, after v1, never a committee. Narration-first, cached
  to the run-link. Still deferred and unbuilt.

## OPEN QUESTIONS
1. LLM voice — the one genuine product/values fork left. A non-deterministic narration
   layer sits in tension with the tool's determinism pitch, so before building it I
   want Jeff's read on whether it ships at all and narration vs autofill. Absent input,
   I proceed with the recorded recommendation: narration-first, deferred, cached/pinned
   to the run-link, clearly labelled as the one non-reproducible layer.
   (The old v2-scope and tier-copy forks are now Claude's calls under AUTONOMY, not
   open questions; Bonner outreach already done.)

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO toggle, so
   they survive every saved copy by construction; details.numbers force-opened into
   both saved paths. INTACT this session by construction: page.tsx + globals.css were
   not touched, so nothing could regress it. Re-confirm on any page.tsx change.
2. REPO IS PUBLIC. docs/handoff, history, plan, design-note, AGENTS.md are
   world-visible; history.md carries some Vercel IDs + a gmail (Jeff accepted
   this knowingly). No keys anywhere in the repo; keep secrets in env only.
3. ALWAYS PUSH (standing). This session pushed: 187e4e4 (v2 research), 4477100
   (design note), 679f13d (retention vocabulary), 04945ac (anchoring engine 2.1.0),
   4f8d587 (AGENTS.md), + this handoff commit.
4. BUILD QUIRK: a bare `npm install <pkg>` PRUNES devDependencies and breaks the
   build; restore with `npm install --include=dev`. Validate: cmd shell,
   `npm run typecheck` (NOT npx tsc), `npm run build`, scoped git add, commit
   via `git commit -F <file>` (PowerShell word-splits inline -m and mangles ;),
   push. typescript pinned 5.8.2.
5. SINGLE SOURCE OF TRUTH: plain defs live ONCE — TERM_DEFS + ARCH_DEF in
   business.ts; page.tsx aliases TERM_DEFS as DEF and imports ARCH_DEF;
   /glossary derives from GLOSSARY + ARCHETYPES. Retention words live ONCE in
   RETENTION_MECHANISMS (business.ts); FIELDS, RET_DESC, and GLOSSARY derive from it.
   Edit once.
