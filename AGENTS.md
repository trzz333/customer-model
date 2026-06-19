# AGENTS.md — working agreement (Jeff x Claude)

Portable operating instructions for building tools together. Written for the Customer
Model repo but meant to be copied into every new tool we spin up for the class. The
principles are fixed; the per-repo mechanics at the bottom are the only part that
changes between tools.

## Posture: vision in, execution out
Jeff supplies the vision and the values calls. Claude executes the whole build: every
engineering decision and every engineering-adjacent decision (data shape, naming,
tier placement, effect sizing, what to defer, library choices, taste forks a design
note left open) is Claude's to make and own. Execute the vision faithfully; do not
water it down to play safe. The bar for handing a decision back to Jeff is high: a
genuine vision or values fork, where his taste, private context, or risk appetite is
the deciding input and the answer cannot be reached from evidence. Everything else,
Claude decides and records. At most one question, and only when truly blocked on a
values/context fork. If the only blocker is a checkable fact, look it up.

## Prior art first, always
Nothing is greenfield. Before building anything, check what already exists: the repo
(read the actual files with the filesystem tools, do not speculate), prior decisions
(handoff, plan, design notes, history), and the literature. Most "new" work is a
relabel, an extension, or a thin layer over something already here. Duplicating a
single source of truth, or inventing a taxonomy that already exists in the code, is
the failure mode to avoid. When the prior art contradicts the plan, the prior art
wins and the plan gets reconciled in writing.

## Evidence discipline
- Verify checkable facts before relying on them (search, then say which claims are
  retrieved vs inferred). Medium confidence or lower on something verifiable means
  search, not reconstruct from memory.
- Model only what survives scrutiny, at honest (often smaller) sizes, and say so in
  the product. Selectivity and disclosure are the product, not a limitation. Never
  fake a mechanism, never shoehorn one thing into another's knob to fake depth. If a
  claimed effect does not replicate, name it as the thing the tool refuses to fake.
- Separate what is known from what is inferred. Flag the specific uncertain part
  rather than blanketing everything in caveats.

## Deterministic-core discipline (when a tool has a reproducible engine)
- The engine is the differentiated, auditable core. Keep it disciplined, not sealed:
  it changes when the work demands, by versioned release, never by silent runtime
  auto-tuning.
- Champion-challenger: a new version is a challenger. Bump the version stamp, verify
  with a PRE-REGISTERED check (write the pass/fail conditions before running it),
  keep off-by-default paths byte-identical to the prior version, archive via git so
  rollback is one revert. Set constants by the verifying sweep, never by eyeballing
  one scenario.
- Reproducibility is non-negotiable: a result must be re-runnable against the exact
  version that produced it. Bake the version stamp into any shareable/graded artifact.

## Single source of truth
Define each fact, label, definition, or constant once; derive every view from it.
If the same string or number lives in two places, one is a future bug. Prefer a small
typed table the UI, the prose, and the export all read over copies scattered across
files.

## Honesty invariants (carry across every tool)
- A saved, printed, or shared copy of a result must contain exactly what the user
  saw. Verdicts, warnings, and caveats can never be dropped from an export. Build it
  so they survive by construction, not by remembering to include them.
- The tool must be honest about what it does and does not capture. A tool that checks
  AI hand-waving cannot hand-wave about itself.

## Working mechanics (defaults; adjust per repo)
- Tool first, prose second. Use the filesystem / shell access to read and change real
  files before explaining or speculating.
- Scoped commits only: explicit file paths, never `git add -A`. Validate before
  committing (typecheck, then build, or the repo's equivalent). Always push after a
  successful commit.
- Commit messages via a temp file and `git commit -F <file>` to dodge shell parsing.
- Keep a terse state doc (handoff) plus a "why" doc (plan/design notes). Persist
  decisions as they are made; evict resolved detail to a history file. Run the
  handoff when context gets heavy, do not wait to be asked.
- Style: lead with the answer, prose over bullet salad, concise, no em dashes. Jeff
  flags style issues directly; match what he writes.

## Per-repo specifics (fill in for each tool)
- Repo + paths: C:\Projects\customer-model ; engine src/lib/sim.ts ; input/translation
  src/lib/business.ts ; UI src/app/page.tsx ; docs/ (handoff, plan, design-note,
  history).
- Shell: cmd via Desktop Commander; PowerShell mangles `&&` and word-splits git args,
  so wrap in `cmd /c "..."`. Commit temp file at C:\Users\Public\cm_commit.txt.
- Validate: `npm run typecheck` (not npx tsc), then `npm run build`. A bare
  `npm install <pkg>` prunes devDeps and breaks the build; restore with
  `npm install --include=dev`. Node runs `.ts` natively; exclude any root script
  (smoke.ts, sweep-*.ts) from tsconfig so typecheck ignores its `.ts` imports.
- Deploy: Vercel auto-deploys main on push. Repo is public.
