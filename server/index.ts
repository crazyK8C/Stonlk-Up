import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as rawScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { questions, publicQuestion, contentSchema } from './content.js';
import { dayKey, dailyQuestions, resetAt, profile, reward } from './game.js';
import {
  addSession,
  createUser,
  findUser,
  sessionUser,
  deleteSession,
  mutateUser,
  safeUser,
  dailyIds,
  pool,
  type User,
} from './store.js';
import { reaction } from './reactions.js';
import { generateMarket } from './market.js';
import { levels, type Mode, type Reveal, type ReactionType } from '../shared/types.js';
const scrypt = promisify(rawScrypt);
const production = process.env.NODE_ENV === 'production';
// Hosts like Render set RENDER_EXTERNAL_URL; APP_ORIGIN overrides it for custom domains.
const appOrigin =
  process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://127.0.0.1:5173';
const app = express();
// Render's chain (measured 2026-10-29): client -> Cloudflare -> Render proxy -> local sidecar.
// Trusting exactly those three hops makes req.ip the real client, and forged
// X-Forwarded-For entries (which sit further left) are ignored.
if (production) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 3));
if (production && !pool)
  throw new Error('PostgreSQL DATABASE_URL is required in production');
if (pool) {
  const stored = await pool.query('SELECT content FROM questions WHERE published=TRUE ORDER BY id');
  const published = stored.rows.map((row) => contentSchema.parse(row.content));
  if (published.length < 10) throw new Error('Run db:migrate and publish at least ten questions.');
  questions.splice(0, questions.length, ...published);
}
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.use(express.json({ limit: '16kb' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 60000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Take a short break and try again.' },
  }),
);
app.use('/api', (req, res, next) => {
  if (req.method === 'POST') {
    const origin = req.get('origin');
    if (origin && origin !== appOrigin)
      return res.status(403).json({ error: 'Request origin is not allowed' });
  }
  next();
});
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 20,
  message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
});
const hash = (v: string) => createHash('sha256').update(v).digest('hex');
// New players confirm they are 18+ (India's DPDP rules treat under-18s as children).
const adultConfirmation = z.literal(true, {
  error: 'Confirm you are 18 or older to play.',
});
function token(req: express.Request) {
  return (
    req.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('stonk_session='))
      ?.slice(14) ?? ''
  );
}
async function current(req: express.Request) {
  return token(req) ? sessionUser(hash(token(req))) : undefined;
}
async function session(res: express.Response, id: string) {
  const t = randomBytes(32).toString('hex');
  await addSession(hash(t), id);
  res.cookie('stonk_session', t, {
    httpOnly: true,
    sameSite: 'strict',
    secure: production,
    maxAge: 7 * 86400000,
    path: '/',
  });
}
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, storage: pool ? 'postgresql' : 'local-demo', resetAt: resetAt() }),
);
app.post('/api/auth/:action', authLimit, async (req, res) => {
  const action = String(req.params.action);
  if (action === 'logout') {
    await deleteSession(hash(token(req)));
    res.clearCookie('stonk_session');
    return res.json({ ok: true });
  }
  if (action === 'guest') {
    z.object({ adult: adultConfirmation }).parse(req.body);
    const id = randomUUID();
    const user: User = {
      id,
      name: 'Market Rookie',
      email: `${id}@guest.stonk.local`,
      password_hash: '',
      xp: 0,
      coins: 0,
      attempts: [],
      age_confirmed_at: new Date().toISOString(),
    };
    await createUser(user);
    await session(res, id);
    return res.json(profile(safeUser(user)));
  }
  if (!['login', 'register'].includes(action))
    return res.status(404).json({ error: 'Unknown action' });
  const data = z
    .object({
      email: z
        .string()
        .email('Enter a valid email address.')
        .max(254, 'That email address is too long.')
        .transform((x) => x.toLowerCase()),
      password: z
        .string()
        .min(10, 'Use at least 10 characters for your password.')
        .max(128, 'Use 128 characters or fewer for your password.'),
      name: z
        .string()
        .trim()
        .min(2, 'Use at least 2 characters for your name.')
        .max(32, 'Use 32 characters or fewer for your name.')
        .optional(),
      adult: action === 'register' ? adultConfirmation : z.unknown().optional(),
    })
    .parse(req.body);
  let user = await findUser(data.email);
  if (action === 'register') {
    if (user) return res.status(409).json({ error: 'This email is already registered.' });
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(data.password, salt, 64)) as Buffer;
    user = {
      id: randomUUID(),
      name: data.name ?? 'Market Rookie',
      email: data.email,
      password_hash: salt + ':' + derived.toString('hex'),
      xp: 0,
      coins: 0,
      attempts: [],
      age_confirmed_at: new Date().toISOString(),
    };
    await createUser(user);
  } else {
    const [salt, key] = (user?.password_hash ?? 'dummy:00').split(':');
    const derived = (await scrypt(data.password, salt, 64)) as Buffer;
    const stored = Buffer.from(key, 'hex');
    if (!user || stored.length !== derived.length || !timingSafeEqual(stored, derived))
      return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  await session(res, user.id);
  res.json(profile(safeUser(user)));
});
app.use('/api', async (req, res, next) => {
  if (req.path === '/levels' || req.path.startsWith('/reactions/') || req.path.startsWith('/lab/'))
    return next();
  const user = await current(req);
  if (!user) return res.status(401).json({ error: 'Sign in to save your progress.' });
  res.locals.user = user;
  next();
});
app.get(['/api/user/profile', '/api/user/progress', '/api/user/stats'], (_req, res) =>
  res.json(profile(safeUser(res.locals.user))),
);
const tickets = new Map<
  string,
  { userId: string; questionId: string; mode: Mode; day: string; issued: number }
>();
function issue(user: User, questionId: string, mode: Mode) {
  const t = randomBytes(24).toString('hex');
  const now = Date.now();
  for (const [key, value] of tickets) if (value.issued < now - 2 * 3600000) tickets.delete(key);
  tickets.set(t, { userId: user.id, questionId, mode, day: dayKey(), issued: now });
  return t;
}
app.get('/api/questions/daily', async (_req, res) => {
  const user: User = res.locals.user;
  const ids = await dailyIds(
    dayKey(),
    dailyQuestions().map((q) => q.id),
  );
  const qs = ids.map((id) => questions.find((q) => q.id === id)!);
  if (qs.some((q) => !q))
    throw new Error('Daily content is unavailable; preserve previously published questions.');
  res.json({
    day: dayKey(),
    resetAt: resetAt(),
    questions: qs.map(publicQuestion),
    completed: user.attempts.filter((a) => a.mode === 'daily' && a.day === dayKey()),
    tickets: Object.fromEntries(qs.map((q) => [q.id, issue(user, q.id, 'daily')])),
  });
});
app.get('/api/questions/unlimited', (req, res) => {
  const { difficulty, category } = req.query;
  const filtered = questions.filter(
    (q) =>
      (!difficulty || q.difficulty === difficulty) && (!category || q.category === category),
  );
  if (!filtered.length)
    return res.status(400).json({ error: 'No practice questions match that filter yet.' });
  const q = filtered[Math.floor(Math.random() * filtered.length)];
  res.json({ question: publicQuestion(q), ticket: issue(res.locals.user, q.id, 'unlimited') });
});
app.get('/api/questions/:id', (req, res) => {
  const q = questions.find((q) => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json(publicQuestion(q));
});
app.post('/api/questions/:id/answer', async (req, res) => {
  const data = z
    .object({
      optionId: z.string().max(20),
      ticket: z.string().length(48),
      confidence: z.number().int().min(0).max(100).optional(),
    })
    .strict()
    .parse(req.body);
  const t = tickets.get(data.ticket);
  const q = questions.find((q) => q.id === req.params.id);
  if (
    !t ||
    !q ||
    t.userId !== res.locals.user.id ||
    t.questionId !== q.id ||
    Date.now() - t.issued > 2 * 3600000
  )
    return res.status(400).json({ error: 'This round expired. Start a new round.' });
  if (t.mode === 'daily' && t.day !== dayKey())
    return res.status(409).json({ error: 'A new daily challenge has started. Refresh to play.' });
  if (!q.options.some((o) => o.id === data.optionId))
    return res.status(400).json({ error: 'Invalid answer' });
  const result = await mutateUser(t.userId, (u) => {
    const previous = u.attempts.find(
      (a) => a.mode === 'daily' && a.day === t.day && a.questionId === q.id,
    );
    if (t.mode === 'daily' && previous)
      throw Object.assign(new Error('This question is already completed.'), { status: 409 });
    if (!tickets.has(data.ticket))
      throw Object.assign(new Error('Answer already submitted.'), { status: 409 });
    tickets.delete(data.ticket);
    const correct = data.optionId === q.correctAnswer;
    const earned = reward(
      correct,
      t.mode,
      t.mode === 'unlimited' && u.attempts.some((a) => a.questionId === q.id && a.xp > 0),
    );
    u.attempts.push({
      questionId: q.id,
      optionId: data.optionId,
      correct,
      ...earned,
      mode: t.mode,
      day: t.day,
      at: new Date().toISOString(),
      duration: Math.round((Date.now() - t.issued) / 1000),
      category: q.category,
      difficulty: q.difficulty,
      ...(data.confidence === undefined ? {} : { confidence: data.confidence }),
    });
    u.xp += earned.xp;
    u.coins += earned.coins;
    const result: Reveal = {
      correct,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      takeaway: q.takeaway,
      concept: q.concept,
      chart: q.chart,
      ...earned,
      reaction: correct
        ? u.attempts.length % 2
          ? 'genius'
          : 'celebration'
        : u.attempts.length % 2
          ? 'sad'
          : 'confused',
      profile: profile(safeUser(u)),
      source: q.source,
    };
    return result;
  });
  tickets.delete(data.ticket);
  res.json(result);
});
// Public: synthetic practice markets (models, never real prices).
app.get('/api/lab/market', (req, res) => {
  const { preset, seed } = z
    .object({
      preset: z.enum(['calm', 'choppy', 'crash']),
      seed: z.coerce.number().int().min(1).max(2147483647),
    })
    .parse(req.query);
  res.json(generateMarket(preset, seed));
});
app.get('/api/levels', (_req, res) =>
  res.json(levels.map((name, i) => ({ id: i + 1, name, xpRequired: i * 1000 }))),
);
app.get('/api/levels/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!levels[id - 1]) return res.status(404).json({ error: 'Level not found' });
  res.json({ id, name: levels[id - 1], xpRequired: (id - 1) * 1000 });
});
app.get('/api/market-events', (_req, res) =>
  res.json(
    questions
      .filter((q) => q.kind === 'historical')
      .map((q) => ({ id: q.id, title: q.title, date: q.date, source: q.source })),
  ),
);
app.get('/api/reactions/:type', (req, res) => {
  const type = z
    .enum(['happy', 'sad', 'angry', 'confused', 'shocked', 'celebration', 'genius', 'panic'])
    .parse(req.params.type);
  res.json(reaction(type as ReactionType));
});
app.get('/api/market-data/FEDFUNDS', async (_req, res) => {
  if (!pool)
    return res.json({
      provider: 'FRED',
      series: 'FEDFUNDS',
      observations: [],
      status: 'not-configured',
    });
  const result = await pool.query(
    'SELECT date,value,fetched_at FROM historical_prices WHERE provider=$1 AND series=$2 ORDER BY date DESC LIMIT 24',
    ['FRED', 'FEDFUNDS'],
  );
  res.json({
    provider: 'FRED',
    series: 'FEDFUNDS',
    observations: result.rows,
    status: result.rows.length ? 'available' : 'not-synced',
    source: 'https://fred.stlouisfed.org/series/FEDFUNDS',
  });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
app.use(express.static('dist'));
app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: 'dist' }));
app.use(
  (
    error: Error & { status?: number; code?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.issues[0].message });
    if (error.code === '23505')
      return res.status(409).json({ error: 'This record already exists.' });
    if (!error.status) console.error(error);
    res
      .status(error.status ?? 500)
      .json({ error: error.status ? error.message : 'Something went wrong. Please try again.' });
  },
);
// Containers must listen on all interfaces; local development stays on loopback.
const host = process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
const port = Number(process.env.PORT ?? 3001);
app.listen(port, host, () =>
  console.log(
    `Stonk Up API running at http://${host}:${port} (${pool ? 'PostgreSQL' : 'local demo storage'})`,
  ),
);
