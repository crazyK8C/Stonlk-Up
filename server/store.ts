import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './db-schema.js';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type {
  Attempt,
  EventAction,
  EventMix,
  EventPlan,
  EventSubject,
  RunSummary,
} from '../shared/types.js';
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
export interface EventRunRecord {
  id: string;
  userId: string;
  eventId: string;
  subject: EventSubject;
  mix: EventMix | null;
  plan: EventPlan;
  seed: number;
  blind: boolean;
  day: number;
  decisions: { day: number; action: EventAction }[];
  reflection: string;
  summary: RunSummary | null;
  createdAt: string;
  completedAt: string | null;
}
interface State {
  users: User[];
  sessions: { hash: string; userId: string; expires: number }[];
  challenges: Record<string, string[]>;
  runs: EventRunRecord[];
}
export const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool ? drizzle(pool, { schema }) : null;
let state: State = { users: [], sessions: [], challenges: {}, runs: [] };
if (!pool) {
  await mkdir('.local', { recursive: true });
  try {
    state = JSON.parse(await readFile('.local/demo.json', 'utf8'));
    state.challenges ??= {};
    state.runs ??= [];
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
    ...(row.confidence == null ? {} : { confidence: Number(row.confidence) }),
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
          confidence: x.confidence ?? null,
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
function runFromRow(row: Record<string, unknown>): EventRunRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    eventId: String(row.event_id),
    subject: row.subject as EventSubject,
    mix: (row.mix as EventMix | null) ?? null,
    plan: row.plan as EventPlan,
    seed: Number(row.seed),
    blind: Boolean(row.blind),
    day: Number(row.day),
    decisions: row.decisions as EventRunRecord['decisions'],
    reflection: String(row.reflection ?? ''),
    summary: (row.summary as RunSummary | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
  };
}
export async function createRun(run: EventRunRecord) {
  if (pool)
    await pool.query(
      'INSERT INTO event_runs(id,user_id,event_id,subject,mix,plan,seed,blind) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        run.id,
        run.userId,
        run.eventId,
        run.subject,
        run.mix ? JSON.stringify(run.mix) : null,
        JSON.stringify(run.plan),
        run.seed,
        run.blind,
      ],
    );
  else
    await exclusive(async () => {
      state.runs.push(run);
      await persist();
    });
}
export async function getRun(id: string, userId: string): Promise<EventRunRecord | undefined> {
  if (!pool) return structuredClone(state.runs.find((r) => r.id === id && r.userId === userId));
  const r = await pool.query('SELECT * FROM event_runs WHERE id=$1 AND user_id=$2', [id, userId]);
  return r.rows[0] ? runFromRow(r.rows[0]) : undefined;
}
/** Saves progress only if nobody advanced the run since it was read (no double moves). */
export async function advanceRun(run: EventRunRecord, expectedDay: number): Promise<boolean> {
  if (pool) {
    const r = await pool.query(
      'UPDATE event_runs SET day=$3, decisions=$4, summary=$5, completed_at=$6 WHERE id=$1 AND user_id=$2 AND day=$7',
      [
        run.id,
        run.userId,
        run.day,
        JSON.stringify(run.decisions),
        run.summary ? JSON.stringify(run.summary) : null,
        run.completedAt,
        expectedDay,
      ],
    );
    return r.rowCount === 1;
  }
  return exclusive(async () => {
    const i = state.runs.findIndex((r) => r.id === run.id && r.userId === run.userId);
    if (i < 0 || state.runs[i].day !== expectedDay) return false;
    state.runs[i] = run;
    await persist();
    return true;
  });
}
export async function saveReflection(id: string, userId: string, text: string) {
  if (pool) {
    const r = await pool.query(
      'UPDATE event_runs SET reflection=$3 WHERE id=$1 AND user_id=$2 AND completed_at IS NOT NULL',
      [id, userId, text],
    );
    return r.rowCount === 1;
  }
  return exclusive(async () => {
    const run = state.runs.find((r) => r.id === id && r.userId === userId && r.completedAt);
    if (!run) return false;
    run.reflection = text;
    await persist();
    return true;
  });
}
export async function listRuns(userId: string): Promise<EventRunRecord[]> {
  if (!pool)
    return structuredClone(
      state.runs
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  const r = await pool.query(
    'SELECT * FROM event_runs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
    [userId],
  );
  return r.rows.map(runFromRow);
}
