# Risk calculations for retail investors

This is research, not investment advice. Most findings come from abstracts. Specific numbers marked **Confirm** come from secondary summaries and need checking against the full source before we quote them in the app.

## The evidence

| Finding | Source |
| --- | --- |
| 61 people, mostly economics and finance students plus young asset-management staff, got $25 and a coin that lands heads 60% of the time, with winnings capped at $250. Betting 20% a flip (the Kelly fraction) was the best play, yet 28% went bust and the average payout was $91. Betting a fixed share of wealth seemed non-intuitive, and many doubled up after losses. | [Haghani & Dewey 2016, SSRN](https://papers.ssrn.com/abstract=2856963), [full text](https://ar5iv.labs.arxiv.org/html/1701.01427) |
| Full Kelly maximises long-run growth but allows deep drawdowns, and overbetting has led to disaster. Fractional Kelly smooths the path at the cost of some growth. | [MacLean, Thorp & Ziemba, Quant. Finance 2010](https://escholarship.org/content/qt5mr5k8qj/qt5mr5k8qj.pdf) |
| On a random walk, simple stop-loss rules **always lower** expected return. They only add value when prices have momentum. | [Kaminski & Lo, J. Financial Markets 2014](https://dspace.mit.edu/entities/publication/bb69ca4b-0cdc-487f-831d-63b2e84fafee) |
| A well-diversified portfolio of random stocks needs at least 30 stocks (borrowing investor) or 40 (lending investor), not the folk figure of 10. **Confirm** from the full text. | [Statman, JFQA 1987](https://ideas.repec.org/a/cup/jfinqa/v22y1987i03p353-363_01.html) |
| Single-stock volatility rose from 1962 to 1997 while market volatility didn't, so more stocks are needed for the same diversification. | [Campbell, Lettau, Malkiel & Xu, J. Finance 2001](https://www.nber.org/digest/jun00/individual-stocks-have-become-more-volatile) |
| Correlation between markets rises in bear markets but not in bull markets. Diversification is weakest exactly when it's needed. | [Longin & Solnik, J. Finance 2001](https://faculty.essec.edu/en/research/extreme-correlation-of-international-equity-markets) |
| People linearise compounding, which predicts underestimating loan costs and investment growth. In one example, answers for 7% growth over ten periods came out near 70% instead of the true 97% (**Confirm**). | [Stango & Zinman, J. Finance 2009](https://doi.org/10.1111/j.1540-6261.2009.01518.x) |
| Checking a portfolio often makes losses loom larger (myopic loss aversion). In experiments, more frequent evaluation made people more risk-averse. | [Benartzi & Thaler, NBER w4369](https://www.nber.org/papers/w4369), [Gneezy & Potters](https://Rady.ucsd.edu/_files/faculty-research/uri-gneezy/risk-taking.pdf) |
| Risk-profiling questionnaires explain only about 15% of the differences in how much risk investors actually hold (**Confirm**). | [Klement, CFA Institute Research Foundation 2015](https://rpc.cfainstitute.org/research/foundation/2015/investor-risk-profiling-an-overview) |
| Simulating outcomes (sampling returns, seeing distributions) improved estimates of expected return and loss probability, **but raised risk-taking** and lowered perceived risk. | [Kaufmann, Weber & Haisley, Mgmt. Science 2013](https://madoc.bib.uni-mannheim.de/34206/) |
| 74–89% of retail CFD accounts in the EU lost money. ESMA capped retail leverage at 30:1 to 2:1 depending on the asset and required negative-balance protection. | [ESMA, March 2018](https://www.esma.europa.eu/node/84933) |
| SEBI raised the minimum index derivative contract to ₹15 lakh from Nov 20, 2024, and requires a risk-disclosure pop-up at every broker login ("9 out of 10 individual traders ... incurred net losses"). | [Business Standard (Oct 2024)](https://www.business-standard.com/amp/markets/news/sebi-announces-six-key-changes-to-curb-speculation-in-derivatives-trading-124100101316_1.html), [Business Standard (May 2023)](https://www.business-standard.com/markets/news/market-regulator-sebi-mandates-risk-disclosures-for-equity-f-o-trades-123051900929_1.html) |
| Every Indian mutual fund carries a six-level Riskometer (Low to Very High), reviewed monthly. It's the risk label our users already see. | [SEBI circular, Oct 2020](https://www.sebi.gov.in/sebi_data/attachdocs/oct-2020/1602580413614.pdf) |

## Simple calculations first

Arithmetic a beginner can do on a phone calculator before placing any trade. None needs statistics.

| # | Calculation | Formula | Worked example | What it teaches |
| --- | --- | --- | --- | --- |
| S1 | Most you can lose on this trade | position × distance to exit | ₹40,000 position, exit 5% below → about ₹2,000 | Know the loss before you enter. Gaps can make it bigger (see below). |
| S2 | Portfolio hit from one holding | weight × move | ₹30,000 of a ₹1,00,000 portfolio (30%) falls 50% → portfolio −15% | Concentration turns one bad stock into a bad year. |
| S3 | Risk–reward ratio | (target − entry) ÷ (entry − exit) | Entry ₹500, exit ₹480, target ₹560 → 60 ÷ 20 = 3 | How much you aim to make per rupee you risk. |
| S4 | Break-even win rate | 1 ÷ (1 + risk–reward) | Ratio 3 → 25%. Ratio 1.5 → 40% | How often you must be right just to stand still. The sandbox's 1.5× payoff breaks even at 40%, which is why its edge turns negative there. |
| S5 | Typical move over a period | price × annual volatility × √(days ÷ 252) | 16% a year → about ±1% a day, ±4.6% a month | What a normal wobble looks like, so a 3% day isn't mistaken for news. About one period in three moves more than this. |
| S6 | Return per unit of risk (simple Sharpe) | (return − risk-free rate) ÷ volatility | (12% − 3%) ÷ 20% = 0.45 vs (9% − 3%) ÷ 10% = 0.60 | Higher return isn't better if it came with far more swing. Sharpe counts upside swings as risk too; the Sortino ratio uses only downside moves. [Sharpe 1994](https://web.stanford.edu/~wfsharpe/art/sr/sr.htm) |
| S7 | Beta | correlation × (asset volatility ÷ market volatility) | 0.6 × (30% ÷ 15%) = 1.2 → expect about 1.2% for a 1% market move | How much of a stock's move is just the market. Covered with correlation in [07](07-portfolio-correlation.md). |

`server/content.ts` already has practice questions for S6 (`sharpe`) and recovery maths (`drawdown`). S1–S4 fit the Study sizing and plan tracks as check questions.

## The deeper calculations

Ordered roughly by how early a beginner needs them.

| # | Calculation | Formula | Worked example | What it teaches |
| --- | --- | --- | --- | --- |
| R1 | Position size from risk | size = (account × risk %) ÷ distance to exit | ₹1,00,000 × 2% = ₹2,000 at risk. Exit 5% away → ₹40,000 position | Decide the loss first; size follows. The "1–2% per idea" figure is a practitioner rule of thumb, not a research finding. |
| R2 | Recovery after a loss | gain needed = 1 ÷ (1 − loss) − 1 | −20% needs +25%. −50% needs +100%. −80% needs +400% | Losses and gains aren't symmetric. Avoiding big drawdowns matters more than catching big wins. |
| R3 | Volatility drag | compound growth ≈ average return − σ² ÷ 2 | +50% then −50% averages 0% but leaves you at −25% | Volatility costs money on its own, even with no change in average return. |
| R4 | Expectancy (edge) | edge = p × b − (1 − p), per unit risked | 45% wins paying 1.5× → +0.125 per unit risked | A strategy with no edge can't be rescued by sizing; a positive edge can still be ruined by it. |
| R5 | Kelly fraction | f* = p − (1 − p) ÷ b | 45% wins, 1.5× payoff → 8.3% of the account | The **ceiling**, not a target. Betting 2× Kelly gives roughly zero growth; more than that shrinks the account on average. |
| R6 | Drawdown and risk of ruin | max drawdown = largest fall from a peak; ruin = share of paths that fall below a floor | See the sandbox numbers below | Bad runs are normal. Size so a bad run hurts but doesn't end the game. |
| R7 | Leverage | leverage = contract value ÷ margin posted | ₹15 lakh Nifty contract on about ₹1–2 lakh margin ≈ 10–15× (blog estimate, **Confirm** with exchange margin files). A 1% index move ≈ 10–15% of the margin | Why F&O losses are so large relative to account size. |
| R8 | Annualised volatility | σ_year ≈ σ_day × √252 | 1% daily moves ≈ 16% a year | Turns daily noise into a number people can compare. Remind users real returns have fat tails, so "within ±1σ two-thirds of the time" understates crashes. |
| R9 | Diversification | portfolio risk falls as holdings are added, then flattens | 1 stock → 30–40 random stocks (Statman); one index fund does this at once | Concentration is a choice with a cost. Correlations rise in crashes (Longin & Solnik). |
| R10 | VaR and expected shortfall | VaR = loss not exceeded at a confidence level; ES = average loss beyond it | "5% of months lose more than X" | Background only. Banks moved from VaR to ES at 97.5% under FRTB because VaR ignores how bad the tail is ([summary](https://www.acadifi.com/community/conditional-var-expected-shortfall-cvar-tail-risk-measure)). Too abstract for beginners; R6 teaches the same idea with paths. |

## Findings that cut against our design

- **Simulations can make people bolder, not wiser.** Kaufmann et al. found risk simulations raised risk-taking and lowered perceived risk. The Strategy Lab and the risk sandbox are exactly this kind of tool. Pair every simulation with a debrief and a calibration prompt (see [04](04-learning-science.md)), and track whether users' chosen risk per trade rises after sandbox use.
- **Stops control risk; they don't add return.** The synthetic generator's base layer is a random walk, where Kaminski & Lo show stop-losses lower expected return. Regime switching adds some momentum, so stops may help in those presets, but that's a property of the preset, not of stops. The process score rewards defined exits, which is right for discipline. Copy must never say stops improve returns.
- **Stops don't cap the loss exactly.** `server/market.ts` adds Merton jumps, so prices can gap straight through an exit. The Study example's "you lose about ₹2,000" holds only without gaps. Teach gap risk with a jump in a scenario, and score the plan, not the slippage.
- **Real edge is unknown.** Kelly (R5) needs a true win rate and payoff, which no trader has. Overestimating edge leads straight to overbetting. Teach Kelly as a reason to bet small and as an upper bound, never as a size to use.

## Fit with the current codebase

- **`src/content/study.ts`** (sizing track) already covers R1 and R2. Add a gap-risk line to the worked example.
- **`server/market.ts`** already computes `maxDrawdown`, `annualVolatility`, `worstDay` and `totalReturn` (R6, R8), and its drift includes the `− variance / 2` drag term (R3). Showing "gain needed to recover" next to `maxDrawdown` would reuse R2 at no cost.
- **`src/components/RiskSandbox.tsx`** pays 1.5× on wins. What the sandbox itself shows, replaying its seed (`20261029`) for 100 traders × 100 trades. Each cell is median ending balance / traders who lost more than half / median worst drawdown:

  | Win rate | Kelly | 2% | 5% | 10% | 25% |
  | --- | --- | --- | --- | --- | --- |
  | 45% (default) | 8.3% | 1.31× / 0 / −17% | 1.75× / 1 / −40% | 2.10× / 12 / −68% | 0.41× / 56 / −98% |
  | 50% | 16.7% | 1.60× / 0 / −13% | 2.86× / 0 / −31% | 5.58× / 2 / −55% | 4.66× / 20 / −92% |
  | 60% | 33.3% | 2.76× / 0 / −10% | 11× / 0 / −23% | 83× / 0 / −41% | 3,663× / 0 / −77% |

  At the default 45%, 10% sits just past Kelly and has the **highest** median, though 12 of 100 traders lose half and the typical drawdown is −68%. At 60%, 25% is still under Kelly and grows fastest. The verdict used to call 10% and above "a lottery" at any positive edge, which the stats contradicted. It now depends on risk ÷ Kelly (at most half Kelly, up to Kelly, up to 2× Kelly, beyond 2× Kelly) and names the Kelly figure for the current win rate. A possible next step is marking the Kelly point and the "2× Kelly ≈ zero growth" point on the control itself.
- **Riskometer.** A Study card on reading the six-level label, and what it leaves out (it rates the fund, not your position size or horizon), connects R8 and R9 to something users already see.

## Teaching rules

1. Show a distribution of outcomes, never a single projected number.
2. Lead with R1, R2 and R4 before any volatility maths.
3. Frame Kelly as a ceiling and fractional Kelly as the sane zone. Never compute a size for a real instrument (see [05](05-regulation-and-data.md)).
4. Default to longer review intervals in simulations (weekly or monthly views) to blunt myopic loss aversion. This also raises risk-taking, the same direction as the Kaufmann concern, so pair it with the sizing limits.
5. Use compounding visuals, not just formulas, to counter exponential-growth bias.
6. Don't rely on a risk questionnaire to set a user's level. Watch what they do in the Lab instead.

## Open questions

- Get NSE's current Nifty margin to replace the blog leverage estimate in R7.
- Decide whether the sandbox should show Kelly explicitly, or only describe it in Study.
