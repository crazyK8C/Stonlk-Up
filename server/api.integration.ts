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
const created = await request('/auth/register', { email, password, name: 'Integration test' });
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
const other = await request('/auth/guest', {});
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
await request('/auth/logout', {}, cookie);
assert.equal((await request('/user/profile', undefined, cookie)).status, 401);
assert.equal((await request('/auth/login', { email, password: 'wrong-password-42' })).status, 401);
const login = await request('/auth/login', { email, password });
assert.equal(login.status, 200);
assert.equal((await request('/user/profile', undefined, login.cookie)).data.streak, 1);
await request('/auth/logout', {}, login.cookie);
console.log(
  'API integration checks passed: auth, isolation, secrecy, validation, concurrent duplicates, practice rewards, daily completion, streaks and persistence.',
);
