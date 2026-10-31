# How traders practise, and the Lab as one workbench

Compiled 31 October 2026. This note looks at how traders practise today, the traditional ways and the modern tools, and what that means for the Strategy Lab. The Lab is now the product's main focus. The aim is a single workbench for practising trading decisions, the way Photoshop is a single workbench for editing photos.

## The traditional ways

| Practice | How it works | What it trains | Weakness |
| --- | --- | --- | --- |
| **Apprenticeship on a desk** | New traders watch, then trade small under a mentor. Prop firms such as SMB Capital run daily recorded review sessions of live trades ([SMB](https://www.smbtraining.com/blog/what-smb-traders-did-to-improve-most)) | Pattern recognition, discipline, the "right activities and mindset" modelled by seniors ([Steenbarger interview](https://www.tradingsim.com/blog/trading-stress-steenbarger-interview)) | Needs a firm and a mentor; almost no retail trader has either |
| **The playbook** | A documented catalogue of setups the trader has shown an edge in. SMB traders write up one playbook trade after every session, and new traders review the best setups daily whether or not they traded them ([TraderLion summary](https://traderlion.com/trading-books/the-playbook-summary/), [Bellafiore lessons](https://tradethatswing.com/key-lessons-for-day-traders-from-the-playbook-by-mike-bellafiore/)) | Knowing *which* trades are yours, and repeating them | Takes months of self-tracking to build |
| **Journal with pre- and post-mortem** | Write the plan and the likely mistakes before entry; review what actually happened after exit ([Fidenza](https://fidenza.substack.com/p/journaling-trades-and-trading-mistakes)) | Self-awareness; the plan-versus-action gap | Most people stop after a week; manual entry is a 10–15 minute daily chore |
| **Paper trading** | Place pretend orders on live prices | Platform mechanics, routine | Changes behaviour: people take more risk on paper, especially after a loss ([Imas, via StockCharts](https://www.stockcharts.com/articles/muscular-investing/2019/05/paper-trading-is-not-serious-money.html)) |
| **Chart study / case study** | Study past crashes and manias with the outcome known | Context, history | Hindsight: you already know how it ended |
| **Risk-desk stress tests** | Run the book through 1987, 2008 or a custom shock and see the loss in rupees ([Cboe](https://www.cboe.com/services/analytics/hanweck/stress_tests), [Vanguard](https://advisors.vanguard.com/strategies/portfolio-strategies/portfolio-analytics/stress-testing)) | Sizing and correlation for the bad day | Built for institutions and advisers, not new traders |

## The modern tools

| Tool | Examples | What it adds | What it misses |
| --- | --- | --- | --- |
| **Market replay** | TradingView Bar Replay, FX Replay | Re-live past bars at chosen speed, with drawings and indicators; replay sessions report P&L and an equity curve ([TradingView](https://www.tradingview.com/support/solutions/43000712747-bar-replay-how-and-why-to-test-a-strategy-in-the-past/)) | Slow: 10–40 hours of manual replay per year of data (vendor estimate, [Backtrex](https://backtrex.com/en/blog/tradingview-bar-replay-backtesting-tutorial)); scores P&L, not the decision |
| **Challenge simulators** | FX Replay prop simulator | Practise under hard rules: profit target, max daily loss, max total loss, no rewind ([review](https://newyorkcityservers.com/blog/fx-replay-review)) | Rules aimed at passing a prop exam, not learning |
| **Journals with analytics** | Edgewonk, Tradervue, TradeZella | Tag trades, find patterns; Edgewonk adds a "Tiltmeter" and pre/post-trading checklists ([Edgewonk course](https://edgewonk.com/course), [LuxAlgo](https://www.luxalgo.com/blog/edgewonk-journal-tool-analysis/)) | Only analyses trades you already made with real money |
| **Monte Carlo / risk of ruin** | TradeZella simulator, FX Replay | Shuffle a trade list thousands of times; read the 95th-percentile drawdown at each risk size ([NexusFi](https://nexusfi.com/a/risk-management/monte-carlo-simulation), [TradeZella](https://www.tradezella.com/tools/monte-carlo-simulator)) | Assumes trades are independent, so it understates risk in clustered losing streaks |
| **Strategy / payoff builders** | Sensibull, Opstra | Multi-leg payoff at expiry, breakevens, Greeks; Opstra adds backtests ([AlgoTest comparison](https://algotest.in/blog/opstra-vs-sensibull.md)) | A payoff diagram shows what happens if your assumptions hold, not when they don't |
| **Backtesters** | Opstra, AlgoTest, Python | Test rules on history | Overfitting: standard hold-out checks are unreliable for backtests ([Bailey et al., PBO](https://papers.ssrn.com/abstract=2326253)) |
| **AI mentors** | FX Replay Mentor AI (beta) | On-demand explanation | Early; easy to drift into advice |

## What the evidence says about practice itself

1. **Deliberate practice targets a named weakness, at the edge of ability.** Opening a replay and clicking around is "entertainment", not practice ([TradeZella guide](https://www.tradezella.com/blog/deliberate-trading-practice-guide)). Steenbarger: simulation is necessary but not sufficient, and live trading is poor practice because the feedback is noisy ([review](https://completetradersedge.com/?p=231762)).
2. **Simulators change risk-taking.** Paper trading increases risk-taking after losses (Imas), and risk simulations raised risk-taking in Kaufmann, Weber & Haisley (note 08). Every Lab instrument needs a boldness check, not just a result.
3. **Monte Carlo is only as good as its inputs.** "A beautifully precise distribution of meaningless numbers" if the trade list is curve-fit ([NexusFi](https://nexusfi.com/a/risk-management/monte-carlo-simulation)). Show that caveat beside the result.
4. **People understand rupees better than volatility.** "You would have lost ₹1.8 lakh" lands; "14% annualised volatility" does not ([StratiFi](https://www.stratifi.com/glossary/stress-testing)).

## The gap

A new trader who wants to practise properly today needs six products: a replay tool, a challenge simulator, a journal, a Monte Carlo calculator, a payoff builder and a stress tester. They cost $30–50 a month each, are built for the US or forex, and all of them score profit, not the decision. None of them tells a beginner *what to practise next*.

## The Lab as a workbench (the Photoshop reference)

Photoshop works because every tool shares one canvas, one way of setting options and one history. Mapped onto the Lab:

| Photoshop | Strategy Lab |
| --- | --- |
| Tool bar | Instrument rail, grouped by workflow: **Plan → Simulate → Replay → Review** |
| Canvas | The instrument itself: chart, simulation, replay |
| Options / properties panel | Brief panel: what this instrument answers, how to read it, the principle behind it |
| Tutorials inside the app | "Try this" exercises on every instrument, each a deliberate-practice drill with a target |
| History panel | Run history and the gap tracker |
| Actions / presets | The playbook: saved plans and setups (next) |
| Workspaces | Lobby first: what the Lab can do, then enter |

### Instruments

| Station | Instrument | Status | Evidence |
| --- | --- | --- | --- |
| Plan | Position sizer | Built (moved from home) | Note 06, S1–S4 |
| Simulate | Sizing sandbox | Built | Kelly as a ceiling (note 06) |
| Simulate | Risk of ruin (Monte Carlo) | **New in this round** | Monte Carlo method above |
| Simulate | Regime drill | Built | Note 03 |
| Replay | Event replay | Built | Debriefs +25% (note 04) |
| Review | Gap tracker | Built | Plan/behaviour gaps (note 03) |
| Plan | Pre-mortem card + playbook | Next | SMB playbook, journal pre-mortem |
| Plan | Payoff builder | Later | Sensibull/Opstra gap: add "when assumptions fail" |
| Simulate | Challenge mode (daily loss limit, no rewind) | Later | FX Replay prop simulator |
| Simulate | Correlation lab | Later | Note 07, 2022 stock–bond flip |

### Design rules for every instrument

- Say in one line what question it answers, before any input.
- Give two or three "Try this" drills with a concrete target, so nothing sits there "doing nothing".
- Show results in rupees, with the model caveat beside them.
- Never score profit alone; tie each instrument back to the plan and the gap tracker.
