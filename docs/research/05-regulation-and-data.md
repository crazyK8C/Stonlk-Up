# Regulation and data constraints

This is research, not legal advice. Items marked **Confirm** need checking against the primary document or with a lawyer before launch.

## SEBI: price data and investor education

| Date | Rule | What it means for us |
| --- | --- | --- |
| May 24, 2024 | Circular SEBI/HO/MRD/MRD-PoD-3/P/CIR/2024/56: exchanges and intermediaries must not share **real-time** price data with third parties (named: online gaming and virtual trading platforms), except for orderly market functioning or regulatory needs. Sharing requires agreements, due diligence and audit trails. [NSDL copy](https://nsdl.co.in/downloadables/pdf/2024-0067-Policy-SEBI_Circular_on_Norms_for_sharing_of_real_time_price_data_to_third_parties.pdf), [Mondaq](https://www.mondaq.com/india/securities/1482538/securities-and-exchange-board-of-india-issues-norms-for-sharing-of-real-time-price-data-to-third-parties) | Never use live Indian prices. |
| Nov 4, 2024 | Investor advisory warning against unauthorised virtual trading, paper trading and fantasy games built on real-time prices. [Khaitan & Co](https://www.khaitanco.com/thought-leadership/SEBI-Cracks-Down-on-Unauthorised-Gaming-and-Trading-Platforms), [MediaNama](https://www.medianama.com/2024/11/223-sebi-issues-warning-on-virtual-stock-games-using-real-time-data/) | Position as education, with no live data. |
| Jan 29, 2025 | Education-only persons may use market price data only with a **3-month lag**. No advice and no performance claims without SEBI registration. Stock names and prices can't be used in ways that imply advice. [Business Standard](https://www.business-standard.com/markets/news/sebi-finfluencer-circular-live-stock-data-market-education-rules-125013000571_1.html), [Exchange4media](https://www.exchange4media.com/influence-zone-news/sebi-restricts-finfluencers-from-using-live-stock-market-data-educational-content-140505.html) | Our content must never read as a tip. Keep the disclaimer. |
| May 8, 2026 (reported) | Revised norms: price data may be shared for investor education with a **30-day lag**, and **without any monetary incentive to participants**. [Taxguru](https://taxguru.in/sebi/norms-sharing-usage-price-data-educational-purposes.html), [consultation coverage](https://moneylife.in/article/sebi-plans-30day-pricedata-lag-to-curb-misuse-by-market-educators/79450.html) | **Confirm** on sebi.gov.in. If final: Indian price data must lag at least 30 days, and **no cash rewards ever**. |

## Online Gaming Act 2025 (India)
- Bans real-money online games, whether of skill or chance, along with their advertising and payments. E-sports and social and educational games remain allowed. Rules reportedly took effect on May 1, 2026. [TechCrunch](https://techcrunch.com/2025/08/20/india-bans-real-money-gaming-threatening-a-23-billion-industry), [Mondaq summary](https://www.mondaq.com/india/gaming/1676566/summary-promotion-and-regulation-of-online-gaming-act-2025)
- **For us:** coins and XP must never be bought, sold or redeemed for money or prizes of money value. No paid-entry contests. **Confirm** with counsel how the Act's "online money game" definition treats leaderboards and sponsored prizes.

## DPDP Act 2023 and Rules 2025 (India)
- Anyone under 18 is a "child". Processing a child's data needs **verifiable parental consent** (Rule 10). Behavioural tracking and targeted ads aimed at children are prohibited. Penalties go up to ₹200 crore. [ORF](https://www.orfonline.org/expert-speak/dpdp-rules-and-the-future-of-child-data-safety), [K&S](https://ksandk.com/data-protection-and-data-privacy/childrens-data-protection-under-indias-dpdp-rules/)
- Sources disagree on whether edtech engagement analytics are exempt. Most obligations reportedly phase in over 18 months. **Confirm** the commencement date and the Fourth Schedule text.
- **For us:** our stats, history and adaptive practice are behavioural tracking. Launch as **18+** (age gate at signup), or build a youth mode with parental consent and no behavioural analytics.

## Market data licensing
- S&P 500 and ICE BofA series on FRED: no reproduction without the index provider's written permission. [FRED](https://fred.stlouisfed.org/graph/?g=1XVfO)
- NSE end-of-day data: paid subscription with an undertaking. **Confirm** the redistribution and display terms with NSE. [NSE](https://www.nseindia.com/static/market-data/eod-historical-data-subscription)
- API vendors (Alpha Vantage, EODHD, Twelve Data): display rights for end users not confirmed. Read each provider's terms before use.
- FEDFUNDS (already ingested) is a Federal Reserve series. Still check FRED's series notes before display.

## US notes
- FINRA's investor-education content is available on Zogo (2026). Regulator content partnerships are possible. [FINRA](https://www.finra.org/media-center/newsreleases/2026/finra-makes-investor-education-content-available-zogo-financial)
- A US launch would need its own review: adviser status for educational content, state rules on sweepstakes and prizes, and COPPA for under-13s.

## Launch checklist
- [ ] No real-time or recent Indian prices: synthetic, macro, or licensed historical data with at least a 30-day lag
- [ ] No money in the reward loop: no cash prizes, paid entry or redeemable coins
- [ ] No stock tips, no performance claims, disclaimer on every scenario
- [ ] 18+ age gate, or a consented youth mode without tracking
- [ ] Each dataset has a recorded license and an attribution line
- [ ] Every chart labelled historical, synthetic or illustrative
