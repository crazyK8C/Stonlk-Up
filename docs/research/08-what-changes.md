# What notes 06 and 07 change

Notes [06](06-risk-calculations.md) and [07](07-portfolio-correlation.md) (risk calculations and portfolio correlation) don't just add content. Four findings cut against things already built, and the product is moving from a gamified app to a professional trading-psychology tool. This note maps both onto the plan.

## The new positioning

**Before:** a gamified finance app with a cat mascot, XP and coins.
**After:** a decision-training platform for new traders, like a flight simulator for trading decisions. It is still engaging, but it gets there through competence, feedback and progress, not cartoons.

Why this fits the research:
- The audience at risk is young, often low-income, and already drawn to trading apps (SEBI: 93% of F&O traders lost money; 75% earned under ₹5 lakh). They respond to tools that feel like real trading platforms. A childish look signals "not for me".
- The engagement that works comes from feedback and progress (debriefs +25%, calibration training 6–11%), not from decoration. Gamification effects were mainly story and social play (Sailer & Homner).
- Trading psychology is the product: overconfidence, loss aversion, FOMO, correlation neglect, myopic loss aversion. A calm, data-dense interface supports reflection better than celebration effects.

Five pillars replace the game framing:

| Pillar | Tab | What it is |
| --- | --- | --- |
| Learn | Study | Skill tracks: concept, worked example, check |
| Train | Practice | Quick predictions with confidence ratings |
| Simulate | Strategy Lab | Event Lab, sizing sandbox, regime drill |
| Measure | Reflect | Gap tracker, calibration, journal |
| Calculate | Tools (new) | Pre-trade risk calculator: S1–S4, R1, R2 from note 06 |

XP, streaks and levels stay as quiet progress markers. The cat mascot, emoji reactions and confetti go.

## Findings that change what's built

### 1. Simulations can make people bolder (Kaufmann, Weber & Haisley 2013)
Risk simulations raised risk-taking and lowered perceived risk. Our sandbox and Event Lab are this kind of tool.
- **Measure it:** log the risk chosen in the sandbox, and the size and exit rule chosen in the Event Lab, run over run. Add "Are you getting bolder?" to the Gap tracker.
- **Show distributions, not one path:** add the planned "1,000 paths" view to the Event Lab debrief, so one lucky run doesn't teach the wrong lesson.
- **Every simulation ends in a debrief.** The Event Lab does; the sandbox and regime drill should get a one-question reflection.

### 2. Stop-losses don't add return (Kaminski & Lo 2014)
On a random walk, simple stops lower expected return; they help only when prices have momentum.
- The Event Lab's process score rewards **having and following a plan**. That's right for discipline, but copy must never say exits improve returns.
- **Debrief change:** add a neutral line, "In this path your exit rule saved / cost you X points versus holding."
- **Gap risk:** the generator's jumps can gap straight through an exit. Add a gap-risk line to the Study sizing example, and a scenario that shows it.

### 3. Kelly is a ceiling, not a target (Haghani & Dewey 2016; MacLean, Thorp & Ziemba 2010)
Already applied: the sandbox verdict now compares bet size with the Kelly fraction (commit `38e4bd0`).
- Next: mark the Kelly point and the "2× Kelly ≈ zero growth" point on the risk control itself.
- Real edge is unknown, so the Tools tab must never suggest a Kelly size for a real instrument.

### 4. Our portfolio mix ignores correlation (Longin & Solnik; stock–bond flip in 2022)
The Event Lab's debt and gold paths move independently of equity. That's wrong in exactly the scenarios we model:
- **2022 rate hikes:** bonds fell with stocks (stock–bond correlation around +0.58 for the year, **Confirm**). Our model shows debt rising gently and cushioning the mix. That teaches the opposite of what happened.
- **Crashes:** equity correlations rise, while gold's correlation with Indian equities was negative in 2008, 2020 and 2022.
- **Fix:** draw correlated shocks per regime with a Cholesky factor (note 07). Give each event its own correlation settings (debt falling with equity in 2022, gold as a partial hedge in crashes), and test that the 2022 mix gets no debt cushion.

## New content from the notes

| Item | Where | Source |
| --- | --- | --- |
| Pre-trade calculator: max loss, portfolio hit, risk–reward, break-even win rate, position size, recovery needed | New **Tools** tab | 06: S1–S4, R1, R2 |
| "Effective bets" slider: holdings × correlation → volatility and independent bets | Strategy Lab drill 3 | 07: C4, C5, C6 |
| "Correlated or not?" blind drill: price charts first, then the return scatter | Strategy Lab drill 4 | 07: C8 |
| Diversify track, step 2: the diversification floor and effective bets | Study | 07: C4, C5 |
| New Study cards: reading the Riskometer; fund overlap; leverage and why F&O losses are big | Study | 06: Riskometer, R7; 07: C10 |
| New practice questions: shared variance, price vs return correlation, break-even win rate, recovery maths | Practice | 06, 07 |
| Weekly or monthly review intervals in simulations, to blunt myopic loss aversion | Event Lab settings | 06: Benartzi & Thaler |

## What we stop doing

- **No onboarding risk quiz.** Risk questionnaires explain only about 15% of actual risk-taking (**Confirm**). Infer a player's level from Lab behaviour instead.
- **No named funds or stocks as diversifiers**, ever. Use illustrative assets only.
- **No price-level correlations** shown without the warning about trending charts (C8).

## Build order (revised)

1. **Professional redesign:** a new design system and a bento-grid home. It touches every screen, so it goes first.
2. **Correctness fixes:** correlated multi-asset generator for the Event Lab (finding 4); the neutral exit-rule line and gap-risk copy (finding 2).
3. **Tools tab:** the pre-trade calculator.
4. **Measuring boldness:** sandbox and Event Lab risk logging, plus a Gap tracker card (finding 1).
5. **New drills and Study content** from the table above.
6. **Then:** the 1,000-paths debrief view, Kelly markers, and Indian calendar studies once data is licensed.
