import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const TRADERS = 100;
const TRADES = 100;
const START = 100000;
const RISK_LEVELS = [0.01, 0.02, 0.05, 0.1, 0.25];

// Small seeded generator so every risk level replays the same wins and losses.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function RiskSandbox() {
  const [risk, setRisk] = useState(0.02);
  const [winRate, setWinRate] = useState(45);
  const payoff = 1.5;
  const outcomes = useMemo(() => {
    const rand = seeded(20261029);
    return Array.from({ length: TRADERS }, () => Array.from({ length: TRADES }, () => rand()));
  }, []);
  const result = useMemo(() => {
    const paths: number[][] = [];
    const finals: number[] = [];
    const drawdowns: number[] = [];
    for (const row of outcomes) {
      let balance = START;
      let peak = START;
      let worst = 0;
      const path = [balance];
      for (const r of row) {
        balance *= r < winRate / 100 ? 1 + risk * payoff : 1 - risk;
        peak = Math.max(peak, balance);
        worst = Math.max(worst, 1 - balance / peak);
        path.push(balance);
      }
      paths.push(path);
      finals.push(balance);
      drawdowns.push(worst);
    }
    return {
      paths,
      median: median(finals),
      profit: finals.filter((v) => v > START).length,
      halved: finals.filter((v) => v < START / 2).length,
      drawdown: median(drawdowns),
    };
  }, [outcomes, risk, winRate]);
  // Work in whole percentages so a 40% win rate gives an edge of exactly zero.
  const edge = (winRate * payoff - (100 - winRate)) / 100;
  // Kelly fraction: the bet size that grows an account fastest. Around twice this, growth stops.
  const kelly = edge / payoff;
  const kellyPct = `${Math.round(kelly * 1000) / 10}%`;
  const lo = Math.log10(2000);
  const hi = Math.log10(2000000);
  const x = (t: number) => 50 + (t / TRADES) * 640;
  const y = (v: number) =>
    10 + (1 - (Math.log10(Math.min(Math.max(v, 2000), 2000000)) - lo) / (hi - lo)) * 260;
  return (
    <div className="sandbox">
      <div className="sandbox-chart content-panel">
        <svg
          viewBox="0 0 700 300"
          role="img"
          aria-label={`Account balances of ${TRADERS} simulated traders over ${TRADES} trades at ${risk * 100}% risk per trade`}
        >
          {[5000, 25000, 100000, 500000, 2000000].map((v) => (
            <g key={v}>
              <line x1="50" x2="690" y1={y(v)} y2={y(v)} className="sandbox-grid" />
              <text x="44" y={y(v) + 4} textAnchor="end" className="sandbox-axis">
                {v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}k`}
              </text>
            </g>
          ))}
          {result.paths.map((p, i) => (
            <polyline
              key={i}
              points={p.map((v, t) => `${x(t)},${y(v).toFixed(1)}`).join(' ')}
              className={p[TRADES] >= START ? 'sandbox-path up' : 'sandbox-path down'}
            />
          ))}
          <line x1="50" x2="690" y1={y(START)} y2={y(START)} className="sandbox-start" />
          <text x="50" y="292" className="sandbox-axis">
            Trade 0
          </text>
          <text x="690" y="292" textAnchor="end" className="sandbox-axis">
            Trade {TRADES}
          </text>
        </svg>
        <span className="sandbox-legend">
          <i className="up" /> Ended in profit <i className="down" /> Ended below start
          <span>Dashed line: starting balance</span>
        </span>
      </div>
      <div className="sandbox-controls content-panel">
        <div>
          <span className="card-overline" id="risk-label">
            RISK PER TRADE
          </span>
          <div className="sandbox-seg" role="group" aria-labelledby="risk-label">
            {RISK_LEVELS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={risk === r}
                className={risk === r ? 'selected' : ''}
                onClick={() => setRisk(r)}
              >
                {r * 100}%
              </button>
            ))}
          </div>
        </div>
        <label className="sandbox-slider">
          <span>
            Win rate <strong>{winRate}%</strong> · winners pay {payoff}× what losers cost
          </span>
          <input
            type="range"
            min={30}
            max={60}
            step={1}
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
          />
          <small>
            Edge per trade: {edge >= 0 ? '+' : ''}
            {edge.toFixed(2)}× the amount risked{' '}
            {edge > 0 ? '(a winning strategy)' : '(a losing strategy)'}
          </small>
        </label>
        <div className="sandbox-stats">
          <div>
            <strong>{inr(result.median)}</strong>
            <span>Median ending balance</span>
          </div>
          <div>
            <strong>{result.profit}/100</strong>
            <span>Ended in profit</span>
          </div>
          <div className="warn">
            <strong>{result.halved}/100</strong>
            <span>Lost more than half</span>
          </div>
          <div>
            <strong>−{Math.round(result.drawdown * 100)}%</strong>
            <span>Median worst drawdown</span>
          </div>
        </div>
        <p className="sandbox-verdict">
          {edge <= 0
            ? 'With no edge, sizing can’t save you. Smaller bets only lose more slowly.'
            : risk <= kelly / 2
              ? `Well under the Kelly limit of ${kellyPct}, the size that grows an account fastest. The edge shows up and drawdowns stay survivable.`
              : risk <= kelly
                ? `Close to the Kelly limit of ${kellyPct}, the size that grows an account fastest. Near-top growth, but drawdowns get deep enough to make people quit.`
                : risk <= kelly * 2
                  ? `Past the Kelly limit of ${kellyPct}. Growth tops out there, so betting more only deepens the drawdowns.`
                  : `More than double the Kelly limit of ${kellyPct}. The typical account shrinks even with a winning strategy: oversized bets turn an edge into a lottery.`}
        </p>
        <p className="sandbox-note">
          <ShieldCheck size={13} /> Illustrative model with {inr(START)} of virtual money per
          trader. Same random sequence at every setting, so only your choices change the result.
        </p>
      </div>
    </div>
  );
}
