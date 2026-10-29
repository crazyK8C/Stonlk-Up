# Portfolio correlation

This is research, not investment advice. Most findings come from abstracts. Specific numbers marked **Confirm** come from secondary summaries and need checking before we quote them in the app. Worked numbers below are our own arithmetic.

## The evidence

| Finding | Source |
| --- | --- |
| Portfolio risk depends on how holdings move together, not only on how risky each one is. This is the basis of modern portfolio theory. | [Markowitz, J. Finance 1952](https://doi.org/10.1111/j.1540-6261.1952.tb01525.x) |
| People treat correlated assets as if they were independent (correlation neglect). In paired portfolio problems that differed only in correlation, choices barely changed, and many simply split money evenly. Only 1 of 146 subjects chose consistently across all four pairs. | [Eyster & Weizsäcker, DIW 2011 / 2016 version](https://www.lse.ac.uk/economics/Assets/Documents/personal-pages/erik-eyster/correlation-neglect-in-financial-decision-making.pdf) |
| Retirement savers often split money evenly across whatever funds are offered (the 1/n heuristic), so the menu, not their risk needs, sets their equity share. | [Benartzi & Thaler, AER 2001](https://doi.org/10.1257/aer.91.1.79) |
| In 40,000+ US brokerage accounts (1991–96), individual investors were under-diversified, most of all the young, lower-income and less sophisticated. They diversified naively, ignoring correlations among the stocks they picked. | [Goetzmann & Kumar, Rev. Finance 2008](https://www.nber.org/papers/w8686) |
| Correlation between stock markets rises in bear markets but not bull markets. | [Longin & Solnik, J. Finance 2001](https://faculty.essec.edu/en/research/extreme-correlation-of-international-equity-markets) |
| Measured correlation rises mechanically when volatility rises, so crisis "contagion" partly reflects higher volatility. Adjusted for this, linkages were high all along. Later work disputes how general this is. | [Forbes & Rigobon, J. Finance 2002](https://www.nber.org/papers/w7267) |
| The US stock–bond correlation averaged about +0.35 in 1970–99 and −0.31 in 2000–22, then flipped positive in 2022 as inflation rose (about +0.58 for the year). Bonds don't always hedge stocks. **Confirm** the figures against Molenaar et al. 2023. | [Franklin Templeton / Brandywine](https://www.franklintempleton.com/articles/2023/brandywine-global/deconstructing-the-dynamic-duo-of-stocks-and-bonds), [Alpha Architect](https://alphaarchitect.com/stock-bond-correlation/) |
| Bitcoin's daily correlation with the S&P 500 rose from about 0.01 (2017–19) to 0.36 (2020–21), and with emerging-market stocks to 0.34. Crypto stopped behaving like a separate asset. | [IMF blog, Jan 2022](https://www.imf.org/en/blogs/articles/2022/01/11/crypto-prices-move-more-in-sync-with-stocks-posing-new-risks) |
| Gold's correlation with Indian equities was negative in the 2008–09, 2020 and 2022 crises, which suggests a safe-haven role. In calm periods it's closer to zero, and figures vary by window. | [Bhunia & Das 2025](https://asianonlinejournals.com/index.php/Economy/article/view/7726) |
| Indian equity funds hold many of the same stocks. In 2009, 203 diversified schemes held only 659 distinct stocks. Today SEBI requires large-cap funds to hold at least 80% in the top 100 companies, so two large-cap funds overlap heavily. Current overlap figures (often quoted as 60–80%) come from vendor blogs. **Confirm** with AMFI portfolio disclosures. | [Moneylife (2009 data)](https://www.moneylife.in/article/mf-schemes-skewed-concentrated-and-similar/3242.html), [Edelweiss MF](https://www.edelweissmf.com/investor-insights/mutual-fund-investment-tips-and-articles/mutual-fund-portfolio-overlap) |
| Across 14 optimising models and seven datasets, none consistently beat an equal-weight (1/N) portfolio out of sample. Errors in estimating returns and correlations cancelled the gains from optimising. | [DeMiguel, Garlappi & Uppal, RFS 2009](https://ideas.repec.org/a/oup/rfinst/v22y2009i5p1915-1953.html) |
| Regressing one trending series on another produces strong-looking but meaningless relationships (spurious regression). | [Granger & Newbold, J. Econometrics 1974](https://doi.org/10.1016/0304-4076(74)90034-7) |

## The calculations

| # | Calculation | Formula | Worked example | What it teaches |
| --- | --- | --- | --- | --- |
| C1 | Correlation | ρ = covariance(a, b) ÷ (σa × σb), from −1 to +1 | Calculated on **returns**, never on prices (see C8) | Whether two holdings tend to move together, not how much. |
| C2 | Shared variance | R² = ρ² | ρ = 0.3 → only 9% of the movement is shared. ρ = 0.7 → 49% | A correlation of 0.5 sounds high but explains just a quarter of the movement. |
| C3 | Two-asset portfolio risk | σp² = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂ | Two assets at 20% volatility, 50/50: ρ +1 → 20%, +0.5 → 17.3%, 0 → 14.1%, −0.5 → 10%, −1 → 0% | Mixing only helps when ρ is below +1, and helps most when it's low or negative. Already in the Study `diversify` track for +1 and 0. |
| C4 | The diversification floor | equal weights, average correlation ρ: σp = σ × √(ρ + (1 − ρ) ÷ n) | Stocks at 30% volatility, ρ = 0.3: 1 stock 30%, 5 stocks 19.9%, 10 stocks 18.2%, 30 stocks 17.1%, infinite 16.4% | Adding stocks has a limit set by correlation. Past about 10–30 holdings, the market's own risk is what's left. |
| C5 | Effective number of bets | n ÷ (1 + (n − 1) × ρ) | 30 stocks at ρ = 0.3 ≈ 3 independent bets. At ρ = 0.7 ≈ 1.4 | Holding 30 names isn't 30 bets. A portfolio of 10 bank stocks is closer to one. |
| C6 | Crash correlation | C4 rerun with crisis correlation | Same 30 stocks, ρ rising from 0.3 to 0.7: volatility 17.1% → 25.3% | Diversification shrinks when it's needed most (Longin & Solnik). |
| C7 | Beta | β = ρ × σasset ÷ σmarket | 0.6 × 30% ÷ 15% = 1.2 | How much of a holding is just market exposure. High-beta portfolios aren't diversified away from the market. |
| C8 | Price vs return correlation | correlate % changes, not price levels | In 2,000 simulated pairs of **independent** random walks (250 days), 40% showed price-level correlation above 0.5 in absolute value. Their daily returns: none | Charts that "move together" may share nothing. The classic beginner error. |
| C9 | How sure is the estimate? | standard error ≈ (1 − ρ²) ÷ √(observations) | ρ = 0.3 from 5 years of monthly data: ±0.23 at 95%, so the true value could be 0.07–0.53. From 1 year of daily data: ±0.11 | Correlations from short histories are noisy. DeMiguel et al. found this noise cancels the gains from optimising. |
| C10 | Fund overlap | sum over shared stocks of the smaller of the two weights | Two large-cap funds sharing 70% of weight act more like one fund | Owning several funds isn't diversification if they hold the same stocks. Directly relevant to Indian SIP investors. |

## Misconceptions to design against

| # | Belief | Reality | What the product does |
| --- | --- | --- | --- |
| M1 | "More holdings = more diversified" | Correlation sets the floor (C4, C5) | A slider for count and correlation showing volatility and effective bets |
| M2 | "Correlation is fixed" | It shifts with regimes, inflation and crises (stock–bond flip, crypto) | Scenarios where correlation changes mid-run |
| M3 | "Negative correlation means it always goes up when the other falls" | ρ describes a tendency over many periods, not each day | Show scatterplots of daily pairs, not just the number |
| M4 | "Several funds = diversified" | Large-cap funds overlap heavily | A Study card on overlap (C10) with illustrative portfolios, never named funds |
| M5 | "These two charts look alike, so they're correlated" | Trending prices fool the eye (C8) | A blind "correlated or not?" drill on price charts, revealing return scatterplots |
| M6 | "Gold / bonds / crypto always hedge stocks" | Hedges are regime-dependent | Crash scenarios where the hedge works, and inflation scenarios where it doesn't |
| M7 | "Optimise weights from past correlations" | Estimates are too noisy (C9) | Teach equal weight and simple rules as sensible defaults |

## Fit with the current codebase

- **`src/content/study.ts` `diversify` track** covers C3 for ρ = +1 and 0. Add the floor (C4) and effective bets (C5) as its next step, plus a check question such as "30 stocks at 0.3 correlation are roughly how many independent bets?"
- **`server/content.ts`** has `correlation` and `diversify` questions. C2, C8 and C10 make good new ones.
- **`server/market.ts`** generates one asset per path. Correlation lessons need several assets that move together. Draw correlated shocks with a Cholesky factor of a target correlation matrix, and let the regime set the correlation (higher in the bear regime) to teach C6. Keep the same seed rule so runs replay exactly.
- **Data.** Real correlation tables (Nifty vs gold vs bonds) need licensed historical data and the 30-day lag in [05](05-regulation-and-data.md). Use synthetic or published academic figures, labelled, until then.

## Teaching rules

1. Teach correlation on returns from the first lesson. Never show a price-level correlation without the warning in C8.
2. Pair every correlation number with a picture: a scatterplot or the C4 curve.
3. Always show the crisis version next to the calm version (C6).
4. Lead with effective bets (C5). "You hold 3 bets, not 30" lands faster than a covariance formula.
5. Never name a real fund or stock as a diversifier. Use illustrative assets (see [05](05-regulation-and-data.md)).

## Open questions

- Pull current large-cap overlap figures from AMFI or SEBI portfolio disclosures rather than vendor blogs.
- Confirm the stock–bond correlation figures in Molenaar et al. 2023.
- Decide whether the multi-asset generator is Phase A or comes with licensed replays.
