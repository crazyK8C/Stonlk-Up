# Study & Strategy Lab research

Research behind Stonk Up's planned **Study** section and **Strategy Lab** (market simulations). Compiled October 2026.

The visual plan lives at [strategy-lab-plan.html](strategy-lab-plan.html). Open it in a browser. It includes an interactive position-sizing simulator.

| File | What it covers |
| --- | --- |
| [01-pain-points.md](01-pain-points.md) | Why inexperienced traders lose money and lack confidence, with evidence |
| [02-competitors.md](02-competitors.md) | Teardown of the closest competitors and the gap Stonk Up can fill |
| [03-simulation-design.md](03-simulation-design.md) | How the Strategy Lab engine should work: data, scenarios, scoring |
| [04-learning-science.md](04-learning-science.md) | Evidence behind the guided techniques, and how to apply each one |
| [05-regulation-and-data.md](05-regulation-and-data.md) | SEBI, gaming law, child data protection and data licensing constraints |

## Decisions this research supports

1. **Score the decision, not the P&L.** Separate process, calibration and outcome scores. Market feedback on single trades is too noisy to learn from (97% of persistent Brazilian day traders lost money and showed no learning).
2. **Start with synthetic markets.** A seeded generator needs no data license, has no SEBI data-lag issue and can produce any regime on demand. Add licensed historical replays later.
3. **Historical replays need a license.** S&P 500 data on FRED can't be reproduced without S&P Dow Jones Indices' permission. NSE end-of-day data is a paid subscription with an undertaking. Budget for one data license before building replays.
4. **No money anywhere in the reward loop.** SEBI's 2026 education-data circular reportedly forbids monetary incentives, and the Online Gaming Act 2025 bans real-money games. XP, coins and badges must never convert to cash, and there should be no paid-entry contests. This is a real difference from StockGro.
5. **Gate users at 18+ for launch, or build a no-tracking youth mode.** India's DPDP rules treat under-18s as children, require verifiable parental consent and forbid behavioural tracking. Our stats are behavioural tracking.
6. **Debrief after every simulation.** Structured debriefs improve performance by about 25% (meta-analysis, 46 samples).
7. **Aim feedback at the task, not the person.** Feedback helps on average but hurt performance in over a third of the cases studied (Kluger & DeNisi).
8. **Ship a short calibration module early.** Under an hour of probability training improved forecast accuracy by 6–11%.
9. **Use story and social play, not just points.** In gamification studies, game fiction and social interaction were what moved behaviour.
10. **Streaks amplify value, they don't create it.** Duolingo's growth came from current-user retention. Build a Lab people want to return to first.

## Open questions (need a person, not a search)

- Confirm the final text of SEBI's May 2026 circular on price data for education (30-day lag, no monetary incentive).
- Get quotes and display terms from NSE Data & Analytics and one API vendor for historical end-of-day index data.
- Legal review on whether coins or leaderboards could be read as "online money games".
- Confirm when DPDP children's-data obligations take effect.
