# Deploying Stonk Up

Stonk Up runs as **one web service**: Express serves the API and the built React app from `dist/`. Production needs PostgreSQL; the local JSON demo store is refused when `NODE_ENV=production`.

Recommended free setup:

| Piece | Service | Why |
| --- | --- | --- |
| Web app + API | [Render](https://render.com) free web service | Deploys from GitHub on every push, HTTPS included |
| Database | [Neon](https://neon.tech) free PostgreSQL | Free tier doesn't expire (Render's free database is deleted after 30 days) |

## 1. Create the database (Neon)

1. Sign up at neon.tech and create a project (pick the region closest to your users, e.g. Singapore for India).
2. Copy the **connection string** from the dashboard. It looks like
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`.
3. Keep it private. It goes into Render only, never into the repo.

## 2. Create the web service (Render)

1. Sign up at render.com with GitHub and allow access to this repository.
2. Choose **New → Blueprint** and select the repository. Render reads [`render.yaml`](../render.yaml).
3. When asked for `DATABASE_URL`, paste the Neon connection string.
4. Deploy. The build installs dependencies, builds the frontend and runs `db:migrate`, which creates the tables and seeds the questions.
5. Open `https://<service-name>.onrender.com/api/health`. It should say `"storage":"postgresql"`.

Every push to `main` redeploys automatically.

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Set by the start command | `production` turns on secure cookies, proxy trust and `0.0.0.0` binding |
| `APP_ORIGIN` | No | Defaults to Render's `RENDER_EXTERNAL_URL`. Set it if you add a custom domain. |
| `TRUST_PROXY_HOPS` | No | Proxies between the visitor and the app, used to find the real client IP for rate limits. Defaults to 3 (Cloudflare, Render's proxy, Render's sidecar, measured October 2026). Change only if Render's routing changes. |
| `HOST`, `PORT` | No | Render provides `PORT`. `HOST` defaults to `0.0.0.0` in production. |
| `FRED_API_KEY` | No | Only for `pnpm data:sync` |

## Known limits on the free plan

- The service sleeps after about 15 minutes without traffic. The first visit after that takes up to a minute.
- Round tickets live in memory, so a restart or sleep cancels any question someone is mid-way through. Stored progress is safe.
- `db:migrate` runs on every deploy and re-applies the seed questions from `server/content.ts`, overwriting any question edited directly in the database.
- Rate limits are per instance. That's fine for one instance.

## Before inviting the public

- Add an 18+ age gate (India's DPDP rules; see [research/05-regulation-and-data.md](research/05-regulation-and-data.md)).
- Add a privacy notice covering what's stored: email, password hash, answers and timings.
