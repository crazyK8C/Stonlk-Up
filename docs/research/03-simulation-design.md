# Strategy Lab simulation design

## One run, end to end

```text
Brief → Plan (locked) → Run (time-stepped) → Pressure events → Debrief → Variant (1,000 paths)
```

1. **Brief:** scenario card with context and only what was knowable at the time. Blind mode hides the date and ticker.
2. **Plan:** the player commits to a thesis, entry, exit/invalidation, position size and a confidence % before the run starts.
3. **Run:** candles reveal step by step. At checkpoints the player can hold, add, trim or exit.
4. **Pressure:** scripted events fire, such as an earnings surprise, a rate decision, a hype feed or a countdown timer.
5. **Debrief:** separate scores for process, calibration and outcome (below), plus "what was knowable then".
6. **Variant:** run the same plan on 1,000 synthetic paths with matching statistics to show where this result sits in the distribution.

## Market data: three tiers

| Tier | What | Licensing | Use for |
| --- | --- | --- | --- |
| 1. Synthetic | Seeded generated price paths | None needed | Launch. Sizing drills, regime drills, variants |
| 2. Public macro | US government series (e.g. FRED FEDFUNDS, already wired in `server/ingest.ts`) | Check each series' notes | Rate and inflation context in scenarios |
| 3. Licensed historical | Index or stock end-of-day data for crash replays | Requires a license (see below) | Flagship replays: 2008, 2020, 2022 |

**Licensing findings:**
- S&P 500 data on FRED: "Reproduction ... in any form is prohibited except with the prior written permission of S&P Dow Jones Indices LLC." ICE BofA series carry the same restriction. [FRED](https://fred.stlouisfed.org/graph/?g=1XVfO)
- NSE end-of-day data is a paid subscription with a "Historical Trade Data Undertaking". The terms weren't readable during research. [NSE](https://www.nseindia.com/static/market-data/eod-historical-data-subscription)
- Terms for the Shiller dataset and Alpha Vantage / EODHD display rights weren't found. Ask the providers directly.
- Even rebased or normalized curves derived from licensed data still need the license.

## Synthetic market generator

Build it in layers so each layer teaches a market fact:

| Layer | Model | Teaches |
| --- | --- | --- |
| Base | Geometric Brownian motion (drift + volatility) | Random walks, compounding, why short-term moves are noise |
| Jumps | Merton jump diffusion | Fat tails, gap-downs and crashes that a bell curve says are "impossible" |
| Clustering | GARCH(1,1) volatility | Calm and stormy periods bunch together |
| Regimes | Markov regime switching (bull / bear / sideways) | Strategies that work in one regime fail in another |

GBM alone has continuous paths and can't produce realistic crash dynamics; regime switching alone can't explain all high-volatility episodes. Combining jumps and regimes is standard in the literature. [arXiv 1910.10606](https://arxiv.org/pdf/1910.10606), [Nixtla generators](https://nixtlaverse.nixtla.io/synforecast/generators_stochastic.html), [regime-switching jump diffusion](https://research.dial.uclouvain.be/entities/publication/f3fa1afd-d8cb-4bf8-8bd7-c0a21c27bd63)

Rules:
- **Seeded and reproducible:** store the seed with each run so debriefs and replays match exactly.
- **Always labelled** "Synthetic market — a model, not real prices".
- Ship parameter presets ("calm bull", "choppy sideways", "crash and recovery") that the content team can tune without code.

## Scoring

| Score | How | Why |
| --- | --- | --- |
| **Process (0–100)** | Plan completeness, risk per trade within limit, exit defined, exits followed, no rule breaks under pressure events | The transferable skill |
| **Calibration** | Brier score on confidence statements; calibration curve in Stats | Probability training measurably improves accuracy |
| **Outcome** | P&L, shown last and visually quieter | Still informative, but noisy |

Label each run with the decision/outcome 2×2, after Annie Duke's warning against "resulting" (judging a decision by its outcome):

| | Good outcome | Bad outcome |
| --- | --- | --- |
| **Good process** | Earned win | Bad beat: keep the process |
| **Bad process** | Dumb luck: the most dangerous cell, flag it loudly | Deserved loss |

Ask for the rationale **before** the reveal, so it can't be rationalized afterwards. [Amstat News](https://magazine.amstat.org/blog/2026/06/01/processoutcome/), [Annie Duke](https://www.annieduke.com/?p=3291)

## What we borrow and what we avoid
- **Borrow** blind mode from chart games (ChartGame.com, Ticker League) to kill hindsight bias.
- **Avoid** pure up/down guessing, return-ranked leaderboards and any cash prizes.

## Fit with the current codebase
- `attempts` already stores answer, correctness and timing. Add `confidence` (0–100) and `skill_tags` for Phase A.
- New tables for the Lab: `scenarios` (published JSON: brief, data tier, generator seed/preset or dataset ref, checkpoints, events, rubric), `scenario_runs` (user, scenario, seed, plan, scores), `run_decisions` (checkpoint, action, size, timestamp).
- Keep scoring server-side, as answer scoring is today. Generate synthetic paths on the server from the stored seed so the client can't peek ahead.
