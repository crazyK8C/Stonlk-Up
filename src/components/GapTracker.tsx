import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { EventRunListItem, RunSummary, RunVerdict } from '../../shared/types';
import { api } from '../lib/api';

const VERDICT_LABEL: Record<RunVerdict, string> = {
  'earned-win': 'Earned win',
  'bad-beat': 'Bad beat',
  'dumb-luck': 'Dumb luck',
  'deserved-loss': 'Deserved loss',
};
const avg = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
const signed = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1);

function pattern(runs: RunSummary[]) {
  const counts = new Map<string, number>();
  for (const r of runs) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!top) return 'No repeated slip-ups yet. You followed your plans and avoided pressure trades.';
  const [tag, n] = top;
  return `Your most common slip: "${tag.toLowerCase()}", in ${n} of ${runs.length} run${runs.length === 1 ? '' : 's'}.`;
}

export function GapTracker({ onOpenLab }: { onOpenLab: () => void }) {
  const [runs, setRuns] = useState<EventRunListItem[] | null>(null);
  useEffect(() => {
    api<EventRunListItem[]>('/events/runs')
      .then(setRuns)
      .catch(() => setRuns([]));
  }, []);
  const done = (runs ?? []).filter((r) => r.done && r.summary);
  const summaries = done.map((r) => r.summary!);
  if (runs === null) return null;
  if (!done.length)
    return (
      <section className="content-panel gap-tracker">
        <div className="section-heading compact">
          <h3>Gap tracker</h3>
          <span className="muted small">Your process across Event Lab runs</span>
        </div>
        <p>
          Live through a market event in the Strategy Lab. Each finished run adds your plan,
          behaviour, benchmark and confidence gaps here.
        </p>
        <button className="primary-btn" onClick={onOpenLab}>
          Open the Event Lab <ArrowRight size={16} />
        </button>
      </section>
    );
  const triggered = summaries.filter((s) => s.checkpointsLate !== null || s.ruleIgnored);
  const late = triggered.length
    ? avg(triggered.map((s) => (s.ruleIgnored ? 2 : s.checkpointsLate!)))
    : null;
  const withBenchmark = summaries.filter((s) => s.benchmarkDrawdown !== null);
  const stated = avg(summaries.map((s) => s.confidence));
  const hitRate = avg(summaries.map((s) => (s.hit ? 100 : 0)));
  const chronological = [...done].reverse();
  const x = (i: number) => 20 + (i / Math.max(1, chronological.length - 1)) * 360;
  const y = (v: number) => 110 - v;
  return (
    <section className="content-panel gap-tracker">
      <div className="section-heading compact">
        <h3>Gap tracker</h3>
        <span className="muted small">
          {done.length} finished Event Lab run{done.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="gap-pattern">{pattern(summaries)}</p>
      <div className="gap-tiles">
        <div className="gap plan">
          <span>PLAN GAP</span>
          <strong>
            {late === null ? 'Not tested yet' : late === 0 ? 'On time' : `${late.toFixed(1)} late`}
          </strong>
          <small>
            {late === null
              ? 'None of your exit rules has triggered yet'
              : 'Average checkpoints between your rule triggering and acting'}
          </small>
        </div>
        <div className="gap behaviour">
          <span>BEHAVIOUR GAP</span>
          <strong>{signed(avg(summaries.map((s) => s.behaviourGap)))} pts</strong>
          <small>Your moves versus simply holding, on average</small>
        </div>
        <div className="gap benchmark">
          <span>BENCHMARK GAP</span>
          <strong>
            {withBenchmark.length
              ? `${avg(withBenchmark.map((s) => s.benchmarkDrawdown! - s.subjectDrawdown)).toFixed(1)} pts`
              : 'n/a'}
          </strong>
          <small>How much smaller your mix's worst fall was than equity alone</small>
        </div>
        <div className="gap confidence">
          <span>CONFIDENCE GAP</span>
          <strong>{signed(stated - hitRate)} pts</strong>
          <small>
            Said {Math.round(stated)}% on average, right {Math.round(hitRate)}% of the time
          </small>
        </div>
      </div>
      {chronological.length > 1 && (
        <figure className="gap-trend">
          <svg
            viewBox="0 0 400 120"
            role="img"
            aria-label={`Process score per run, oldest to newest: ${chronological.map((r) => r.summary!.processScore).join(', ')}`}
          >
            <line x1="20" x2="380" y1={y(70)} y2={y(70)} className="sandbox-grid" />
            <text x="384" y={y(70) + 4} className="sandbox-axis">
              70
            </text>
            <polyline
              points={chronological
                .map((r, i) => `${x(i)},${y(r.summary!.processScore)}`)
                .join(' ')}
              className="market-line"
            />
            {chronological.map((r, i) => (
              <circle
                key={r.id}
                cx={x(i)}
                cy={y(r.summary!.processScore)}
                r={4}
                className="gap-dot"
              />
            ))}
          </svg>
          <figcaption className="muted small">
            Process score per run, oldest to newest. 70 and up counts as a good process.
          </figcaption>
        </figure>
      )}
      <div className="gap-history">
        {done.slice(0, 10).map((r) => (
          <div className="history-row" key={r.id}>
            <div>
              <strong>{r.eventName}</strong>
              <span>
                {r.subject === 'mix'
                  ? 'Portfolio mix'
                  : r.subject === 'stock'
                    ? 'Hyped stock'
                    : 'Index'}{' '}
                · {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <span className={'gap-verdict ' + r.summary!.verdict}>
              {VERDICT_LABEL[r.summary!.verdict]}
            </span>
            <span className="history-outcome">
              Process {r.summary!.processScore} · {signed(r.summary!.outcome)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
