import test from 'node:test';
import assert from 'node:assert/strict';
import {
  events,
  findEvent,
  replay,
  scenario,
  summarise,
  triggerDay,
  TOTAL_DAYS,
} from './events.js';
import type { EventPlan } from '../shared/types.js';

const plan = (over: Partial<EventPlan> = {}): EventPlan => ({
  exitDrawdown: 20,
  addRule: 'never',
  confidence: 60,
  thesis: 'A diversified mix should ride out a shock.',
  ...over,
});

test('every event scenario is deterministic and well formed', () => {
  for (const e of events) {
    const mix = e.subjects.includes('mix') ? { equity: 60, debt: 30, gold: 10 } : null;
    const a = scenario(e, 11, mix);
    assert.deepEqual(a, scenario(e, 11, mix));
    assert.equal(a.subject.length, TOTAL_DAYS + 1);
    assert.ok(
      a.subject.every((v) => Number.isFinite(v) && v > 0),
      e.id,
    );
    assert.ok(
      e.news.every((n) => n.day >= 0 && n.day < TOTAL_DAYS),
      e.id,
    );
  }
});

test('event shapes match their stories on average', () => {
  const trough = (id: string) => {
    const e = findEvent(id)!;
    const mins = Array.from({ length: 40 }, (_, s) => Math.min(...scenario(e, s + 1, null).equity));
    return mins.sort((a, b) => a - b)[20];
  };
  assert.ok(trough('covid-2020') < 80, 'covid should fall at least 20%');
  assert.ok(trough('lehman-2008') < 75, 'lehman should fall at least 25%');
  const brexit = findEvent('brexit-2016')!;
  const s = scenario(brexit, 3, null).equity;
  assert.ok(s[10] / s[9] < 0.95, 'brexit gaps down on the result');
});

test('a mix falls less than equity alone in a crash', () => {
  const covid = findEvent('covid-2020')!;
  const { subject, benchmark } = scenario(covid, 5, { equity: 50, debt: 40, gold: 10 });
  assert.ok(Math.min(...subject) > Math.min(...benchmark!));
});

test('replay applies each decision to the days after it', () => {
  const path = [100, 110, 121, 121];
  const hold = replay(path, [], 3).values;
  assert.deepEqual(hold, [100, 110, 121, 121]);
  const exited = replay(path, [{ day: 1, action: 'exit' }], 3);
  assert.deepEqual(exited.values, [100, 110, 110, 110]);
  assert.equal(exited.invested, 0);
  const trimmed = replay(path, [{ day: 0, action: 'trim' }], 1).values;
  assert.equal(trimmed[1], 107.5);
});

test('scoring separates process from outcome', () => {
  const covid = findEvent('covid-2020')!;
  const { subject } = scenario(covid, 5, null);
  // Holding through with no exit rule and a thesis: clean process.
  const held = replay(subject, [], TOTAL_DAYS).values;
  const calm = summarise(covid, subject, null, held, [], plan({ exitDrawdown: null }));
  assert.equal(calm.processScore, 100);
  assert.equal(calm.behaviourGap, 0);
  // Exit rule that triggers but is never followed: ignored rule.
  const t = triggerDay(held, [], plan());
  assert.notEqual(t, null);
  const ignored = summarise(covid, subject, null, held, [], plan());
  assert.equal(ignored.ruleIgnored, true);
  assert.ok(ignored.processScore <= 70);
  assert.ok(ignored.tags.includes('Ignored your exit rule'));
  // Adding when the plan says never is flagged.
  const added = [{ day: 15, action: 'add' as const }];
  const addRun = summarise(
    covid,
    subject,
    null,
    replay(subject, added, TOTAL_DAYS).values,
    added,
    plan({ exitDrawdown: null }),
  );
  assert.ok(addRun.tags.includes('Broke your add rule'));
});
