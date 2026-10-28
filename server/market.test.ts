import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMarket, marketStats } from './market.js';

const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1];
const sample = (preset: 'calm' | 'choppy' | 'crash', key: 'maxDrawdown' | 'annualVolatility') =>
  median(Array.from({ length: 60 }, (_, i) => generateMarket(preset, i + 1).stats[key]));

test('synthetic markets replay exactly from the same seed', () => {
  assert.deepEqual(generateMarket('choppy', 42), generateMarket('choppy', 42));
  assert.notDeepEqual(generateMarket('choppy', 42).prices, generateMarket('choppy', 43).prices);
});

test('synthetic paths are finite, positive and the requested length', () => {
  for (const preset of ['calm', 'choppy', 'crash'] as const)
    for (let seed = 1; seed <= 20; seed++) {
      const m = generateMarket(preset, seed, 120);
      assert.equal(m.prices.length, 121);
      assert.equal(m.regimes.length, 121);
      assert.ok(m.prices.every((p) => Number.isFinite(p) && p > 0));
    }
});

test('presets behave as labelled', () => {
  const crashDrawdown = sample('crash', 'maxDrawdown');
  const calmDrawdown = sample('calm', 'maxDrawdown');
  assert.ok(crashDrawdown > 25, `crash median drawdown ${crashDrawdown}`);
  assert.ok(calmDrawdown < 20, `calm median drawdown ${calmDrawdown}`);
  assert.ok(sample('choppy', 'annualVolatility') > sample('calm', 'annualVolatility'));
  const crash = generateMarket('crash', 7);
  assert.equal(crash.regimes[70], 'bear');
});

test('market stats measure return, drawdown and worst day', () => {
  const s = marketStats([100, 110, 88, 99]);
  assert.equal(s.totalReturn, -1);
  assert.equal(s.maxDrawdown, 20);
  assert.equal(s.worstDay, -20);
});
