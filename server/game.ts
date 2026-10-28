import { createHash } from 'node:crypto';
import type { Attempt, Calibration, Profile } from '../shared/types.js';
import { questions } from './content.js';
export function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}
export function dailyQuestions(day = dayKey()) {
  return [...questions]
    .sort((a, b) =>
      createHash('sha256')
        .update(day + a.id)
        .digest('hex')
        .localeCompare(
          createHash('sha256')
            .update(day + b.id)
            .digest('hex'),
        ),
    )
    .slice(0, 10);
}
export function resetAt(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  ).toISOString();
}
export function streak(attempts: Attempt[], now = new Date()) {
  const completed = new Set<string>();
  const days = new Map<string, Set<string>>();
  for (const a of attempts.filter((a) => a.mode === 'daily')) {
    const set = days.get(a.day) ?? new Set();
    set.add(a.questionId);
    days.set(a.day, set);
  }
  for (const [day, set] of days) if (set.size >= 10) completed.add(day);
  const d = new Date(dayKey(now) + 'T00:00:00Z');
  if (!completed.has(dayKey(d))) d.setUTCDate(d.getUTCDate() - 1);
  let count = 0;
  while (completed.has(dayKey(d))) {
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return count;
}
// Brier score: mean of (stated probability - outcome)^2. Lower is better calibrated.
export function calibration(attempts: Attempt[]): Calibration {
  const rated = attempts.filter((a) => typeof a.confidence === 'number');
  const groups = new Map<number, { hits: number; n: number }>();
  for (const a of rated) {
    const g = groups.get(a.confidence!) ?? { hits: 0, n: 0 };
    g.n++;
    if (a.correct) g.hits++;
    groups.set(a.confidence!, g);
  }
  const brier = rated.length
    ? rated.reduce((s, a) => s + (a.confidence! / 100 - (a.correct ? 1 : 0)) ** 2, 0) /
      rated.length
    : null;
  return {
    count: rated.length,
    brier: brier === null ? null : Math.round(brier * 1000) / 1000,
    buckets: [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([stated, g]) => ({ stated, hitRate: Math.round((g.hits / g.n) * 100), n: g.n })),
  };
}
export function profile(user: {
  id: string;
  name: string;
  email: string;
  xp: number;
  coins: number;
  attempts: Attempt[];
}): Profile {
  return {
    ...user,
    level: Math.min(8, Math.floor(user.xp / 1000) + 1),
    streak: streak(user.attempts),
    accuracy: user.attempts.length
      ? Math.round((user.attempts.filter((a) => a.correct).length / user.attempts.length) * 100)
      : 0,
    calibration: calibration(user.attempts),
  };
}
export function reward(correct: boolean, mode: 'daily' | 'unlimited', alreadyRewarded: boolean) {
  if (alreadyRewarded) return { xp: 0, coins: 0 };
  return correct
    ? { xp: mode === 'daily' ? 100 : 20, coins: mode === 'daily' ? 15 : 3 }
    : { xp: mode === 'daily' ? 15 : 0, coins: 0 };
}
export function expectedReturn(outcomes: { probability: number; return: number }[]) {
  const sum = outcomes.reduce((s, o) => s + o.probability, 0);
  if (Math.abs(sum - 1) > 1e-8 || outcomes.some((o) => o.probability < 0))
    throw new Error('Probabilities must sum to one');
  return outcomes.reduce((s, o) => s + o.probability * o.return, 0);
}
