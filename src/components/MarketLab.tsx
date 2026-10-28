import { useEffect, useState } from 'react';
import { Dices, Eye, ShieldCheck } from 'lucide-react';
import type { MarketPath, MarketPreset } from '../../shared/types';
import { api } from '../lib/api';

const PRESETS: { id: MarketPreset; label: string; hint: string }[] = [
  { id: 'calm', label: 'Calm bull', hint: 'Steady upward drift, small dips' },
  { id: 'choppy', label: 'Choppy sideways', hint: 'Big swings that go nowhere' },
  { id: 'crash', label: 'Crash + recovery', hint: 'A sharp fall, then a slow climb' },
];

const randomSeed = () => 1 + Math.floor(Math.random() * 2147483646);

function MarketChart({ market, showRegimes }: { market: MarketPath; showRegimes: boolean }) {
  const { prices, regimes } = market;
  const min = Math.min(...prices) * 0.97;
  const max = Math.max(...prices) * 1.03;
  const x = (i: number) => 40 + (i / (prices.length - 1)) * 650;
  const y = (v: number) => 12 + (1 - (v - min) / (max - min)) * 228;
  // Contiguous bear stretches become shaded bands.
  const bands: { from: number; to: number }[] = [];
  regimes.forEach((r, i) => {
    if (r !== 'bear') return;
    const last = bands.at(-1);
    if (last && last.to === i - 1) last.to = i;
    else bands.push({ from: i, to: i });
  });
  const ticks = [min, (min + max) / 2, max];
  return (
    <svg
      viewBox="0 0 700 270"
      className="market-chart"
      role="img"
      aria-label={`Synthetic price path over ${prices.length - 1} trading days, starting at 100 and ending at ${prices.at(-1)}`}
    >
      {showRegimes &&
        bands.map((b) => (
          <rect
            key={b.from}
            x={x(b.from)}
            y={10}
            width={Math.max(2, x(b.to) - x(b.from))}
            height={232}
            className="market-bear"
          />
        ))}
      {ticks.map((t) => (
        <g key={t}>
          <line x1="40" x2="690" y1={y(t)} y2={y(t)} className="sandbox-grid" />
          <text x="34" y={y(t) + 4} textAnchor="end" className="sandbox-axis">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <line x1="40" x2="690" y1={y(100)} y2={y(100)} className="sandbox-start" />
      <polyline
        points={prices.map((p, i) => `${x(i)},${y(p).toFixed(1)}`).join(' ')}
        className="market-line"
      />
      <text x="40" y="262" className="sandbox-axis">
        Day 0
      </text>
      <text x="690" y="262" textAnchor="end" className="sandbox-axis">
        Day {prices.length - 1}
      </text>
    </svg>
  );
}

function Stats({ market }: { market: MarketPath }) {
  const s = market.stats;
  return (
    <div className="sandbox-stats market-stats">
      <div className={s.totalReturn < 0 ? 'warn' : ''}>
        <strong>
          {s.totalReturn > 0 ? '+' : ''}
          {s.totalReturn}%
        </strong>
        <span>Total return</span>
      </div>
      <div className="warn">
        <strong>−{s.maxDrawdown}%</strong>
        <span>Worst fall from a peak</span>
      </div>
      <div>
        <strong>{s.annualVolatility}%</strong>
        <span>Volatility (yearly)</span>
      </div>
      <div className="warn">
        <strong>{s.worstDay}%</strong>
        <span>Worst single day</span>
      </div>
    </div>
  );
}

export function MarketLab() {
  const [tab, setTab] = useState<'explore' | 'guess'>('explore');
  const [preset, setPreset] = useState<MarketPreset>('crash');
  const [market, setMarket] = useState<MarketPath | null>(null);
  const [guess, setGuess] = useState<MarketPreset | null>(null);
  const [score, setScore] = useState({ right: 0, played: 0 });
  const [error, setError] = useState('');

  async function load(p: MarketPreset) {
    setError('');
    setGuess(null);
    try {
      setMarket(await api<MarketPath>(`/lab/market?preset=${p}&seed=${randomSeed()}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load(tab === 'explore' ? preset : PRESETS[Math.floor(Math.random() * 3)].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const revealed = tab === 'explore' || guess !== null;
  return (
    <section className="market-lab content-panel">
      <div className="section-heading compact">
        <h3>
          Drill 2 · Same rules, different luck
          <span>A MODEL MARKET, NOT REAL PRICES</span>
        </h3>
        <div className="sandbox-seg" role="tablist" aria-label="Market drill mode">
          <button
            role="tab"
            aria-selected={tab === 'explore'}
            className={tab === 'explore' ? 'selected' : ''}
            onClick={() => setTab('explore')}
          >
            Explore
          </button>
          <button
            role="tab"
            aria-selected={tab === 'guess'}
            className={tab === 'guess' ? 'selected' : ''}
            onClick={() => setTab('guess')}
          >
            Guess the market
          </button>
        </div>
      </div>
      {tab === 'explore' ? (
        <p className="market-intro">
          Each preset has fixed rules: trend, volatility, how often shocks hit and how long bad
          stretches last. Press <strong>New path</strong> to replay the same rules with new luck.
          Bear stretches are shaded.
        </p>
      ) : (
        <p className="market-intro">
          Which rules made this chart? Reading the regime you're in is half of risk management.
          Score: <strong>{score.right}</strong> of {score.played}.
        </p>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {market && <MarketChart market={market} showRegimes={revealed} />}
      {tab === 'explore' ? (
        <div className="market-controls">
          <div className="sandbox-seg" role="group" aria-label="Market preset">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                aria-pressed={preset === p.id}
                className={preset === p.id ? 'selected' : ''}
                onClick={() => {
                  setPreset(p.id);
                  load(p.id);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={() => load(preset)}>
            New path <Dices size={17} />
          </button>
        </div>
      ) : (
        <div className="market-controls">
          <div className="sandbox-seg" role="group" aria-label="Your guess">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                disabled={guess !== null}
                aria-pressed={guess === p.id}
                className={
                  guess === null
                    ? ''
                    : p.id === market?.preset
                      ? 'selected'
                      : guess === p.id
                        ? 'wrong'
                        : ''
                }
                onClick={() => {
                  setGuess(p.id);
                  setScore((s) => ({
                    right: s.right + (p.id === market?.preset ? 1 : 0),
                    played: s.played + 1,
                  }));
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {guess !== null && (
            <button
              className="primary-btn"
              onClick={() => load(PRESETS[Math.floor(Math.random() * 3)].id)}
            >
              Next chart <Eye size={17} />
            </button>
          )}
        </div>
      )}
      {market && revealed && (
        <>
          {tab === 'guess' && (
            <p className="sandbox-verdict" role="status">
              {guess === market.preset ? 'Right, this was a ' : 'Not quite. This was a '}
              <strong>{market.label.toLowerCase()}</strong>.{' '}
              {PRESETS.find((p) => p.id === market.preset)?.hint}.
            </p>
          )}
          <Stats market={market} />
        </>
      )}
      <p className="sandbox-note">
        <ShieldCheck size={13} /> Built from a random walk with sudden jumps, volatility that
        clusters, and switches between bull, sideways and bear regimes. Seed {market?.seed ?? '…'}
        replays this exact path.
      </p>
    </section>
  );
}
