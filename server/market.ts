// Synthetic markets for the Strategy Lab. Every path is a labelled model, never real prices.
// Layers: geometric Brownian motion + Merton jumps + GARCH(1,1) volatility clustering
// + Markov regime switching (bull / sideways / bear). Seeded so any run can be replayed.
import type { MarketPath, MarketPreset, MarketRegime } from '../shared/types.js';

interface RegimeParams {
  drift: number; // mean daily log return
  vol: number; // long-run daily volatility
  jumpChance: number; // probability of a jump on any day
  jumpMean: number;
  jumpSd: number;
}
interface PresetParams {
  label: string;
  start: MarketRegime;
  regimes: Record<MarketRegime, RegimeParams>;
  // Daily probability of leaving each regime, and where it goes.
  switches: Record<MarketRegime, Partial<Record<MarketRegime, number>>>;
  // Optional scripted window that forces a regime (the crash in "crash and recover").
  script?: { from: number; to: number; regime: MarketRegime };
}

const bull = (vol: number): RegimeParams => ({
  drift: 0.0006,
  vol,
  jumpChance: 0.004,
  jumpMean: -0.02,
  jumpSd: 0.015,
});
const sideways = (vol: number): RegimeParams => ({
  drift: 0,
  vol,
  jumpChance: 0.008,
  jumpMean: -0.01,
  jumpSd: 0.02,
});
const bear = (vol: number): RegimeParams => ({
  drift: -0.0025,
  vol,
  jumpChance: 0.03,
  jumpMean: -0.035,
  jumpSd: 0.03,
});

export const presets: Record<MarketPreset, PresetParams> = {
  calm: {
    label: 'Calm bull market',
    start: 'bull',
    regimes: { bull: bull(0.007), sideways: sideways(0.008), bear: bear(0.014) },
    switches: { bull: { sideways: 0.01 }, sideways: { bull: 0.05 }, bear: { bull: 0.1 } },
  },
  choppy: {
    label: 'Choppy sideways market',
    start: 'sideways',
    regimes: {
      bull: bull(0.012),
      // Small positive drift offsets volatility drag so the typical path ends near flat.
      sideways: { drift: 0.00025, vol: 0.016, jumpChance: 0.008, jumpMean: 0, jumpSd: 0.025 },
      bear: bear(0.02),
    },
    switches: {
      bull: { sideways: 0.06 },
      sideways: { bull: 0.015, bear: 0.015 },
      bear: { sideways: 0.1 },
    },
  },
  crash: {
    label: 'Crash and recovery',
    start: 'bull',
    regimes: {
      bull: { ...bull(0.009), drift: 0.0012 },
      sideways: sideways(0.014),
      bear: { drift: -0.014, vol: 0.03, jumpChance: 0.06, jumpMean: -0.03, jumpSd: 0.025 },
    },
    switches: { bull: {}, sideways: { bull: 0.1 }, bear: { sideways: 0.06 } },
    script: { from: 60, to: 85, regime: 'bear' },
  },
};

// mulberry32: tiny, fast, good enough for teaching simulations.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(rand: () => number) {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const ALPHA = 0.08; // GARCH reaction to yesterday's shock
const BETA = 0.88; // GARCH persistence

export function generateMarket(preset: MarketPreset, seed: number, days = 250): MarketPath {
  const p = presets[preset];
  const rand = rng(seed);
  let regime: MarketRegime = p.start;
  let variance = p.regimes[regime].vol ** 2;
  let shock = 0;
  let price = 100;
  const prices = [price];
  const regimes: MarketRegime[] = [regime];
  for (let day = 1; day <= days; day++) {
    if (p.script && day >= p.script.from && day < p.script.to) regime = p.script.regime;
    else if (p.script && day === p.script.to) regime = 'sideways';
    else {
      const r = rand();
      let acc = 0;
      for (const [next, chance] of Object.entries(p.switches[regime]) as [MarketRegime, number][]) {
        acc += chance;
        if (r < acc) {
          regime = next;
          break;
        }
      }
    }
    const params = p.regimes[regime];
    const omega = params.vol ** 2 * (1 - ALPHA - BETA);
    variance = omega + ALPHA * shock ** 2 + BETA * variance;
    const sigma = Math.sqrt(variance);
    shock = sigma * normal(rand);
    const jump = rand() < params.jumpChance ? params.jumpMean + params.jumpSd * normal(rand) : 0;
    price *= Math.exp(params.drift - variance / 2 + shock + jump);
    prices.push(Math.round(price * 100) / 100);
    regimes.push(regime);
  }
  return { preset, label: p.label, seed, prices, regimes, stats: marketStats(prices) };
}

export function marketStats(prices: number[]) {
  let peak = prices[0];
  let maxDrawdown = 0;
  let worstDay = 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    peak = Math.max(peak, prices[i]);
    maxDrawdown = Math.max(maxDrawdown, 1 - prices[i] / peak);
    const r = prices[i] / prices[i - 1] - 1;
    returns.push(r);
    worstDay = Math.min(worstDay, r);
  }
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const sd = Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length);
  const pct = (v: number) => Math.round(v * 1000) / 10;
  return {
    totalReturn: pct(prices.at(-1)! / prices[0] - 1),
    maxDrawdown: pct(maxDrawdown),
    annualVolatility: pct(sd * Math.sqrt(252)),
    worstDay: pct(worstDay),
  };
}
