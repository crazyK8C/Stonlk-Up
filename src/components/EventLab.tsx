import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import {
  confidenceLevels,
  type EventAction,
  type EventCard,
  type EventDebrief,
  type EventMix,
  type EventPlan,
  type EventRunView,
  type EventShelf,
  type EventSubject,
  type RunVerdict,
} from '../../shared/types';
import { api } from '../lib/api';
import { EventChart } from './EventChart';

const SHELVES: { id: EventShelf; label: string }[] = [
  { id: 'global', label: 'Global shocks' },
  { id: 'crowd', label: 'Crowd moments' },
  { id: 'india', label: 'Indian calendar' },
];
const SUBJECTS: Record<EventSubject, { title: string; sub: string; phrase: string }> = {
  index: {
    title: 'The market index',
    sub: 'How did a broad index behave, and what did I expect?',
    phrase: 'the market index',
  },
  mix: {
    title: 'My portfolio mix',
    sub: 'What would my mix have done, and how would I have felt?',
    phrase: 'your portfolio mix',
  },
  stock: {
    title: 'The hyped stock',
    sub: 'Could I stick to a plan while everyone else piled in?',
    phrase: 'the hyped stock',
  },
};
const ACTIONS: { id: EventAction; label: string; hint: string }[] = [
  { id: 'hold', label: 'Hold', hint: 'Keep your position' },
  { id: 'trim', label: 'Trim 25%', hint: 'Sell a quarter' },
  { id: 'add', label: 'Add 10%', hint: 'Put in more' },
  { id: 'exit', label: 'Exit all', hint: 'Go to cash' },
];
const VERDICT: Record<RunVerdict, { title: string; text: string }> = {
  'earned-win': { title: 'Earned win', text: 'Good process, good outcome. Do it again.' },
  'bad-beat': {
    title: 'Bad beat',
    text: 'Good process, bad outcome. Keep the habit; question the rule.',
  },
  'dumb-luck': {
    title: 'Dumb luck',
    text: 'Weak process, good outcome. The most dangerous result to learn from.',
  },
  'deserved-loss': {
    title: 'Deserved loss',
    text: 'Weak process, bad outcome. The fix is in the plan.',
  },
};
const signed = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1);

function isDebrief(run: EventRunView | EventDebrief): run is EventDebrief {
  return run.done && 'summary' in run;
}

export function EventLab({
  signedIn,
  onNeedAuth,
  onOpenReflect,
}: {
  signedIn: boolean;
  onNeedAuth: () => void;
  onOpenReflect: () => void;
}) {
  const [cards, setCards] = useState<EventCard[]>([]);
  const [shelf, setShelf] = useState<EventShelf>('global');
  const [eventId, setEventId] = useState('covid-2020');
  const [subject, setSubject] = useState<EventSubject>('mix');
  const [mix, setMix] = useState<EventMix>({ equity: 60, debt: 30, gold: 10 });
  const [plan, setPlan] = useState<EventPlan>({
    exitDrawdown: 20,
    addRule: 'never',
    confidence: 70,
    thesis: '',
  });
  const [blind, setBlind] = useState(true);
  const [run, setRun] = useState<EventRunView | EventDebrief | null>(null);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (signedIn)
      api<EventCard[]>('/events')
        .then(setCards)
        .catch(() => {});
  }, [signedIn]);
  const card = cards.find((c) => c.id === eventId);
  useEffect(() => {
    if (card && !card.subjects.includes(subject)) setSubject(card.subjects[0]);
  }, [card, subject]);

  async function call<T>(path: string, body: unknown) {
    setBusy(true);
    setError('');
    try {
      return await api<T>(path, body);
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    const r = await call<EventRunView>('/events/runs', {
      eventId,
      subject,
      ...(subject === 'mix' ? { mix } : {}),
      plan,
      blind,
    });
    if (r) {
      setRun(r);
      setReflection('');
      setSaved(false);
      window.scrollTo({ top: 0 });
    }
  }
  async function decide(action: EventAction) {
    if (!run) return;
    const r = await call<EventRunView | EventDebrief>(`/events/runs/${run.id}/decide`, {
      action,
      day: run.day,
    });
    if (r) {
      setRun(r);
      if (r.done) window.scrollTo({ top: 0 });
    }
  }

  if (!signedIn)
    return (
      <section className="content-panel event-gate">
        <h3>Sign in to live through market history</h3>
        <p>
          Event runs are saved to your account so the Gap tracker can show how your decisions change
          over time.
        </p>
        <button className="primary-btn" onClick={onNeedAuth}>
          Sign in or play as guest <ArrowRight size={17} />
        </button>
      </section>
    );

  if (run && isDebrief(run)) return renderDebrief(run);
  if (run) return renderLive(run);

  const mixTotal = mix.equity + mix.debt + mix.gold;
  const shelfCards = cards.filter((c) => c.shelf === shelf);
  return (
    <div className="event-picker">
      <section className="event-catalogue">
        <div className="sandbox-seg" role="tablist" aria-label="Event shelves">
          {SHELVES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={shelf === s.id}
              className={shelf === s.id ? 'selected' : ''}
              onClick={() => setShelf(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {shelf === 'india' ? (
          <div className="content-panel event-coming">
            <h3>Diwali Muhurat, Budget day, election results</h3>
            <p>
              These study the same date across many years, which needs licensed historical Indian
              market data. They'll arrive once that licence is in place.
            </p>
          </div>
        ) : (
          <div className="event-grid">
            {shelfCards.map((c) => (
              <button
                key={c.id}
                aria-pressed={eventId === c.id}
                className={'event-card ' + (eventId === c.id ? 'selected' : '')}
                onClick={() => setEventId(c.id)}
              >
                <span className="event-card-top">
                  <span>{c.when}</span>
                  <span className="track-tag">{c.skill}</span>
                </span>
                <strong>{c.name}</strong>
                <span className="track-summary">{c.blurb}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <aside className="content-panel event-setup">
        <div className="card-overline">YOUR RUN</div>
        {card && (
          <div className="event-brief">
            <span className="muted small">{blind ? 'Mystery event · date hidden' : card.when}</span>
            <strong>{blind ? 'Mystery event' : card.name}</strong>
            <span className="event-known-label">WHAT WAS KNOWN THEN</span>
            <p>{card.knownThen}</p>
          </div>
        )}
        <fieldset className="event-field">
          <legend>What do you want to test?</legend>
          {card?.subjects.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={subject === s}
              className={'event-option ' + (subject === s ? 'selected' : '')}
              onClick={() => setSubject(s)}
            >
              <strong>{SUBJECTS[s].title}</strong>
              <span>{SUBJECTS[s].sub}</span>
            </button>
          ))}
        </fieldset>
        {subject === 'mix' && (
          <fieldset className="event-field event-mix">
            <legend>Your mix, as percentages only</legend>
            {(['equity', 'debt', 'gold'] as const).map((k) => (
              <label key={k}>
                <span>{k === 'equity' ? 'Equity' : k === 'debt' ? 'Debt / FDs' : 'Gold'}</span>
                <input
                  id={'mix-' + k}
                  aria-label={
                    (k === 'equity' ? 'Equity' : k === 'debt' ? 'Debt and FDs' : 'Gold') +
                    ' percentage'
                  }
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={mix[k]}
                  onChange={(e) =>
                    setMix({ ...mix, [k]: Math.max(0, Math.min(100, Number(e.target.value))) })
                  }
                />
                <span>%</span>
              </label>
            ))}
            <span className={mixTotal === 100 ? 'muted small' : 'event-warn'}>
              Total {mixTotal}%{mixTotal !== 100 && ': must add up to 100%'}
            </span>
          </fieldset>
        )}
        <fieldset className="event-field">
          <legend>Exit rule: get out if my holding falls this far from its peak</legend>
          <div className="sandbox-seg">
            {[10, 20, 30, null].map((d) => (
              <button
                key={String(d)}
                type="button"
                aria-pressed={plan.exitDrawdown === d}
                className={plan.exitDrawdown === d ? 'selected' : ''}
                onClick={() => setPlan({ ...plan, exitDrawdown: d })}
              >
                {d === null ? 'No rule' : `−${d}%`}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="event-field">
          <legend>Adding more</legend>
          <div className="sandbox-seg">
            {(
              [
                ['never', 'Never'],
                ['once', 'At most once'],
                ['any', 'Any time'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={plan.addRule === id}
                className={plan.addRule === id ? 'selected' : ''}
                onClick={() => setPlan({ ...plan, addRule: id })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="event-field">
          <legend>How sure are you that your holding ends above where it started?</legend>
          <div className="sandbox-seg">
            {confidenceLevels.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={plan.confidence === c.value}
                className={plan.confidence === c.value ? 'selected' : ''}
                onClick={() => setPlan({ ...plan, confidence: c.value })}
              >
                {c.value}%
              </button>
            ))}
          </div>
        </fieldset>
        <label className="event-field event-thesis">
          <span>Your thesis, in a sentence</span>
          <textarea
            id="event-thesis"
            rows={2}
            maxLength={280}
            placeholder="e.g. A mix with debt and gold should fall less than equity alone."
            value={plan.thesis}
            onChange={(e) => setPlan({ ...plan, thesis: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="event-option event-blind"
          aria-pressed={blind}
          onClick={() => setBlind(!blind)}
        >
          {blind ? <EyeOff size={18} /> : <Eye size={18} />}
          <span>
            <strong>Blind mode {blind ? 'on' : 'off'}</strong>
            <span>Hide the event's name and date until the debrief</span>
          </span>
        </button>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button
          className="primary-btn"
          disabled={busy || !card || (subject === 'mix' && mixTotal !== 100)}
          onClick={start}
        >
          Lock plan and start <Lock size={16} />
        </button>
        <p className="sandbox-note">
          <ShieldCheck size={13} /> A model scenario shaped like the real event. We show what
          happened and how your choices compare, never what to buy.
        </p>
      </aside>
    </div>
  );

  function renderLive(run: EventRunView) {
    const peak = Math.max(...run.values);
    const fall = (1 - run.values.at(-1)! / peak) * 100;
    const ruleLevel =
      run.plan.exitDrawdown === null ? null : peak * (1 - run.plan.exitDrawdown / 100);
    const left = (run.totalDays - run.day) / run.checkpointEvery;
    return (
      <div className="event-live">
        <div className="event-live-head">
          <div>
            <div className="eyebrow">
              {run.when} · testing {SUBJECTS[run.subject].phrase}
            </div>
            <h2>
              {run.title} · Day {run.day} of {run.totalDays}
            </h2>
          </div>
          <span className="muted small">
            {left} checkpoint{left === 1 ? '' : 's'} left
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(run.day / run.totalDays) * 100}%` }} />
        </div>
        <div className="event-live-grid">
          <aside className="content-panel event-plan">
            <div className="card-overline">
              <Lock size={12} /> YOUR PLAN · LOCKED
            </div>
            <p>{run.plan.thesis || 'No thesis written.'}</p>
            <ul>
              <li>
                Exit rule:{' '}
                {run.plan.exitDrawdown === null ? 'none' : `−${run.plan.exitDrawdown}% from peak`}
              </li>
              <li>
                Adding:{' '}
                {run.plan.addRule === 'never'
                  ? 'never'
                  : run.plan.addRule === 'once'
                    ? 'at most once'
                    : 'any time'}
              </li>
              <li>Confidence it ends up: {run.plan.confidence}%</li>
            </ul>
          </aside>
          <section className="content-panel event-board">
            <div className="sandbox-stats market-stats">
              <div>
                <strong>{run.values.at(-1)!.toFixed(1)}</strong>
                <span>Your holding (started at 100)</span>
              </div>
              <div>
                <strong>{run.prices.at(-1)!.toFixed(1)}</strong>
                <span>If you'd just held</span>
              </div>
              <div className={fall > 0.5 ? 'warn' : ''}>
                <strong>{fall < 0.05 ? '0.0' : '−' + fall.toFixed(1)}%</strong>
                <span>Fall from your peak</span>
              </div>
              <div>
                <strong>{Math.round(run.invested * 100)}%</strong>
                <span>Invested</span>
              </div>
            </div>
            <EventChart
              prices={run.prices}
              values={run.values}
              total={run.totalDays}
              decisions={run.decisions}
              ruleLevel={ruleLevel}
              label={`Your holding and the hold-only path up to day ${run.day}. Later days are hidden.`}
            />
            <span className="sandbox-legend">
              <i className="you" /> You <i className="subject" /> If you'd just held
            </span>
            {run.ruleTriggered && (
              <div className="event-alert" role="status">
                <TriangleAlert size={18} />
                <span>
                  <strong>Your own exit rule has triggered.</strong> Following it is your call. The
                  debrief will ask why.
                </span>
              </div>
            )}
            <div className="event-actions">
              <strong>Checkpoint: what do you do for the next {run.checkpointEvery} days?</strong>
              <div className="event-action-grid">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    className={'event-action ' + a.id}
                    disabled={busy || (a.id !== 'hold' && a.id !== 'add' && run.invested === 0)}
                    onClick={() => decide(a.id)}
                  >
                    <strong>{a.label}</strong>
                    <span>{a.hint}</span>
                  </button>
                ))}
              </div>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
            </div>
          </section>
          <aside className="event-feed" aria-label="News and social feed">
            <div className="card-overline">NEWS + FEED</div>
            {[...run.news].reverse().map((n) => (
              <div key={n.day + n.text} className={'event-news ' + n.kind}>
                <span>
                  {n.kind === 'hype' ? 'HYPE · PRESSURE' : 'NEWS'} · DAY {n.day}
                </span>
                <p>{n.text}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    );
  }

  function renderDebrief(r: EventDebrief) {
    const s = r.summary;
    const v = VERDICT[s.verdict];
    return (
      <div className="event-debrief">
        <button className="text-link" onClick={() => setRun(null)}>
          <ArrowLeft size={16} /> Back to the Event Lab
        </button>
        <div className="event-debrief-head">
          <div>
            <div className="eyebrow">DEBRIEF · THE EVENT WAS</div>
            <h2>
              {r.eventName} <span>· {r.eventWhen}</span>
            </h2>
            <p className="muted">
              You tested {SUBJECTS[r.subject].phrase} against a model scenario shaped like this
              event.
            </p>
          </div>
          <div className={'event-verdict ' + s.verdict}>
            <span>THIS RUN WAS</span>
            <strong>{v.title}</strong>
            <small>{v.text}</small>
          </div>
        </div>
        <div className="event-scores">
          <div className="content-panel">
            <span>Process score</span>
            <strong>{s.processScore}/100</strong>
            <small>Plan written, rules followed, no pressure trades</small>
          </div>
          <div className="content-panel">
            <span>Calibration (Brier, lower is better)</span>
            <strong>{s.brier.toFixed(2)}</strong>
            <small>
              You said {s.confidence}% · it {s.hit ? 'did' : "didn't"} end up
            </small>
          </div>
          <div className="content-panel quiet">
            <span>Outcome (shown last on purpose)</span>
            <strong className={s.outcome < 0 ? 'neg' : ''}>{signed(s.outcome)}%</strong>
            <small>One path. Outcomes are noisy.</small>
          </div>
        </div>
        <section className="content-panel">
          <EventChart
            prices={r.holdPath}
            values={r.values}
            benchmark={r.benchmarkPath}
            total={r.totalDays}
            decisions={r.decisions}
            triggerDay={r.triggerDay}
            label={`Full run. If you had held: ${signed(s.holdOutcome)}%. Your result: ${signed(s.outcome)}%.`}
          />
          <span className="sandbox-legend">
            <i className="you" /> You <i className="subject" /> If you'd just held
            {r.benchmarkPath && (
              <>
                <i className="benchmark" /> Equity alone
              </>
            )}
            {r.triggerDay !== null && <span>Circle: where your exit rule triggered</span>}
          </span>
        </section>
        <div className="event-gaps">
          <div className="content-panel gap plan">
            <span>PLAN GAP</span>
            <strong>
              {r.plan.exitDrawdown === null
                ? 'No exit rule'
                : s.checkpointsLate === null
                  ? s.ruleIgnored
                    ? 'Rule ignored'
                    : 'Never triggered'
                  : s.checkpointsLate === 0
                    ? 'On time'
                    : `${s.checkpointsLate} checkpoint${s.checkpointsLate === 1 ? '' : 's'} late`}
            </strong>
            <p>What you planned versus what you did.</p>
          </div>
          <div className="content-panel gap behaviour">
            <span>BEHAVIOUR GAP</span>
            <strong>{signed(s.behaviourGap)} pts</strong>
            <p>
              Your moves versus simply holding: {r.values.at(-1)!.toFixed(1)} vs{' '}
              {r.holdPath.at(-1)!.toFixed(1)}.
            </p>
          </div>
          <div className="content-panel gap benchmark">
            <span>BENCHMARK GAP</span>
            <strong>
              {s.benchmarkDrawdown === null
                ? 'n/a'
                : `${(s.benchmarkDrawdown - s.subjectDrawdown).toFixed(1)} pts smaller fall`}
            </strong>
            <p>
              {s.benchmarkDrawdown === null
                ? 'Test your mix to compare it with equity alone.'
                : `Your mix fell ${s.subjectDrawdown}% at worst; equity alone fell ${s.benchmarkDrawdown}%.`}
            </p>
          </div>
          <div className="content-panel gap confidence">
            <span>CONFIDENCE GAP</span>
            <strong>
              {s.confidence}% said · {s.hit ? 'it happened' : "it didn't"}
            </strong>
            <p>One run can't tell you much. The Gap tracker shows your pattern over many.</p>
          </div>
        </div>
        {s.tags.length > 0 && (
          <div className="category-row">
            {s.tags.map((t) => (
              <span key={t} className="category-chip tag">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="event-knowable">
          <div className="content-panel">
            <h3>Knowable then</h3>
            <p>{r.knownThen}</p>
          </div>
          <div className="content-panel">
            <h3>Not knowable</h3>
            <p>{r.notKnowable}</p>
          </div>
        </div>
        <section className="content-panel event-reflect">
          <label htmlFor="event-reflection">
            <strong>Reflect:</strong> what would you do differently next time, and why?
          </label>
          <textarea
            id="event-reflection"
            rows={3}
            maxLength={1000}
            value={reflection || r.reflection}
            onChange={(e) => {
              setReflection(e.target.value);
              setSaved(false);
            }}
          />
          <div className="lesson-actions">
            <button
              className="guest-btn"
              disabled={busy}
              onClick={async () => {
                const ok = await call(`/events/runs/${r.id}/reflection`, {
                  text: reflection || r.reflection,
                });
                if (ok) setSaved(true);
              }}
            >
              {saved ? 'Saved to your journal' : 'Save reflection'}
            </button>
            <button className="guest-btn" onClick={() => setRun(null)}>
              Try a different plan
            </button>
            <button className="primary-btn" onClick={onOpenReflect}>
              Open the Gap tracker <ArrowRight size={17} />
            </button>
          </div>
          <p className="sandbox-note">
            <ShieldCheck size={13} /> A model scenario shaped like a real event, not real prices.
            This isn't a recommendation.
          </p>
        </section>
      </div>
    );
  }
}
