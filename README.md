# Customer Model

A behavioral stress-test for business models, built for a business-school AI
course. You set a business policy and a market mix of customer archetypes, run
repeated rounds, and watch where the model breaks: churn cascades, exploitation
leakage, reputation rot.

## What makes it different from frontier "synthetic customer" tools

Frontier synthetic-customer / AI-persona products run LLM personas as survey
respondents — you ask them questions, they role-play answers. That's a black box
and it isn't reproducible. This is the opposite: a **deterministic, seeded,
game-theory + behavioral-economics simulation**. Customer archetypes adapted
from Axelrod's iterated-tournament strategies (Tit-for-Tat, Grim Trigger,
Always-Defect, Pavlov, Detective, etc.) react to the business's policy moves
over rounds, with their perception distorted by prospect theory (loss aversion),
present bias, and reference-point dependence. Same seed + same config = same
result, every time, and you can read the mechanism line by line.

An optional, single-model LLM layer voices what a given archetype "would say,"
grounded in that segment's actual simulated numbers. It is narration on top of a
transparent model, not the model itself. No multi-agent committee: verified
research finds deliberation among correlated models adds redundancy, not
accuracy. The deterministic engine is itself the independent check on AI
hand-waving about a business plan.

## Architecture

- `src/lib/sim.ts` — the engine. Pure, deterministic, no I/O. This is the IP.
- `src/app/page.tsx` — the UI: controls, run, results.
- `src/app/api/voice/route.ts` — optional LLM voice layer (reads `ANTHROPIC_API_KEY` from env).

## Secrets

API keys live in env only. Copy `.env.local.example` to `.env.local` and fill
in values locally; set the same vars in the Vercel project for production.
Never commit a key.

## Status

See `docs/handoff.md` for current state and the next move.
