# Stonk Up — copy-ready technical handoff prompt

Use the contents of this document as the next agent's initial project brief. This handoff was checked against the local source on **October 28, 2026**. Treat source files as authoritative if they subsequently change. Earlier successful test results are described as historical results, not as tests rerun on the handoff date.

---

You are taking over an **existing, playable MVP** called **Stonk Up**. Continue its implementation; do not scaffold a replacement application or discard its existing design, content, and progress storage.

Act as a senior product designer, React/TypeScript engineer, backend engineer, game UX designer, and financial education/data architect. Read this handoff and the repository before starting the next task. Make routine implementation decisions autonomously. Keep product facts, implementation facts, plans, and unverified capabilities clearly distinguished.

## 1. Product concept and priorities

**Name:** Stonk Up 📈🐱

**Tagline:** “Learn the market. Make terrible predictions. Get better.”

This is a modern game that teaches finance through decisions and consequences. It should feel like Duolingo × a trading game × modern fintech × internet meme culture. It must not become a generic finance dashboard, CRUD app, or collection of long educational articles.

The central loop is:

```text
See a market event or scenario
→ Predict an outcome
→ Lock the answer
→ Get a temporary cat reaction
→ Reveal the answer/outcome
→ Explain why, with appropriate sources and uncertainty
→ Show relevant calculations or charts
→ Earn server-controlled rewards
→ Discover a concept / progress toward a level
→ Play another round
```

Progressively disclose information. Do not put the explanation or outcome chart in front of the player before they answer. The current UI moves the next-round action below the revealed lesson so the player can learn and continue without scrolling back up.

Educational scope includes stocks, supply/demand, market psychology, fundamentals, earnings, macroeconomic news, risk/reward, probability, expected value, mathematical models, diversification, historical events, portfolio ideas, and decision making under uncertainty. Mathematical complexity should increase gradually.

**Crucial financial distinction:** a historical observation, a simplified model, and a current-event forecast are different things. Good news does not guarantee a stock-price increase. Label models and illustrative charts explicitly. Do not fabricate historical returns, claim certain causation from a single event, or present an LLM's generated financial claims as verified facts.

The product disclaimer is:

> Stonk Up is for educational and entertainment purposes only and does not provide financial advice or investment recommendations.

## 2. Where the project is and how to access it

The existing workspace is on Windows:

```text
C:\Users\kunal\OneDrive\Documents\ChatGPT\stonkUp
```

Use PowerShell from that directory. This path is local to the user's machine; a remote agent cannot access it merely by receiving this prompt. A remote agent needs a repository checkout or a source archive from the user. No remote Git URL or deployed public URL is established by this handoff.

The repository contains `.git`, but at handoff inspection the application files were **untracked**. Do not assume they have been committed or pushed. Preserve existing files and inspect `git status` before changes. Creating this handoff did not commit, push, deploy, or alter application behavior.

Normal local addresses, after starting the processes:

```text
Frontend:     http://127.0.0.1:5173/
API:          http://127.0.0.1:3001/
Health check: http://127.0.0.1:3001/api/health
PostgreSQL:   127.0.0.1:5432, when configured
```

These are local addresses, not shareable hosted URLs. Do not assume earlier preview processes are still running. Verify or start them.

There is no supplied account password for the user. Use the UI's **Play as guest**, or register a new local account. Passwords require at least ten characters. Do not expose local account records or password hashes.

When transferring the code, include source, public assets/license files, package manifests, lockfile, configuration examples, documentation, and Docker Compose. Exclude `.env`, `.local/`, `node_modules/`, `.pnpm-store/`, and logs. `.local/` can contain actual demo account/session records; it is not a source-code fixture.

## 3. Actual technology stack

| Area | Existing implementation |
| --- | --- |
| Language | Strict TypeScript, ESM |
| UI | React 19 |
| Frontend tooling | Vite 6 |
| Styling | Custom responsive CSS |
| Icons | lucide-react |
| Motion | CSS animations/transitions, reduced-motion support |
| Charts/art | Code-native SVG; `MiniChart` and original trading-cat mascot |
| Server | Node.js + Express 5 |
| Validation | Zod |
| Database | PostgreSQL via `pg` |
| ORM | Drizzle for typed core tables and scoring transactions |
| Other database operations | Parameterized PostgreSQL queries |
| Authentication | Salted scrypt passwords and opaque cookie sessions |
| Security middleware | Helmet, express-rate-limit, origin checks |
| Configuration | dotenv and environment variables |
| Testing | Node test runner/assert, executed through tsx |
| Package manager | pnpm; preserve `pnpm-lock.yaml` |
| Formatting | Prettier |

Tailwind, Next.js, Framer Motion, Recharts, NestJS, and Prisma were ideas in the original brief, **not the actual installed architecture**. Do not describe them as implemented or replace working parts just to introduce them.

## 4. Current folder structure

```text
stonkUp/
├── .gitignore
├── .env.example                  # Names/defaults only; no real secrets
├── .prettierrc.json
├── AGENT_HANDOFF.md               # This document
├── README.md                      # Existing setup, architecture, source notes
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml            # esbuild build permission; pnpm run behavior
├── tsconfig.json                  # strict TypeScript; noEmit
├── vite.config.ts                 # /api proxy → 127.0.0.1:3001
├── docker-compose.yml            # PostgreSQL 17 Alpine for local development
├── index.html                     # React entry page and metadata
├── public/
│   ├── favicon.svg
│   └── reactions/
│       ├── 1f639.svg
│       ├── 1f63a.svg
│       ├── 1f63b.svg
│       ├── 1f63c.svg
│       ├── 1f63e.svg
│       ├── 1f63f.svg
│       ├── 1f640.svg
│       ├── ATTRIBUTION.md
│       └── LICENSE-GRAPHICS.txt
├── src/
│   ├── main.tsx                   # App, views, auth/game state and interactions
│   ├── styles.css                 # Design system, layout, breakpoints, motion
│   ├── components/
│   │   └── GameArt.tsx            # Mascot and MiniChart
│   └── lib/
│       └── api.ts                 # Same-origin JSON request helper
├── shared/
│   └── types.ts                   # Public question/profile/reveal contracts; levels
├── server/
│   ├── index.ts                   # Express startup, middleware, API routes, tickets
│   ├── content.ts                 # Seed content, Zod schema, publicQuestion filter
│   ├── game.ts                    # Daily selection, reset, rewards, stats/streak math
│   ├── store.ts                   # PostgreSQL + explicit local demo storage adapter
│   ├── db-schema.ts               # Typed Drizzle core tables
│   ├── schema.sql                 # Initial PostgreSQL schema and constraints
│   ├── migrate.ts                 # Transactional schema application + seed upserts
│   ├── ingest.ts                  # Official FRED FEDFUNDS import
│   ├── reactions.ts               # Reaction category → asset/message provider
│   ├── game.test.ts               # Six core logic tests
│   └── api.integration.ts         # Running-server integration script
├── .local/                       # Generated, ignored; preserve existing data
│   ├── demo.json                  # Demo users, sessions, attempts, daily manifests
│   └── preview-desktop.jpg        # Earlier verified dashboard screenshot
├── node_modules/                 # Generated, ignored
└── dist/                         # Generated production frontend, ignored
```

`.local`, `node_modules`, and `dist` are runtime/build outputs, not portable source requirements. The source app is currently concentrated in `src/main.tsx`; splitting views/components is a reasonable incremental improvement, not a reason to rewrite the application.

## 5. Start the existing app

Use Node 22+ and pnpm, preferably a version compatible with the existing pnpm workspace configuration. Preserve the lockfile.

```powershell
Set-Location 'C:\Users\kunal\OneDrive\Documents\ChatGPT\stonkUp'
pnpm install
```

Terminal A:

```powershell
pnpm dev
```

Terminal B, from the same project directory:

```powershell
pnpm dev:web
```

Then open `http://127.0.0.1:5173/`. Vite proxies `/api` to the Express process, so browser requests remain same-origin. `pnpm dev` currently starts the API through tsx; it does not configure a backend watch/restart loop. Restart the API after backend/content changes.

Other existing commands:

```powershell
pnpm build          # tsc --noEmit, then Vite production frontend build
pnpm test           # Core logic tests; no running API needed
pnpm test:api       # Integration checks; requires a running API
pnpm db:migrate     # Requires DATABASE_URL; applies schema and seeds content
pnpm data:sync      # Requires PostgreSQL and FRED_API_KEY
```

The integration script reads optional `TEST_API_URL`, defaulting to `http://127.0.0.1:3001`. It creates test accounts and attempts in the selected store and does not remove them. Use an isolated test database for database verification. Repeated runs can encounter the shared auth rate limit.

### Runtime fallback paths on this machine

At handoff inspection, these runtime locations were available:

```text
Node:
C:\Users\kunal\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe

pnpm:
C:\Users\kunal\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd
```

If pnpm is absent from a new agent's PATH, PowerShell can invoke the known executable with `& 'full-path-to-pnpm.cmd' dev`. These locations are machine-specific and should not be committed as application runtime requirements.

Earlier Windows sandbox execution blocked esbuild directory reads and tsx runtime calls; those commands succeeded when run with the environment's approved execution mechanism. If similar errors recur, distinguish environment restrictions from app failures and use the host's normal approval flow. Do not weaken system protections to make the project run.

## 6. Configuration and storage modes

The checked-in `.env.example` declares:

```dotenv
PORT=3001
DATABASE_URL=
NODE_ENV=development
APP_ORIGIN=http://127.0.0.1:5173
FRED_API_KEY=
ALPHA_VANTAGE_API_KEY=
```

Never put provider keys in frontend code or `VITE_` variables. Do not overwrite a user's existing `.env` or print secret values.

### Local demo mode — implemented and previously tested

When `DATABASE_URL` is absent, the API uses `.local/demo.json` on the server. This is persistent local development storage, not browser localStorage and not production PostgreSQL.

The adapter serializes mutations through a queue, clones state for rollback, writes a temporary JSON file, and atomically replaces the previous file. Windows/OneDrive can briefly lock files, so atomic replacement has bounded retries. Preserve these protections if editing the adapter. Do not run multiple API processes against this file.

The UI labels this mode as a local demo. No seeded leaderboard, streak, accuracy, or XP performance is presented as a real user's achievement.

### PostgreSQL mode — implemented, not previously executed here

Docker and psql were not found on PATH at handoff inspection. A PostgreSQL connection is still required to validate this path end to end.

If Docker is available in the next environment:

```powershell
docker compose up -d db
```

Create `.env` from the example only if it does not already exist. Set this **local development** connection string for the included container:

```dotenv
DATABASE_URL=postgresql://stonk:local-development-only@127.0.0.1:5432/stonk_up
```

Then run:

```powershell
pnpm db:migrate
pnpm dev
```

The Compose password is a published development default, not a real secret suitable for deployment. Use separate credentials and configuration in production.

On PostgreSQL startup, the API loads published questions from `questions.content`, validates them through the content schema, and requires at least ten. Production mode refuses to start without `DATABASE_URL`.

`pnpm build` builds the frontend only; it does not emit a compiled backend. The existing Express server can serve `dist`, but a proper backend production build/start script is still future work. It currently binds to `127.0.0.1`, so adapt binding/reverse-proxy configuration deliberately for containers or hosting. Configure `APP_ORIGIN` to the exact browser origin and serve HTTPS in production for secure session cookies. Switching between `localhost` and `127.0.0.1` can change cookie/origin behavior.

## 7. Database architecture

`server/schema.sql` defines these domains:

| Tables | Responsibility |
| --- | --- |
| `users`, `sessions` | Accounts, balances, hashed session tokens, expiry |
| `levels`, `concepts` | Learning metadata |
| `questions` | Published educational question content as JSONB, concept/event links |
| `daily_challenges` | Persisted UTC-date manifests containing exactly ten question IDs |
| `market_events` | Historical context, event date when known, source URL, verified flag |
| `historical_prices` | Normalized provider/series/date/value observations and fetch time |
| `attempts` | User answer, correctness, rewards, mode, UTC day, timestamp, elapsed seconds, category, difficulty |
| `xp_transactions` | Attempt-linked XP ledger |
| `case_studies` | Reserved phase-2 story-stage data |
| `achievements`, `user_achievements` | Reserved phase-2 achievement structures |
| `reactions` | Reserved reaction records; current runtime mapping is in TypeScript |
| `schema_migrations` | Initial schema version marker |

The SQL schema is broader than the typed Drizzle schema. `db-schema.ts` currently covers users, concepts, market events, question content, attempts, and XP transactions. Keep SQL and ORM definitions consistent when changing them.

Key protections include foreign keys, nonnegative user balances, a unique daily-attempt index on `(user_id, question_id, day)` restricted to daily mode, and a ten-ID daily-manifest constraint.

Scoring locks the user row inside a Drizzle transaction, loads existing attempts, validates duplicates/reward eligibility, inserts the attempt and XP ledger entry, and updates balances together. The local adapter performs equivalent serialized state changes.

The initial migration runner also upserts seed content. It is not yet a mature sequence of incremental production migrations. Rerunning it can overwrite a question's JSON content with the checked-in seed version. Introduce proper versioned migrations and deliberate publishing behavior before production editorial changes.

## 8. Game rules and rewards — preserve these unless asked to change them

### Daily mode

- Ten questions per global UTC day.
- Daily selection initially sorts question IDs by a hash of UTC date plus question ID, then takes ten.
- The selected IDs are persisted in `daily_challenges` or the demo store. A later content addition must not silently replace an ongoing day's set.
- Reset is **00:00 UTC**, which is **05:30 Asia/Calcutta**. The browser displays a countdown, but the server determines the day and expiry.
- Correct answer: **100 XP + 15 coins**.
- Incorrect answer: **15 participation XP + 0 coins**.
- Daily side quests display progress; there is no extra side-quest reward.
- A repeated daily submission for that question/day is rejected.
- A new day's daily question can earn its daily reward again even if practiced before.
- Finishing all ten unique daily questions builds the completion streak. A missed completion day breaks the streak; yesterday's completed streak remains active while today is still in progress.

### Unlimited mode

- Difficulty labels: `Beginner`, `Intermediate`, `Advanced`, `Quant`.
- The API randomly selects from the eligible bank. Random selection can repeat immediately.
- A first correct reward-eligible practice answer earns **20 XP + 3 coins**.
- Incorrect practice answers earn zero.
- Once any attempt on that question has earned XP, unlimited replays award zero. Consequently, even a wrong daily answer's participation XP makes that question ineligible for subsequent practice rewards.
- A wrong practice answer with zero reward does not prevent a later first rewarded correct practice answer.
- Coins currently accumulate; no shop/spending economy is implemented.

### Levels and statistics

```text
Level 1: Market Baby
Level 2: Market Rookie
Level 3: Risk Taker
Level 4: News Trader
Level 5: Quant Wannabe
Level 6: Portfolio Goblin
Level 7: Market Psychopath
Level 8: Quant Overlord
```

Current formula: `min(8, floor(totalXP / 1000) + 1)`. Level 8 starts at 7,000 XP. The UI shows progress within the current 1,000-XP interval and caps the displayed level.

The intended curriculum behind these names is:

| Level | Learning direction |
| --- | --- |
| Market Baby | What stocks represent, supply/demand, basic price movement, bulls and bears |
| Market Rookie | Market capitalization, P/E, revenue/profit, earnings, dividends and company analysis |
| Risk Taker | Risk/reward, probability, expected value, volatility, position sizing and drawdowns |
| News Trader | Earnings surprises, rates, inflation, employment, company news and geopolitical uncertainty |
| Quant Wannabe | Distributions, expected returns, standard deviation, correlation and Sharpe ratio |
| Portfolio Goblin | Diversification, asset allocation, correlation, hedging and portfolio construction |
| Market Psychopath | Fear/greed, herding, panic selling, FOMO and behavioral finance |
| Quant Overlord and later expansion | Simulations, advanced strategies, mathematical models and portfolio analytics |

Introduce formulas in context: percentage return `(final − initial) / initial`, expected value `Σ pᵢxᵢ`, compound growth `PV(1+r)^n`, and simplified Sharpe `(return − risk-free rate) / volatility`. The existing bank teaches some of these through option-based calculations; the full curriculum is not yet a complete lesson library.

Accuracy uses all recorded attempts, including repeats. Statistics include category/difficulty breakdowns, concepts practiced, average server-measured response duration, a recent-miss practice suggestion, and the most recent 30 filtered history rows in the UI. They are lightweight MVP analytics, not validated mastery or risk-tolerance models. Level cards lead into difficulty-based practice; they are not separate fully authored lesson courses.

## 9. Question contracts and content extension

Read the exact interfaces in `shared/types.ts` and the runtime Zod schema in `server/content.ts`.

```ts
type Mode = 'daily' | 'unlimited';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Quant';
type ReactionType =
  | 'happy' | 'sad' | 'angry' | 'confused'
  | 'shocked' | 'celebration' | 'genius' | 'panic';

interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  format: 'prediction' | 'multiple-choice' | 'numerical'
    | 'probability' | 'portfolio' | 'chart' | 'strategy';
  options: { id: string; label: string; icon: string }[];
  concept: string;
  kind: 'historical' | 'model';
  date: string;
  ticker: string;
  source: { label: string; url: string };
  reward: { xp: number; coins: number };
}

interface ContentQuestion extends Question {
  correctAnswer: string;
  explanation: string;
  takeaway: string;
  chart?: { label: string; values: number[]; unit: string };
}
```

`Question` is the public payload. `ContentQuestion` is server-owned content. `publicQuestion()` strips `correctAnswer`, `explanation`, `takeaway`, and the outcome chart before sending a question to the browser. Preserve this separation. Do not import the server content bank into the frontend bundle.

Although the format union supports several concepts, the current UI renders **option-based answers for all formats**. Free numeric entry, interactive portfolio construction, specialized chart interpretation, and open-ended strategies are not implemented merely because their labels exist in a type.

The bank contains **20 seed questions**, including earnings expectations, Fed policy, percentage returns, bonds, expected value, diversification, market capitalization, drawdown recovery, FOMO, compounding, Sharpe ratio, correlation, Apple repurchases, GameStop, Lehman, position sizing, P/E, cash flow, real returns, and priced-in expectations. Historical contexts use primary-source links. Mathematical questions show their own calculations; broad further-reading links should not be mistaken for datasets proving those calculations.

Advanced and Quant each currently have one question. A large daily product needs more reviewed content and difficulty/category coverage.

To extend content:

1. Add a stable ID and valid content object in the server seed bank, or implement a deliberate reviewed database publication workflow.
2. Link appropriate sources and distinguish historical facts from modeled implications.
3. Ensure the correct answer matches an option ID and calculations are sound.
4. Use the Zod schema, test answer secrecy, and update tests affected by the new bank.
5. In database mode, migrate/seed as appropriate and restart the API; published content is loaded at startup, not hot-reloaded.
6. Preserve IDs referenced by existing daily manifests and attempts. Persisted IDs do not freeze the entire question body, so a future content-versioning design should also protect active questions against edits.

Current runtime scoring uses `reward()` in `server/game.ts`, not arbitrary `question.reward` values. The reward field is metadata, so changing it alone does not change the award calculation. Runtime level names likewise currently come from `shared/types.ts` even though the database contains level records.

## 10. Actual API and answer flow

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server health, storage mode, next UTC reset |
| POST | `/api/auth/register` | Register with name/email/password |
| POST | `/api/auth/login` | Start a registered account session |
| POST | `/api/auth/guest` | Create a guest and start a session |
| POST | `/api/auth/logout` | Delete the session and clear its cookie |
| GET | `/api/user/profile` | Computed profile and attempts |
| GET | `/api/user/progress` | Currently the same profile response |
| GET | `/api/user/stats` | Currently the same profile response |
| GET | `/api/questions/daily` | Day, resetAt, safe questions, completed attempts, tickets |
| GET | `/api/questions/unlimited?difficulty=Beginner` | Random safe question and ticket |
| GET | `/api/questions/:id` | Safe question without answer or round ticket |
| POST | `/api/questions/:id/answer` | Validate/evaluate a ticketed answer and return reveal |
| GET | `/api/levels` | Level definitions |
| GET | `/api/levels/:id` | Individual level definition |
| GET | `/api/market-events` | Historical seed event summaries/source links |
| GET | `/api/market-data/FEDFUNDS` | Up to 24 imported FRED observations or explicit empty/configuration state |
| GET | `/api/reactions/:type` | Local asset URL, caption, provider, license/attribution |

Health and auth are available before account authentication. The list `/api/levels` and `/api/reactions/*` bypass the account guard. The current guard requires authentication for `/api/levels/:id`, questions, profiles, market events, and market data. This detail follows actual code, not a proposed API design.

There are currently **no implemented case-study or leaderboard endpoints**, despite those examples in the original vision.

Example answer body:

```json
{ "optionId": "1", "ticket": "<opaque 48-character server-issued ticket>" }
```

The strict answer schema rejects client-provided reward/correctness fields. The ticket binds user, question, mode, issue time, and UTC day; it expires after two hours. Daily answers from an earlier UTC day are rejected. The server validates the selected option, checks duplicates and practice reward eligibility, persists the attempt/rewards, and returns:

```ts
{
  correct, correctAnswer, explanation, takeaway, concept, chart,
  xp, coins, reaction, profile, source
}
```

The frontend then requests the reaction category's asset/caption. A direct safe-question GET does not authorize scoring; acquire a ticket through a game-mode endpoint.

Tickets live in an in-memory Map. API restarts invalidate outstanding rounds but not stored progress. Multiple API instances require shared/persistent ticket state and distributed rate limits. A failed persistence operation can consume a ticket; fetch a fresh round after recovery. Do not describe the current system as a fully distributed, retry-idempotent production service.

## 11. Frontend structure and visual identity

The entrypoint is `src/main.tsx`. Its React state currently switches among `play`, `path`, `stats`, and `guide`, with separate daily/unlimited round state. There is no React Router or independent route-per-screen implementation yet.

The home/playground is also the MVP landing experience: a daily challenge card, trading-cat mascot, XP/level progress, mode cards, side quests, and brief playful guidance. It gets the user into the game quickly rather than presenting a long marketing page.

Other views include the eight-level learning path, actual player statistics/history, and How to play with disclaimer/art attribution. Authentication uses a modal with guest entry, form validation, focus handling, Escape dismissal, and loading/error feedback.

Preserve this visual language:

- Dark charcoal background (`#101211`), olive-tinted surfaces and borders.
- Lime primary actions (`#c4f279`), lavender XP, warm orange streaks.
- Manrope display typography and DM Sans body text, with fallback fonts.
- Confident typography, rounded cards, restrained accent use.
- Original sunglasses-wearing trading-cat SVG in `GameArt.tsx`.
- Temporary cat reaction toasts, CSS motion and confetti for correct answers.
- Desktop sidebar; mobile drawer and fixed bottom navigation.
- Clear keyboard focus and reduced-motion behavior.
- Explanations and illustrative outcome charts appear after submission.

Do not switch to generic blue banking UI, dense Bloomberg-style tables, excessive neon, or childish decoration. Keep the humor in captions/reactions while keeping learning and controls clear.

`src/lib/api.ts` calls same-origin `/api`, relies on cookies, and parses JSON. It currently assumes JSON responses; resilient handling of network failures or non-JSON proxy responses is a possible improvement. Profile endpoints currently return the complete attempt history, so pagination and server-side aggregate statistics will be needed as users accumulate attempts.

## 12. Cat reactions and licensing

The original request allowed GIFs **or animations**. The MVP deliberately uses openly licensed Twemoji cat SVGs with CSS animation, rather than arbitrary internet GIF footage.

Provider boundary: `server/reactions.ts`. Categories are the `ReactionType` union above. It returns a local `/reactions/<codepoint>.svg` URL, message, provider, and attribution/license metadata. There are eight categories backed by seven unique assets; confused and shocked share one asset. Current answer selection rotates between genius/celebration for correct answers and sad/confused for wrong ones. Not all defined categories are automatically used yet.

Source evaluated during the original build:

- Maintained repository: https://github.com/jdecked/twemoji
- Bundled release: 16.0.1.
- Graphics: CC BY 4.0; preserve `LICENSE-GRAPHICS.txt` and `ATTRIBUTION.md`.
- Code licensing and graphics licensing differ; do not treat the artwork as MIT-only.
- Assets are bundled locally, so reactions do not depend on a third-party CDN at runtime.
- The separate trading-cat mascot is original code-native art.

CATAAS was evaluated but not chosen because a public tagged image API alone did not establish clear per-image redistribution rights or reliability guarantees. Do not claim it powers the current app. Re-check current terms/maintenance if adding any new provider.

## 13. Financial sources and ingestion status

Separate market data, educational content, questions, game state, users, and reactions. Do not put provider keys or financial fact-generation logic in frontend components.

### Actually implemented connector

`server/ingest.ts` imports official FRED `FEDFUNDS` observations:

- Requires `DATABASE_URL` and `FRED_API_KEY`.
- Uses the official observations endpoint with a 15-second timeout.
- Requests up to 120 recent observations.
- Validates response structure, skips missing `.` values, rejects nonfinite numeric values.
- Upserts observations transactionally by provider/series/date, with fetch timestamps.
- Stores them in `historical_prices`; this generic table currently stores macro observations, not just equity candles.
- Does not automatically generate or publish questions.
- No periodic scheduler is installed. A daily scheduler/worker is future deployment work.
- The read endpoint exposes up to 24 stored observations; it does not fetch fresh data on each browser request.

This import was **not previously verified against a configured key and database**. Do not call the app a working live stock-data feed.

### Sources evaluated / linked

- Federal Reserve statements and FRED API: official macroeconomic material.
- SEC / Investor.gov: investor education, EDGAR/company-facts APIs, historical market reports.
- Apple investor/newsroom release: factual context for the 2024 repurchase question.
- Alpha Vantage: documented market-data API considered for a future price feed. Its environment key is reserved, but there is no implemented Alpha Vantage fetcher.
- Yahoo Finance scraping and unofficial endpoints were not implemented.

Useful primary references already used in the project:

```text
https://www.federalreserve.gov/newsevents/pressreleases/monetary20200315a.htm
https://www.federalreserve.gov/monetarypolicy/fomcminutes20080916.htm
https://www.apple.com/newsroom/2024/05/apple-reports-second-quarter-results/
https://www.sec.gov/newsroom/press-releases/2021-212
https://www.sec.gov/files/investor/pubs/assetallocation.htm
https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds
https://fred.stlouisfed.org/docs/api/fred/series_observations.html
https://www.sec.gov/search-filings/edgar-application-programming-interfaces
https://www.alphavantage.co/documentation/
```

Respect provider access policies, attribution, quotas, and redistribution rights. Reverify policies when adding integrations; the earlier evaluation is not a permanent licensing guarantee. Do not scrape sites that prohibit it.

## 14. Authentication and security currently present

- Email/password registration and login, plus guest sessions.
- Passwords stored as salted scrypt-derived hashes; comparison uses timingSafeEqual where applicable.
- Random session tokens are hashed before storage.
- `stonk_session` cookie: HttpOnly, SameSite=Strict, seven-day lifetime, Secure in production.
- Guests are real local/server accounts tied to their session, not a bypass of scoring.
- Global API limiter: 180 requests/minute; auth limiter: 20 requests/15 minutes.
- Helmet with configured image/style/font/script restrictions.
- JSON body-size limit of 16 KB.
- POST origin checking against `APP_ORIGIN` when Origin is supplied.
- Zod request/content validation and generic internal-error responses.
- User-bound tickets, server-controlled scoring and transaction/duplicate protection.
- Secrets excluded from frontend/public assets and `.env` ignored by Git.

Missing production account features include password recovery, email verification, guest-to-account conversion, and robust session/account lifecycle management. Rate limits and round tickets are process-local. Review proxy trust, HTTPS, cookie behavior, and deployment binding deliberately when preparing hosting.

## 15. Verification history and how to validate changes

During the original implementation, the following passed:

- Strict TypeScript checking and Vite production build.
- Six unit tests covering deterministic unique daily selection, UTC reset/date boundaries, answer secrecy, reward/replay policy, expected-return math, and streak completion/expiry.
- Live API integration checks covering register/login/logout, auth protection, account/ticket isolation, strict input validation, concurrent duplicate submissions, practice rewards/replays, daily completion, streaks, and persisted progress.
- Browser verification at desktop and mobile sizes: guest entry, correct/wrong predictions, reveals, locally served cat reactions, XP updates, statistics, and mobile navigation.

These results used the local demo adapter. **PostgreSQL execution and FRED ingestion were not verified.** On October 28 the source was inspected for this handoff; the earlier tests were not rerun just to generate documentation.

For future code changes, run relevant checks:

```powershell
pnpm test
pnpm build
# With the API running against an isolated intended test store:
pnpm test:api
```

The integration script assumes the Quant pool has one specific seeded question with correct option `1`. Changing the content bank can invalidate this test assumption; improve deterministic fixtures rather than freezing the product's content to satisfy the script.

For PostgreSQL work, actually apply the schema to a clean database and run integration tests against it. Compilation alone does not verify SQL, driver date handling, migrations, constraints, or transaction behavior. Check concurrent scoring, stored attempt/balance/ledger consistency, round expiry, UTC rollover, and content updates with existing manifests.

## 16. What is implemented versus future work

### Implemented MVP

- Game-native landing/playground and responsive dark design.
- Register/login/logout and guest entry.
- Daily ten-question challenge, server reset metadata and duplicate controls.
- Unlimited difficulty-filtered practice with reduced/replay-limited rewards.
- Server-owned question/answer/reveal flow.
- Twenty seeded scenarios and calculations, including sourced historical contexts.
- XP, coins, completion streaks, eight XP-based levels.
- Player stats and history with category/difficulty breakdowns.
- Cat reaction provider with locally bundled licensed art.
- PostgreSQL schema, typed core ORM tables, migration/seed runner and repository path.
- Official FRED import script and stored-data read endpoint.
- Local persistent demo adapter and meaningful core/API tests.

### Planned phase 2, not implemented functionality

- Interactive historical case studies with stage decisions and timelines.
- Virtual portfolio simulator, originally envisioned with ₹10,00,000 virtual capital and stocks/bonds/gold/cash/ETFs.
- Simulated shocks, drawdown, volatility, Sharpe and diversification analysis.
- Achievements/badges with actual awarding logic.
- Daily/weekly/monthly/global/friend leaderboards.
- Adaptive difficulty and targeted learning paths.
- Live event ingestion/editorial publication and grounded historical price charts.
- Additional game modes: historical/current events, speed rounds and risk challenges.

Reserved database tables or format names do not mean these features work yet.

For future case studies, preserve an interactive story structure: for example, housing stress → Lehman failure → funding/market panic → intervention. At each stage ask what the player would do, then explain what happened, what information was available, which risks were visible, and what could not reasonably have been predicted. Avoid hindsight-based claims that a crash or recovery was obvious.

For the future portfolio simulator, let players change allocations and run inflation, recession, rate-rise, crash, bull-market or geopolitical-shock scenarios. Label assumptions and simulated results. Show return, drawdown, volatility and diversification measures progressively; do not imply these are predictions for actual investments.

### Planned phase 3

- Grounded AI question/explanation/scenario generation.
- Reviewed publication pipeline: trusted structured data → generated draft → validation/editorial review → published content.
- Advanced mathematical models, Monte Carlo and portfolio optimization.
- Social features and multiplayer challenges.

Never publish blindly generated finance facts as truth. Future live-event questions should communicate probabilities and context rather than claim a certain stock move.

## 17. Sensible next engineering work

Follow the user's actual next task first. If asked to choose the next milestone, a sensible sequence is:

1. Configure PostgreSQL in a development environment and validate migration, seeding, auth, scoring and concurrency against it.
2. Add incremental migrations and explicit content versioning/publication; preserve active daily question definitions and audit source verification.
3. Expand/review historical and difficulty coverage with trustworthy data; separate event facts from model interpretations.
4. Refactor the large frontend entrypoint into feature components while preserving the current UI and game behavior.
5. Address guest conversion/account recovery and production session/ticket/rate-limit persistence.
6. Add a deployment-ready server build/start workflow, health/readiness behavior, structured logs, and verified hosting configuration when requested.
7. Configure/review FRED ingestion and scheduling; add a licensed equity-price connector if needed.
8. Build one requested phase-2 feature end to end rather than adding several nonfunctional menu entries.

Other known improvements worth assessing: paginate attempts, compute aggregates on the server, distinguish mastery from repeated-attempt accuracy, improve content/source metadata, strengthen operational retry/idempotency behavior, and add deterministic browser/integration fixtures.

## 18. How you should start hands-on work

1. Confirm access to the workspace or transferred repository. Read any applicable `AGENTS.md` or local instructions, then inspect `git status`, `README.md`, `package.json`, and this document.
2. Read the files for the requested task. Use `shared/types.ts` for contracts and `server/schema.sql` plus `db-schema.ts` for persistence changes.
3. Determine the active storage mode without revealing secrets. Do not confuse demo verification with PostgreSQL verification.
4. Start or reuse the two local processes and establish a baseline relevant to the task.
5. Implement the requested feature in the existing architecture, keeping scoring and financial facts on the server and the prediction loop fast.
6. Run appropriate tests/build and verify affected UI states on desktop/mobile when relevant.
7. Report what changed, what was verified, and remaining concrete limitations. Do not claim deployment, live data, PostgreSQL validation, or roadmap features without evidence.

Do not delete progress stores, reset the repository, replace the app wholesale, expose secrets, publish the app, or commit/push changes merely because this handoff exists. Perform those actions only within the user's authorized task scope.

**Next task from the user:**

> [Paste the specific feature, bug fix, review, or milestone here. If none is supplied, inspect the project and identify the smallest useful next milestone before expanding scope.]

