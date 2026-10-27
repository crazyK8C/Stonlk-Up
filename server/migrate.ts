import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './store.js';
import { questions } from './content.js';
import { levels } from '../shared/types.js';
if (!pool) throw new Error('Set DATABASE_URL to run migrations.');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  for (const [i, name] of levels.entries())
    await client.query(
      'INSERT INTO levels VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET name=$2,xp_required=$3',
      [i + 1, name, i * 1000],
    );
  for (const q of questions) {
    await client.query('INSERT INTO concepts VALUES($1,$2) ON CONFLICT DO NOTHING', [
      q.concept,
      q.concept,
    ]);
    if (q.kind === 'historical')
      await client.query(
        'INSERT INTO market_events VALUES($1,$2,$3,$4,TRUE) ON CONFLICT DO NOTHING',
        [
          q.id,
          q.title,
          q.id === 'fed-2020'
            ? '2020-03-15'
            : q.id === 'apple-buyback'
              ? '2024-05-02'
              : q.id === 'gamestop'
                ? null
                : '2008-09-15',
          q.source.url,
        ],
      );
    await client.query(
      'INSERT INTO questions(id,content,concept_id,event_id) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET content=$2',
      [q.id, JSON.stringify(q), q.concept, q.kind === 'historical' ? q.id : null],
    );
  }
  await client.query('COMMIT');
  console.log('Migration 1 applied; curriculum and questions seeded.');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
