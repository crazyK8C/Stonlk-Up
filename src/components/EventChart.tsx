import type { EventAction } from '../../shared/types';

const ACTION_LABEL: Record<EventAction, string> = {
  hold: 'Hold',
  trim: 'Trim',
  add: 'Add',
  exit: 'Exit',
};

/** Event Lab chart. Days past `prices` are hidden behind a "?" panel. */
export function EventChart({
  prices,
  values,
  total,
  benchmark,
  decisions = [],
  triggerDay = null,
  ruleLevel = null,
  label,
}: {
  prices: number[];
  values: number[];
  total: number;
  benchmark?: number[] | null;
  decisions?: { day: number; action: EventAction }[];
  triggerDay?: number | null;
  ruleLevel?: number | null;
  label: string;
}) {
  const all = [...prices, ...values, ...(benchmark ?? []), ...(ruleLevel ? [ruleLevel] : [])];
  const min = Math.min(...all) * 0.96;
  const max = Math.max(...all) * 1.04;
  const x = (d: number) => 44 + (d / total) * 640;
  const y = (v: number) => 14 + (1 - (v - min) / (max - min)) * 236;
  const line = (path: number[]) => path.map((v, d) => `${x(d)},${y(v).toFixed(1)}`).join(' ');
  const shown = prices.length - 1;
  const ticks = [min * 1.02, (min + max) / 2, max * 0.98];
  return (
    <svg viewBox="0 0 700 280" className="event-chart" role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1="44" x2="684" y1={y(t)} y2={y(t)} className="sandbox-grid" />
          <text x="38" y={y(t) + 4} textAnchor="end" className="sandbox-axis">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <line x1="44" x2="684" y1={y(100)} y2={y(100)} className="sandbox-start" />
      {ruleLevel !== null && (
        <>
          <line x1="44" x2="684" y1={y(ruleLevel)} y2={y(ruleLevel)} className="event-rule" />
          <text x="48" y={y(ruleLevel) + 15} className="event-rule-label">
            Your exit rule
          </text>
        </>
      )}
      {shown < total && (
        <>
          <rect
            x={x(shown) + 6}
            y={10}
            width={684 - x(shown) - 6}
            height={244}
            rx={10}
            className="event-hidden"
          />
          <text x={(x(shown) + 690) / 2} y={150} textAnchor="middle" className="event-hidden-mark">
            ?
          </text>
        </>
      )}
      {benchmark && <polyline points={line(benchmark)} className="event-line benchmark" />}
      <polyline points={line(prices)} className="event-line subject" />
      <polyline points={line(values)} className="event-line you" />
      {decisions
        .filter((d) => d.action !== 'hold' && d.day < values.length)
        .map((d) => (
          <g key={d.day}>
            <circle
              cx={x(d.day)}
              cy={y(values[d.day])}
              r={6}
              className={'event-move ' + d.action}
            />
            <text
              x={x(d.day)}
              y={y(values[d.day]) - 11}
              textAnchor="middle"
              className="event-move-label"
            >
              {ACTION_LABEL[d.action]}
            </text>
          </g>
        ))}
      {triggerDay !== null && triggerDay < values.length && (
        <circle cx={x(triggerDay)} cy={y(values[triggerDay])} r={8} className="event-trigger" />
      )}
      <text x="44" y="272" className="sandbox-axis">
        Day 0
      </text>
      <text x="684" y="272" textAnchor="end" className="sandbox-axis">
        Day {total}
      </text>
    </svg>
  );
}
