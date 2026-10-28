import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './db-schema.js';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type { Attempt } from '../shared/types.js';
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  xp: number;
  coins: number;
  attempts: Attempt[];
  age_confirmed_at?: string;
}
interface State {
  users: User[];
  sessions: { hash: string; userId: string; expires: number }[];
  challenges: Record<string, string[]>;
}
export const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool ? drizzle(pool, { schema }) : null;
let state: State = { users: [], sessions: [], challenges: {} };
if (!pool) {
  await mkdir('.local', { recursive: true });
  try {
    state = JSON.parse(await readFile('.local/demo.json', 'utf8'));
    state.challenges ??= {};
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
}
async function persist() {
  if (!pool) {
    await writeFile('.local/demo.tmp', JSON.stringify(state));
    // OneDrive/Windows scanners can briefly hold the destination open.
    // Preserve the old file and retry the atomic replacement instead of deleting it.
    for (let retry = 0; ; retry++) {
      try {
        await rename('.local/demo.tmp', '.local/demo.json');
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (retry >= 9 || !['EPERM', 'EBUSY', 'EACCES'].includes(code ?? '')) throw error;
        await delay(50 * (retry + 1));
      }
    }
  }
}
let queue = Promise.resolve();
async function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const prior = queue;
  let release!: () => void;
  queue = new Promise<void>((r) => {
    release = r;
  });
  await prior;
  const snapshot = structuredClone(state);
  try {
    return await fn();
  } catch (error) {
    state = snapshot;
    throw error;
  } finally {
    release();
  }
}
function attempt(row: Record<string, unknown>): Attempt {
  return {
    questionId: String(row.question_id),
    optionId: String(row.option_id),
    correct: Boolean(row.correct),
    xp: Number(row.xp),
    coins: Number(row.coins),
    mode: row.mode as Attempt['mode'],
    day: (row.day as Date).toISOString().slice(0, 10),
    at: (row.at as Date).toISOString(),
    duration: Number(row.duration),
    category: String(row.category),
    difficulty: row.difficulty as Attempt['difficulty'],
  };
}
export async function findUser(email: string): Promise<User | undefined> {
  if (!pool) return state.users.find((u) => u.email === email);
  const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!r.rows[0]) return undefined;
  const a = await pool.query('SELECT * FROM attempts WHERE user_id=$1 ORDER BY at', [r.rows[0].id]);
  return { ...r.rows[0], attempts: a.rows.map(attempt) };
}
export async function createUser(user: User) {
  if (pool)
    await pool.query(
      'INSERT INTO users(id,name,email,password_hash,age_confirmed_at) VALUES($1,$2,$3,$4,$5)',
      [user.id, user.name, user.email, user.password_hash, user.age_confirmed_at ?? null],
    );
  else
    await exclusive(async () => {
      if (state.users.some((u) => u.email === user.email))
        throw new Error('Email already registered');
      state.users.push(user);
      await persist();
    });
}
export async function addSession(hash: string, userId: string) {
  const expires = Date.now() + 7 * 86400000;
  if (pool)
    await pool.query('INSERT INTO sessions VALUES($1,$2,$3)', [hash, userId, new Date(expires)]);
  else
    await exclusive(async () => {
      state.sessions = state.sessions.filter((s) => s.expires > Date.now());
      state.sessions.push({ hash, userId, expires });
      await persist();
    });
}
export async function sessionUser(hash: string): Promise<User | undefined> {
  if (!pool) {
    const session = state.sessions.find((s) => s.hash === hash && s.expires > Date.now());
    return session ? structuredClone(state.users.find((u) => u.id === session.userId)) : undefined;
  }
  const r = await pool.query(
    'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>NOW()',
    [hash],
  );
  if (!r.rows[0]) return;
  const a = await pool.query('SELECT * FROM attempts WHERE user_id=$1 ORDER BY at', [r.rows[0].id]);
  return { ...r.rows[0], attempts: a.rows.map(attempt) };
}
export async function deleteSession(hash: string) {
  if (pool) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hash]);
  else
    await exclusive(async () => {
      state.sessions = state.sessions.filter((s) => s.hash !== hash);
      await persist();
    });
}
export async function mutateUser<T>(id: string, fn: (u: User) => T): Promise<T> {
  if (!pool)
    return exclusive(async () => {
      const u = structuredClone(state.users.find((u) => u.id === id));
      if (!u) throw new Error('Unknown user');
      const result = fn(u);
      state.users[state.users.findIndex((x) => x.id === id)] = u;
      await persist();
      return result;
    });
  return db!.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .for('update');
    if (!record) throw new Error('Unknown user');
    const records = await tx
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.user_id, id))
      .orderBy(schema.attempts.at);
    const u: User = { ...record, attempts: records.map(attempt) };
    const oldLength = u.attempts.length;
    const result = fn(u);
    for (const x of u.attempts.slice(oldLength)) {
      const [inserted] = await tx
        .insert(schema.attempts)
        .values({
          user_id: id,
          question_id: x.questionId,
          option_id: x.optionId,
          correct: x.correct,
          xp: x.xp,
          coins: x.coins,
          mode: x.mode,
          day: new Date(x.day + 'T00:00:00Z'),
          at: new Date(x.at),
          duration: x.duration,
          category: x.category,
          difficulty: x.difficulty ?? 'Beginner',
        })
        .returning({ id: schema.attempts.id });
      await tx
        .insert(schema.xpTransactions)
        .values({ attempt_id: inserted.id, user_id: id, amount: x.xp });
    }
    await tx.update(schema.users).set({ xp: u.xp, coins: u.coins }).where(eq(schema.users.id, id));
    return result;
  });
}
export function safeUser(user: User) {
  const { password_hash, ...safe } = user;
  return safe;
}
export async function dailyIds(day: string, proposed: string[]): Promise<string[]> {
  if (pool) {
    await pool.query(
      'INSERT INTO daily_challenges(day,question_ids) VALUES($1,$2) ON CONFLICT(day) DO NOTHING',
      [day, JSON.stringify(proposed)],
    );
    const r = await pool.query('SELECT question_ids FROM daily_challenges WHERE day=$1', [day]);
    return r.rows[0].question_ids;
  }
  return exclusive(async () => {
    if (!state.challenges[day]) {
      state.challenges[day] = proposed;
      await persist();
    }
    return state.challenges[day];
  });
}
