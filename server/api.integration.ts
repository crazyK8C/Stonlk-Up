import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = process.env.TEST_API_URL ?? 'http://127.0.0.1:3001';
async function request(path: string, body?: unknown, cookie = '') {
  const r = await fetch(base + '/api' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '',
  };
}
const email = `integration-${randomUUID()}@example.test`;
const password = 'integration-only-password-42';
assert.equal(
  (await request('/auth/register', { email, password, name: 'Integration test' })).status,
  400,
);
assert.equal((await request('/auth/guest', {})).status, 400);
const created = await request('/auth/register', {
  email,
  password,
  name: 'Integration test',
  adult: true,
});
assert.equal(created.status, 200);
assert.ok(created.cookie.includes('stonk_session='));
assert.ok(!('password_hash' in created.data));
assert.equal((await request('/user/profile')).status, 401);
const cookie = created.cookie;
const d = await request('/questions/daily', undefined, cookie);
assert.equal(d.status, 200);
assert.equal(d.data.questions.length, 10);
assert.ok(!('correctAnswer' in d.data.questions[0]));
const q = d.data.questions[0],
  ticket = d.data.tickets[q.id];
assert.equal(
  (await request('/questions/' + q.id + '/answer', { ticket, optionId: 'bad' }, cookie)).status,
  400,
);
assert.equal(
  (await request('/questions/' + q.id + '/answer', { ticket, optionId: '0', xp: 900000 }, cookie))
    .status,
  400,
);
const other = await request('/auth/guest', { adult: true });
assert.equal(
  (await request('/questions/' + q.id + '/answer', { ticket, optionId: '0' }, other.cookie)).status,
  400,
);
const raced = await Promise.all([
  request('/questions/' + q.id + '/answer', { ticket, optionId: '0' }, cookie),
  request('/questions/' + q.id + '/answer', { ticket, optionId: '0' }, cookie),
]);
assert.equal(raced.filter((r) => r.status === 200).length, 1);
assert.equal(raced.filter((r) => r.status !== 200).length, 1);
const result = raced.find((r) => r.status === 200)!;
assert.ok([100, 15].includes(result.data.xp));
assert.ok(result.data.explanation);
assert.ok(result.data.source.url);
const p = await request('/user/profile', undefined, cookie);
assert.equal(p.data.attempts.length, 1);
assert.equal(p.data.xp, result.data.xp);
const d2 = await request('/questions/daily', undefined, cookie);
assert.equal(
  (
    await request(
      '/questions/' + q.id + '/answer',
      { ticket: d2.data.tickets[q.id], optionId: '0' },
      cookie,
    )
  ).status,
  409,
);
// Quant practice has one seeded question, allowing deterministic replay testing.
const round = await request('/questions/unlimited?difficulty=Quant', undefined, other.cookie);
const first = await request(
  '/questions/' + round.data.question.id + '/answer',
  { ticket: round.data.ticket, optionId: '1' },
  other.cookie,
);
assert.equal(first.status, 200);
assert.equal(first.data.xp, 20);
const replay = await request('/questions/unlimited?difficulty=Quant', undefined, other.cookie);
const repeated = await request(
  '/questions/' + replay.data.question.id + '/answer',
  { ticket: replay.data.ticket, optionId: '1' },
  other.cookie,
);
assert.equal(repeated.data.xp, 0);
const next = await request('/questions/unlimited?difficulty=Advanced', undefined, cookie);
const twice = await Promise.all([
  request(
    '/questions/' + next.data.question.id + '/answer',
    { ticket: next.data.ticket, optionId: '1' },
    cookie,
  ),
  request(
    '/questions/' + next.data.question.id + '/answer',
    { ticket: next.data.ticket, optionId: '1' },
    cookie,
  ),
]);
assert.equal(twice.filter((r) => r.status === 200).length, 1);
const completed = new Set([q.id]);
for (const question of d2.data.questions) {
  if (completed.has(question.id)) continue;
  const r = await request(
    '/questions/' + question.id + '/answer',
    { ticket: d2.data.tickets[question.id], optionId: '0' },
    cookie,
  );
  assert.equal(r.status, 200);
  completed.add(question.id);
}
const after = await request('/user/profile', undefined, cookie);
assert.equal(after.data.streak, 1);
assert.equal(after.data.attempts.filter((a: { mode: string }) => a.mode === 'daily').length, 10);
const rated = await request('/questions/unlimited?difficulty=Beginner', undefined, cookie);
assert.equal(
  (
    await request(
      '/questions/' + rated.data.question.id + '/answer',
      { ticket: rated.data.ticket, optionId: '0', confidence: 150 },
      cookie,
    )
  ).status,
  400,
);
const ratedAnswer = await request(
  '/questions/' + rated.data.question.id + '/answer',
  { ticket: rated.data.ticket, optionId: '0', confidence: 70 },
  cookie,
);
assert.equal(ratedAnswer.status, 200);
assert.equal(ratedAnswer.data.profile.attempts.at(-1).confidence, 70);
assert.equal(ratedAnswer.data.profile.calibration.count, 1);
assert.equal(ratedAnswer.data.profile.calibration.buckets[0].stated, 70);
const byTopic = await request('/questions/unlimited?category=Risk', undefined, cookie);
assert.equal(byTopic.status, 200);
assert.equal(byTopic.data.question.category, 'Risk');
assert.equal(
  (await request('/questions/unlimited?category=Astrology', undefined, cookie)).status,
  400,
);
const market = await request('/lab/market?preset=crash&seed=7');
assert.equal(market.status, 200);
assert.equal(market.data.prices.length, 251);
assert.deepEqual(market.data, (await request('/lab/market?preset=crash&seed=7')).data);
assert.equal((await request('/lab/market?preset=moon&seed=7')).status, 400);
assert.equal((await request('/lab/market?preset=calm&seed=0')).status, 400);
const catalogue = await request('/events', undefined, cookie);
assert.equal(catalogue.status, 200);
assert.ok(catalogue.data.length >= 6);
const runPlan = {
  exitDrawdown: 20,
  addRule: 'never',
  confidence: 70,
  thesis: 'A mix rides out shocks.',
};
assert.equal(
  (
    await request(
      '/events/runs',
      {
        eventId: 'covid-2020',
        subject: 'mix',
        mix: { equity: 60, debt: 30, gold: 20 },
        plan: runPlan,
        blind: true,
      },
      cookie,
    )
  ).status,
  400,
);
assert.equal(
  (
    await request(
      '/events/runs',
      { eventId: 'covid-2020', subject: 'stock', plan: runPlan, blind: true },
      cookie,
    )
  ).status,
  400,
);
const started = await request(
  '/events/runs',
  {
    eventId: 'covid-2020',
    subject: 'mix',
    mix: { equity: 60, debt: 30, gold: 10 },
    plan: runPlan,
    blind: true,
  },
  cookie,
);
assert.equal(started.status, 200);
assert.equal(started.data.title, 'Mystery event');
assert.equal(started.data.prices.length, 1);
assert.ok(!('holdPath' in started.data));
assert.equal(
  (await request('/events/runs/' + started.data.id, undefined, other.cookie)).status,
  404,
);
const [firstMove, doubleMove] = await Promise.all([
  request('/events/runs/' + started.data.id + '/decide', { action: 'hold', day: 0 }, cookie),
  request('/events/runs/' + started.data.id + '/decide', { action: 'hold', day: 0 }, cookie),
]);
assert.deepEqual([firstMove.status, doubleMove.status].sort(), [200, 409]);
let runState = firstMove.status === 200 ? firstMove : doubleMove;
assert.equal(runState.data.day, 5);
assert.equal(runState.data.prices.length, 6);
for (let step = 0; !runState.data.done; step++) {
  assert.ok(step < 8, 'run should finish within eight checkpoints');
  runState = await request(
    '/events/runs/' + started.data.id + '/decide',
    { action: 'hold', day: runState.data.day },
    cookie,
  );
  assert.equal(runState.status, 200);
}
assert.equal(runState.data.eventName, 'COVID crash and rebound');
assert.equal(runState.data.holdPath.length, 41);
assert.equal(runState.data.summary.behaviourGap, 0);
assert.equal(
  (
    await request(
      '/events/runs/' + started.data.id + '/decide',
      { action: 'hold', day: 40 },
      cookie,
    )
  ).status,
  409,
);
assert.equal(
  (
    await request(
      '/events/runs/' + started.data.id + '/reflection',
      { text: 'Held through it.' },
      cookie,
    )
  ).status,
  200,
);
const runList = await request('/events/runs', undefined, cookie);
assert.equal(runList.data[0].id, started.data.id);
assert.equal(runList.data[0].done, true);
assert.ok(runList.data[0].summary.processScore >= 0);
await request('/auth/logout', {}, cookie);
assert.equal((await request('/user/profile', undefined, cookie)).status, 401);
assert.equal((await request('/auth/login', { email, password: 'wrong-password-42' })).status, 401);
const login = await request('/auth/login', { email, password });
assert.equal(login.status, 200);
assert.equal((await request('/user/profile', undefined, login.cookie)).data.streak, 1);
await request('/auth/logout', {}, login.cookie);
console.log(
  'API integration checks passed: auth, isolation, secrecy, validation, concurrent duplicates, practice rewards, daily completion, streaks, calibration, topic practice, synthetic markets, Event Lab runs and persistence.',
);
