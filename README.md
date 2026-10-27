# Stonk Up 📈🐱

A playable finance learning MVP: predict → lock → cat reaction → explain → earn XP.

## Run locally

Use Node 22+ and pnpm. Run `pnpm install`, then `pnpm dev` and `pnpm dev:web` in separate terminals. Open http://127.0.0.1:5173. The API runs on port 3001. `pnpm build` validates strict TypeScript and creates a production frontend; the API serves `dist` too.

Without `DATABASE_URL`, progress is saved by the server to `.local/demo.json`. This is an explicitly labeled single-process demo, not a production database. Guest progress is attached to an HttpOnly seven-day session cookie. Registered accounts use salted scrypt passwords. Guest accounts cannot be recovered after losing their cookie. No demo performance statistics are fabricated.

### PostgreSQL

1. Start a PostgreSQL instance, or run `docker compose up -d db` if Docker is available.
2. Copy `.env.example` to `.env` and set `DATABASE_URL=postgresql://stonk:local-development-only@127.0.0.1:5432/stonk_up` for the local container.
3. Run `pnpm db:migrate` to apply the initial idempotent schema and seed curriculum/content.
4. Restart the API. Production refuses to start without PostgreSQL. Set `APP_ORIGIN` to the exact browser origin and deploy behind HTTPS so secure cookies work.

This environment has no PostgreSQL or Docker binary. The database implementation and migrations are supplied, but PostgreSQL execution needs a database connection.

## Product decisions

- Open on the game-native playground; no marketing wall before the first prediction. The playground is also the MVP landing experience.
- Historical questions use primary sources. Simplified models are labeled. Charts are revealed after answering and explicitly marked illustrative; no invented percentage is sold as a historical fact.
- Daily: ten deterministic questions, resets at 00:00 UTC for everyone. Full completion builds a streak. Correct daily answer: 100 XP + 15 coins; incorrect: 15 participation XP. No additional side-quest rewards.
- Unlimited: four difficulties, random selections; 20 XP + 3 coins for a first correct answer. Any question previously rewarded earns no practice rewards. Daily rewards remain available once per question per daily cycle.
- XP-based levels (1,000 XP per level), accuracy, category mastery, response times, and attempt history come from server records.
- A twenty-question MVP bank will repeat. Expand the bank before launching a long-lived daily game; advanced practice currently has one advanced and one quant scenario.

## Architecture

`src/` holds the React/TypeScript experience and responsive design system. `shared/types.ts` is the public contract. `server/content.ts` owns educational content and sourcing; `publicQuestion` strips all answers and explanations. `server/game.ts` owns deterministic challenge selection, reset, reward and streak logic. `server/store.ts` provides PostgreSQL and an explicit local demo adapter. `server/reactions.ts` isolates the art provider. `server/ingest.ts` fetches and validates FRED observations into normalized storage, independently of publication. `server/schema.sql` is migration 1; `server/migrate.ts` applies it and seeds questions.

The PostgreSQL schema separates users, sessions, questions, concepts, levels, market events, prices, attempts and XP ledger. Case studies and achievements have reserved schema for phase 2. Drizzle ORM handles scoring transactions through typed tables in server/db-schema.ts; session and ingestion operations use parameterized PostgreSQL queries. Published questions are validated and loaded from PostgreSQL at startup. Daily manifests persist their question sets across content updates.

Scoring takes a user-row lock inside a PostgreSQL transaction. A unique partial index independently blocks duplicate daily submissions. Opaque round tickets bind user, mode, question, issued time and UTC date. Tickets expire in two hours; API restart requires fetching new rounds. Submitted XP and correctness are rejected by strict input validation. Session tokens are hashed at rest. Rate limits cover auth and game APIs; write endpoints enforce the configured origin. Demo mutations use a serialized queue and atomic file replacement.

### API

| Endpoint                                                 | Purpose                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `POST /api/auth/register`, `/login`, `/guest`, `/logout` | Account/session lifecycle                                        |
| `GET /api/questions/daily`                               | Safe ten-question set, completed attempts, tickets, server reset |
| `GET /api/questions/unlimited?difficulty=Beginner`       | Random safe question with a round ticket                         |
| `GET /api/questions/:id`                                 | Question without answer                                          |
| `POST /api/questions/:id/answer`                         | `{optionId,ticket}` → evaluated answer, source, rewards, profile |
| `GET /api/user/profile`, `/progress`, `/stats`           | Authenticated player's progress and attempts                     |
| `GET /api/levels`, `/levels/:id`                         | Curriculum progression                                           |
| `GET /api/market-events`                                 | Seeded verified historical event                                 |
| `GET /api/reactions/:type`                               | Replaceable category-to-art mapping and attribution              |

## Design system

Charcoal surfaces, muted olive borders, lime actions, lavender XP, warm orange streaks. Manrope display typography with DM Sans body text (system fallbacks if fonts cannot load). Desktop sidebar becomes a mobile drawer. Cards lead into focused game rounds; explanations and model charts appear only after answering. Buttons, loading/error/empty states, keyboard focus and reduced-motion behavior are included.

## Source evaluation

- **Federal Reserve / FRED:** official policy statements and documented observation API, reliable macroeconomic context. API key stays on server. Individual series may have separate data rights; check redistribution terms before publishing imports. `pnpm data:sync` imports FEDFUNDS when PostgreSQL and FRED_API_KEY are configured. Run through a daily scheduler in deployment; no unattended scheduler is installed locally.
- **SEC / Investor.gov:** primary investor education and official EDGAR/company-facts APIs. Follow SEC access policy and identify a responsible contact before enabling an EDGAR fetcher.
- **Alpha Vantage:** documented historical price API; quotas and licensed data access vary by plan. Reserved environment key, no false claim of an enabled price feed. No scraped Yahoo endpoints.
- **Twemoji maintained fork:** https://github.com/jdecked/twemoji, maintained releases, MIT code and **CC BY 4.0 graphics**. Vetted 16.0.1 assets and their graphics license are bundled in public/reactions, eight categories, animation is local CSS. Credits are visible in How to play. This is openly licensed animated artwork rather than third-party GIF footage. Runtime reactions do not depend on a third-party CDN.
- **CATAAS:** public tagged cat API exists, but the documentation examined did not establish a clear per-image redistribution license or reliability commitment. It was not selected over explicit-license artwork. No random meme footage is embedded.

Primary references: https://www.federalreserve.gov/newsevents/pressreleases/monetary20200315a.htm, https://www.sec.gov/files/investor/pubs/assetallocation.htm, https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds, https://fred.stlouisfed.org/docs/api/fred/series_observations.html, https://www.sec.gov/search-filings/edgar-application-programming-interfaces, https://www.alphavantage.co/documentation/.

## Validation and next phases

`pnpm test` tests deterministic challenge selection, date boundaries, answer secrecy, reward farming, expected value and streaks. `pnpm test:api` runs live API integration checks against a running API, including account isolation, input validation and concurrent duplicate submissions.

Phase 2: interactive case studies, portfolios, real leaderboards, achievement awarding, and adaptive practice. Phase 3: reviewed AI content grounded in persisted sources, advanced quant models and multiplayer. These are not presented as working features in the MVP.

Before public release: configure PostgreSQL and HTTPS, test the PostgreSQL integration suite, add password recovery/email verification and guest-to-account conversion, use persistent round tickets/distributed rate limiting for multiple API instances, install an ingestion scheduler and editorial review pipeline, expand and review the content bank. This MVP has real server-controlled learning gameplay, not real-money trading.

Verified locally: strict TypeScript and Vite production build, six scoring/date/calculation unit tests, live authentication and scoring integration checks, desktop and mobile guest gameplay, answer reveal, local cat assets, and statistics. PostgreSQL execution and FRED fetching remain unverified without a database service and API key. The local demo adapter retries brief Windows/OneDrive file locks and rolls back in-memory changes if persistence fails.
