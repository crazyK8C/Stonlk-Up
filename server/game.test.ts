import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calibration,
  dailyQuestions,
  dayKey,
  resetAt,
  reward,
  expectedReturn,
  streak,
} from './game.js';
import { publicQuestion, questions } from './content.js';
import type { Attempt } from '../shared/types.js';
test('daily challenge is deterministic, unique, and contains exactly ten questions', () => {
  assert.equal(dailyQuestions('2026-10-06').length, 10);
  assert.equal(new Set(dailyQuestions('2026-10-06').map((q) => q.id)).size, 10);
  assert.deepEqual(dailyQuestions('2026-10-06'), dailyQuestions('2026-10-06'));
  assert.notDeepEqual(dailyQuestions('2026-10-06'), dailyQuestions('2026-10-07'));
});
test('UTC reset rolls into next day and year', () => {
  assert.equal(resetAt(new Date('2026-12-31T23:59:59Z')), '2027-01-01T00:00:00.000Z');
  assert.equal(dayKey(new Date('2026-10-06T23:59:59Z')), '2026-10-06');
});
test('answers and chart outcomes are absent from the public payload', () => {
  for (const q of questions) {
    const data = publicQuestion(q);
    assert.ok(!('correctAnswer' in data));
    assert.ok(!('explanation' in data));
    assert.ok(!('chart' in data));
  }
});
test('replays cannot farm XP; practice is reduced and wrong daily answers get participation XP', () => {
  assert.deepEqual(reward(true, 'unlimited', true), { xp: 0, coins: 0 });
  assert.equal(reward(true, 'unlimited', false).xp, 20);
  assert.equal(reward(false, 'daily', false).xp, 15);
  assert.equal(reward(true, 'daily', false).xp, 100);
});
test('expected return accounts for losses and rejects invalid probabilities', () => {
  assert.equal(
    expectedReturn([
      { probability: 0.6, return: 10 },
      { probability: 0.4, return: -5 },
    ]),
    4,
  );
  assert.throws(() => expectedReturn([{ probability: 0.6, return: 10 }]));
});
test('streak requires full daily completion and expires after a missed day', () => {
  const base: Attempt = {
    questionId: 'a',
    optionId: '0',
    correct: true,
    xp: 100,
    coins: 15,
    mode: 'daily',
    day: '2026-10-05',
    at: '2026-10-05T00:00:00Z',
    duration: 1,
    category: 'Risk',
  };
  const attempts = Array.from({ length: 10 }, (_, i) => ({ ...base, questionId: String(i) }));
  assert.equal(streak(attempts, new Date('2026-10-06T02:00:00Z')), 1);
  assert.equal(streak(attempts.slice(0, 9), new Date('2026-10-06T02:00:00Z')), 0);
  assert.equal(streak(attempts, new Date('2026-10-07T02:00:00Z')), 0);
});
test('calibration scores stated confidence against outcomes', () => {
  const base = { questionId: 'q', optionId: '0', xp: 0, coins: 0, mode: 'unlimited' as const };
  const at = (correct: boolean, confidence?: number): Attempt => ({
    ...base,
    correct,
    confidence,
    day: '2026-10-06',
    at: '2026-10-06T00:00:00Z',
    duration: 1,
    category: 'Risk',
  });
  assert.deepEqual(calibration([at(true)]), { count: 0, brier: null, buckets: [] });
  const c = calibration([at(true, 90), at(false, 90), at(true, 50), at(false)]);
  assert.equal(c.count, 3);
  // ((0.9-1)^2 + (0.9-0)^2 + (0.5-1)^2) / 3 = (0.01 + 0.81 + 0.25) / 3
  assert.equal(c.brier, 0.357);
  assert.deepEqual(c.buckets, [
    { stated: 50, hitRate: 100, n: 1 },
    { stated: 90, hitRate: 50, n: 2 },
  ]);
});
