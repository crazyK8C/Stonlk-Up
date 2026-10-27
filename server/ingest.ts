import 'dotenv/config';
import { z } from 'zod';
import { pool } from './store.js';
// Server-only ingestion; fetched observations never become questions automatically.
if (!pool) throw new Error('DATABASE_URL is required to store normalized market data.');
if (!process.env.FRED_API_KEY)
  throw new Error('Set FRED_API_KEY to import official macroeconomic observations.');
const url = new URL('https://api.stlouisfed.org/fred/series/observations');
url.search = new URLSearchParams({
  series_id: 'FEDFUNDS',
  api_key: process.env.FRED_API_KEY,
  file_type: 'json',
  sort_order: 'desc',
  limit: '120',
}).toString();
const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`FRED returned HTTP ${response.status}`);
const payload = z
  .object({
    observations: z.array(
      z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), value: z.string() }),
    ),
  })
  .parse(await response.json());
const client = await pool.connect();
try {
  await client.query('BEGIN');
  let count = 0;
  for (const row of payload.observations) {
    if (row.value === '.') continue;
    const value = Number(row.value);
    if (!Number.isFinite(value)) throw new Error('Invalid observation');
    await client.query(
      'INSERT INTO historical_prices(provider,series,date,value) VALUES($1,$2,$3,$4) ON CONFLICT(provider,series,date) DO UPDATE SET value=$4,fetched_at=NOW()',
      ['FRED', 'FEDFUNDS', row.date, value],
    );
    count++;
  }
  await client.query('COMMIT');
  console.log(`${count} FEDFUNDS observations imported. Educational publication requires review.`);
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
