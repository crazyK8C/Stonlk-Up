import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const PATHS = 1000;
const START = 100000;
const SWEEP = [0.5, 1, 2, 3, 5, 10];
const LIMITS = [20, 30, 50];

// Small seeded generator so every setting replays the same luck.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const inr = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : '₹' + Math.round(n).toLocaleString('en-IN');

/** Shuffle-free Monte Carlo: each path draws independent wins and losses at a fixed risk per trade. */
function simulate(luck: number[][], winRate: number, payoff: number, risk: number, limit: number) {
  const steps = luck[0].length;
  const balances: number[][] = Array.from({ length: steps + 1 }, () => []);
  const drawdowns: number[] = [];
  let ruined = 0;
  for (const row of luck) {
    let b = START;
    let peak = START;
    let worst = 0;
    balances[0].push(b);
    row.forEach((r, i) => {
      b *= r < winRate ? 1 + risk * payoff : 1 - risk;
      peak = Math.max(peak, b);
      worst = Math.max(worst, 1 - b / peak);
      balances[i + 1].push(b);
    });
    drawdowns.push(worst);
    if (worst >= limit) ruined++;
  }
  drawdowns.sort((a, b) => a - b);
  return { balances, drawdowns, ruin: ruined / luck.length };
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-xs text-muted-foreground">
        {label}
        <span className="font-mono text-sm text-foreground">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-cyan"
      />
    </label>
  );
}

export function RiskOfRuin() {
  const [winRate, setWinRate] = useState(50);
  const [payoff, setPayoff] = useState(1.5);
  const [risk, setRisk] = useState(2);
  const [trades, setTrades] = useState(100);
  const [limit, setLimit] = useState(30);

  const luck = useMemo(() => {
    const rand = seeded(20261031);
    return Array.from({ length: PATHS }, () => Array.from({ length: 200 }, () => rand()));
  }, []);
  const rows = useMemo(() => luck.map((r) => r.slice(0, trades)), [luck, trades]);

  const run = useMemo(
    () => simulate(rows, winRate / 100, payoff, risk / 100, limit / 100),
    [rows, winRate, payoff, risk, limit],
  );
  const sweep = useMemo(
    () => SWEEP.map((r) => ({ r, ruin: simulate(rows, winRate / 100, payoff, r / 100, limit / 100).ruin })),
    [rows, winRate, payoff, limit],
  );
  const bands = useMemo(
    () =>
      run.balances.map((col) => {
        const s = [...col].sort((a, b) => a - b);
        return { p5: pct(s, 0.05), p25: pct(s, 0.25), p50: pct(s, 0.5), p75: pct(s, 0.75), p95: pct(s, 0.95) };
      }),
    [run],
  );

  const expectancy = (winRate / 100) * payoff - (1 - winRate / 100);
  const last = bands[bands.length - 1];
  const finals = [...run.balances[trades]].sort((a, b) => a - b);
  const losing = finals.filter((v) => v < START).length / PATHS;

  // Chart geometry: log scale spanning the 90% band and the pain-limit line.
  const W = 640;
  const H = 260;
  const lo = Math.log10(Math.max(1000, Math.min(START * (1 - limit / 100), ...bands.map((b) => b.p5)) * 0.92));
  const hi = Math.log10(Math.max(...bands.map((b) => b.p95)) * 1.05);
  const x = (i: number) => 48 + (i / trades) * (W - 56);
  const y = (v: number) => 8 + (1 - (Math.log10(Math.max(v, 1000)) - lo) / (hi - lo || 1)) * (H - 32);
  const area = (a: 'p5' | 'p25', b: 'p95' | 'p75') =>
    bands.map((d, i) => `${x(i)},${y(d[b])}`).join(' ') +
    ' ' +
    [...bands].reverse().map((d, i) => `${x(bands.length - 1 - i)},${y(d[a])}`).join(' ');
  const ticks = [10000, 25000, 50000, 100000, 200000, 500000, 1000000].filter(
    (v) => Math.log10(v) >= lo && Math.log10(v) <= hi,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 @4xl:grid-cols-[260px_1fr]">
        <div className="grid content-start gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 @xl:grid-cols-2 @4xl:grid-cols-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground @xl:col-span-2 @4xl:col-span-1">
            Strategy inputs
          </div>
          <Slider label="Win rate" value={winRate} display={`${winRate}%`} min={25} max={75} step={1} onChange={setWinRate} />
          <Slider label="Average win ÷ average loss" value={payoff} display={`${payoff.toFixed(1)}×`} min={0.5} max={4} step={0.1} onChange={setPayoff} />
          <Slider label="Risk per trade" value={risk} display={`${risk}%`} min={0.5} max={15} step={0.5} onChange={setRisk} />
          <Slider label="Number of trades" value={trades} display={String(trades)} min={20} max={200} step={10} onChange={setTrades} />
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">My pain limit (drawdown I'd quit at)</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
              {LIMITS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={cn(
                    'rounded-md py-1.5 font-mono text-xs transition-colors',
                    limit === l ? 'bg-cyan/15 text-cyan' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  −{l}%
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-3 text-xs text-muted-foreground @xl:col-span-2 @4xl:col-span-1">
            Edge per trade{' '}
            <span className={cn('font-mono text-sm', expectancy > 0 ? 'text-gain' : 'text-loss')}>
              {expectancy > 0 ? '+' : ''}
              {expectancy.toFixed(2)}R
            </span>
            <p className="mt-1 leading-relaxed">
              {expectancy > 0
                ? 'A positive edge. Sizing decides whether you live to collect it.'
                : 'No edge: no bet size makes this strategy grow on average.'}
            </p>
          </div>
        </div>

        <div className="@container flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4" aria-live="polite">
            {[
              {
                k: `Chance of hitting −${limit}%`,
                v: `${(run.ruin * 100).toFixed(1)}%`,
                tone: run.ruin > 0.2 ? 'text-loss' : run.ruin > 0.05 ? 'text-warn' : 'text-gain',
              },
              { k: 'Median ending balance', v: inr(last.p50), tone: last.p50 >= START ? 'text-foreground' : 'text-loss' },
              { k: 'Typical worst drawdown', v: `−${(pct(run.drawdowns, 0.5) * 100).toFixed(0)}%`, tone: 'text-foreground' },
              { k: '1-in-20 worst drawdown', v: `−${(pct(run.drawdowns, 0.95) * 100).toFixed(0)}%`, tone: 'text-warn' },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] leading-snug text-muted-foreground">{s.k}</div>
                <div className={cn('mt-1 font-mono text-xl font-semibold tabular-nums', s.tone)}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>{PATHS.toLocaleString('en-IN')} simulated accounts · ₹1L start</span>
              <span className="flex items-center gap-3 normal-case tracking-normal">
                <span className="flex items-center gap-1.5">
                  <i className="inline-block h-2 w-3 rounded-sm bg-cyan/50" /> middle half
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="inline-block h-2 w-3 rounded-sm bg-cyan/15" /> 90% range
                </span>
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Range of account balances over ${trades} trades`}>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1="48" x2={W - 8} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.05)" />
                  <text x="42" y={y(v) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                    {v >= 100000 ? `${v / 100000}L` : `${v / 1000}k`}
                  </text>
                </g>
              ))}
              <polygon points={area('p5', 'p95')} fill="rgba(56,189,248,0.10)" />
              <polygon points={area('p25', 'p75')} fill="rgba(56,189,248,0.28)" />
              <polyline
                points={bands.map((d, i) => `${x(i)},${y(d.p50)}`).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              <line x1="48" x2={W - 8} y1={y(START)} y2={y(START)} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
              <line
                x1="48"
                x2={W - 8}
                y1={y(START * (1 - limit / 100))}
                y2={y(START * (1 - limit / 100))}
                stroke="#f43f5e"
                strokeOpacity="0.6"
                strokeDasharray="2 4"
              />
              <text x={W - 10} y={y(START * (1 - limit / 100)) - 4} textAnchor="end" className="fill-loss font-mono text-[10px]">
                pain limit −{limit}% from start
              </text>
              <text x="48" y={H - 4} className="fill-muted-foreground font-mono text-[10px]">
                Trade 0
              </text>
              <text x={W - 8} y={H - 4} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                Trade {trades}
              </text>
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">
              {Math.round(losing * 100)}% of accounts end below where they started. The pain-limit chance counts any fall of
              −{limit}% from a peak, not only from the start.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Same strategy, every bet size
          </div>
          <span className="text-xs text-muted-foreground">Chance of a −{limit}% drawdown. Ruin grows much faster than the bet.</span>
        </div>
        <div className="grid grid-cols-6 items-end gap-2 sm:gap-4">
          {sweep.map((s) => (
            <button
              key={s.r}
              onClick={() => setRisk(s.r)}
              className="group flex flex-col items-center gap-2"
              aria-label={`${s.r}% risk: ${(s.ruin * 100).toFixed(0)}% chance`}
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground group-hover:text-foreground">
                {(s.ruin * 100).toFixed(0)}%
              </span>
              <span className="flex h-28 w-full items-end overflow-hidden rounded-md bg-white/[0.03]">
                <span
                  className={cn(
                    'w-full rounded-md transition-all duration-500',
                    s.ruin > 0.2 ? 'bg-loss/70' : s.ruin > 0.05 ? 'bg-warn/70' : 'bg-gain/70',
                  )}
                  style={{ height: `${Math.max(2, s.ruin * 100)}%` }}
                />
              </span>
              <span className={cn('font-mono text-xs', risk === s.r ? 'text-cyan' : 'text-muted-foreground')}>{s.r}%</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        A model, not a forecast. It assumes every trade is independent, so it understates real losing streaks, which cluster. If
        your win rate comes from a curve-fitted backtest, these numbers will look precise and still be wrong.
      </p>
    </div>
  );
}
