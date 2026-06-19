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
Anchoring engine challenger (ENGINE_VERSION 2.1.0). sim.ts gains anchorRound/
anchorShift; the round loop adds a decaying anchorEffect to the judged price
reference (effRefPrice = refPrice + anchorEffect, decay (1-refAdapt)^k), never
written into refPrice, never touching real price/revenue, so anchor-off is
byte-identical to 2.0.0. business.ts threads it via AdvOverride (anchorShift capped
±20). sweep-anchor.ts is the pre-registered verifier (4/4 gates pass); tsconfig
excludes it like smoke.ts. typecheck clean, build green, / at 25 kB. (Prior code
commit this session: 679f13d retention vocabulary.) Re-confirm HEAD with git
rev-parse; don't trust a hardcoded hash.

## CURRENT STATE
Define one business in plain terms, run it across named customer worlds; engine
2.1.0 (reference-dependent logit core + the new off-by-default anchoring frame) is a
seeded agent-based Monte Carlo, lambda default 2.25, headline is a band. All v1
surfaces live: per-world cards (verdict + warnings),
cross-world A/B compare + inversion finder, within-world fragility sweep, seeded
run-link, /glossary, per-round CSV, three depth tiers (Student / Teaching / Deep
dive) with a Finance-focus toggle. The last code session (0ebaef3) was triage +
hardening only, no engine change: fixed the per-world causal sentence that printed
"Steady price" on a price cut (now reads the actual move), wired the reputation
definition at
its two bare Teaching sites (warning chip, "Lowest rep." label), corrected the
"on hover" subhead to click/tap, gave the Term popover outside-click/scroll/Esc
dismissal, and spelled out CAC in the LTV:CAC def. Save invariant confirmed
holding (Term popover is no-print; chip + label text still print).

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
- Vercel: live at customer-model.council.fyi; auto-deploys latest main on push
  (the retention-vocabulary code commit is the current deploy).
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
1. NEXT-STEP FORK: RESOLVED. Jeff sent Bonner the live link + a repo-link
   follow-up this session and called v2 as the next move. v2 it is.
2. LLM voice: still "after v1" — whether it ships at all, narration vs autofill.
3. v2 scope within the retention-vocabulary item (how many named mechanisms,
   prose-only vs a small vocabulary layer) — Jeff's taste call.
4. Minor copy (Jeff's eye): the "Student" tier label and the "Class prompt"
   export checkbox label.

## NOTES
1. SAVE BUTTON (permanent invariant, never evicted): Save/Print + Copy read
   #result-printable; verdict + warning chips carry NO export class and NO
   toggle, so they survive every saved copy by construction; details.numbers
   force-opened into both saved paths. CONFIRMED HOLDING this session: the new
   reputation Term and popover-dismissal changes left it intact (only the Term
   popover carries no-print, so each chip/label still prints its full text).
2. REPO IS PUBLIC (new this session). docs/handoff, history, plan are
   world-visible; history.md carries some Vercel IDs + a gmail (Jeff accepted
   this knowingly). No keys anywhere in the repo; keep secrets in env only.
3. ALWAYS PUSH (standing). This session: 0ebaef3 (triage/hardening) + this docs
   commit.
4. BUILD QUIRK: a bare `npm install <pkg>` PRUNES devDependencies and breaks the
   build; restore with `npm install --include=dev`. Validate: cmd shell,
   `npm run typecheck` (NOT npx tsc), `npm run build`, scoped git add, commit
   via `git commit -F <file>` (PowerShell word-splits inline -m and mangles ;),
   push. typescript pinned 5.8.2.
5. TERM DEFS SINGLE SOURCE: plain defs live ONCE — TERM_DEFS + ARCH_DEF in
   business.ts; page.tsx aliases TERM_DEFS as DEF and imports ARCH_DEF;
   /glossary derives from GLOSSARY + ARCHETYPES. Edit once.
