// Event Lab: model scenarios shaped like real market episodes. Prices are synthetic and
// labelled as such; headlines paraphrase what was publicly reported at the time.
import { rng } from './market.js';
import type {
  EventAction,
  EventCard,
  EventMix,
  EventNews,
  EventPlan,
  EventSubject,
  RunSummary,
  RunVerdict,
} from '../shared/types.js';

export const TOTAL_DAYS = 40;
export const CHECKPOINT_EVERY = 5;

interface Phase {
  until: number; // phase covers days before this one
  drift: number; // daily log drift
  vol: number;
  jumpChance?: number;
  jumpMean?: number;
}
interface EventSpec extends EventCard {
  notKnowable: string;
  phases: Phase[];
  shocks?: { day: number; move: number }[];
  news: EventNews[];
}

const sharedSubjects: EventSubject[] = ['index', 'mix'];

export const events: EventSpec[] = [
  {
    id: 'covid-2020',
    shelf: 'global',
    name: 'COVID crash and rebound',
    when: 'Feb–Aug 2020',
    blurb: 'A new virus spreads while markets sit near record highs.',
    knownThen:
      'Reports of a new virus spreading abroad. Markets are near record highs and few expect lockdowns.',
    notKnowable:
      'How large and fast the rate cuts and relief packages would be, or that the low would come within weeks.',
    skill: 'Drawdowns',
    subjects: sharedSubjects,
    phases: [
      { until: 10, drift: 0.002, vol: 0.007 },
      { until: 23, drift: -0.026, vol: 0.03, jumpChance: 0.15, jumpMean: -0.03 },
      { until: 41, drift: 0.016, vol: 0.02 },
    ],
    news: [
      {
        day: 0,
        kind: 'news',
        text: 'Markets are near record highs. Analysts are upbeat about the year.',
      },
      { day: 4, kind: 'news', text: 'Reports of a new illness spreading in several countries.' },
      { day: 9, kind: 'news', text: 'Travel restrictions widen. Airlines cut routes.' },
      {
        day: 11,
        kind: 'hype',
        text: '@quickmoneyguru: "SELL EVERYTHING NOW. This is 2008 all over again."',
      },
      { day: 14, kind: 'news', text: 'Worst week for stocks in years. Volatility spikes.' },
      { day: 19, kind: 'news', text: 'Central banks announce emergency rate cuts.' },
      { day: 24, kind: 'news', text: 'Governments announce large relief packages.' },
      {
        day: 27,
        kind: 'hype',
        text: '@rocketcalls: "Missed the bottom? Go all in before it\'s too late!"',
      },
      {
        day: 32,
        kind: 'news',
        text: 'Markets bounce well off their lows. Economists debate the shape of the recovery.',
      },
    ],
  },
  {
    id: 'lehman-2008',
    shelf: 'global',
    name: 'Lehman collapse',
    when: 'Sep–Nov 2008',
    blurb: 'A big US investment bank is in trouble. Will someone rescue it?',
    knownThen:
      'Housing losses are spreading through banks. A major investment bank is struggling and rescue talks are under way.',
    notKnowable:
      'Whether a rescue would come, how far funding markets would freeze, and how long the slump would last.',
    skill: 'Contagion',
    subjects: sharedSubjects,
    phases: [
      { until: 8, drift: -0.004, vol: 0.015 },
      { until: 30, drift: -0.018, vol: 0.035, jumpChance: 0.12, jumpMean: -0.04 },
      { until: 41, drift: 0.004, vol: 0.03 },
    ],
    news: [
      { day: 0, kind: 'news', text: 'Bank shares slide as housing-related losses mount.' },
      {
        day: 6,
        kind: 'news',
        text: 'Weekend rescue talks for a major investment bank are under way.',
      },
      { day: 8, kind: 'news', text: 'Rescue talks fail. The bank files for bankruptcy.' },
      { day: 10, kind: 'news', text: 'A giant insurer receives an emergency government loan.' },
      {
        day: 13,
        kind: 'hype',
        text: '@doomtrader: "Banks are finished. Cash under the mattress, now."',
      },
      { day: 16, kind: 'news', text: 'Lawmakers debate a large bank rescue package.' },
      { day: 22, kind: 'news', text: 'Central banks cut rates in a coordinated move.' },
      {
        day: 30,
        kind: 'hype',
        text: '@valuehunter99: "Everything is on sale. Load up with leverage!"',
      },
      {
        day: 34,
        kind: 'news',
        text: 'Volatility stays extreme. Economists warn of a deep recession.',
      },
    ],
  },
  {
    id: 'hikes-2022',
    shelf: 'global',
    name: 'The rate-hike year',
    when: '2022',
    blurb: 'Inflation is high and central banks signal faster hikes.',
    knownThen:
      'Inflation is the highest in decades. Central banks say rates will rise, but not how fast.',
    notKnowable: 'How many hikes would come, and how long inflation would stay high.',
    skill: 'Market regimes',
    subjects: sharedSubjects,
    phases: [
      { until: 15, drift: -0.006, vol: 0.016 },
      { until: 22, drift: 0.01, vol: 0.014 },
      { until: 41, drift: -0.006, vol: 0.018 },
    ],
    news: [
      { day: 0, kind: 'news', text: 'Inflation hits a multi-decade high.' },
      { day: 7, kind: 'news', text: 'The central bank raises rates and signals more to come.' },
      { day: 13, kind: 'news', text: 'A 0.75-point hike, the biggest in decades.' },
      {
        day: 17,
        kind: 'hype',
        text: '@bottomcaller: "The bear market is OVER. Back up the truck!"',
      },
      {
        day: 24,
        kind: 'news',
        text: 'Officials say they will keep raising rates until inflation falls.',
      },
      { day: 31, kind: 'news', text: 'Bonds and stocks fall together, an unusual combination.' },
    ],
  },
  {
    id: 'brexit-2016',
    shelf: 'global',
    name: 'Brexit vote',
    when: 'June 2016',
    blurb: 'The polls are close. The result comes in overnight.',
    knownThen: 'Polls are close and betting markets lean toward Remain. Results arrive overnight.',
    notKnowable: 'The result itself, and that markets would recover within weeks.',
    skill: 'Surprises',
    subjects: sharedSubjects,
    phases: [
      { until: 10, drift: 0.001, vol: 0.007 },
      { until: 14, drift: -0.008, vol: 0.02 },
      { until: 41, drift: 0.005, vol: 0.01 },
    ],
    shocks: [{ day: 10, move: -0.075 }],
    news: [
      {
        day: 0,
        kind: 'news',
        text: 'Polls show a close race in the referendum on leaving the EU.',
      },
      { day: 7, kind: 'news', text: 'Betting markets lean toward Remain on the eve of the vote.' },
      { day: 10, kind: 'news', text: 'The UK votes to leave. The pound plunges overnight.' },
      { day: 11, kind: 'news', text: 'The prime minister announces his resignation.' },
      { day: 12, kind: 'hype', text: '@euroexit: "Europe is next. Short everything!"' },
      { day: 20, kind: 'news', text: 'The central bank signals support. Markets steady.' },
    ],
  },
  {
    id: 'meme-mania',
    shelf: 'crowd',
    name: 'Meme-stock mania',
    when: 'A hype cycle',
    blurb: 'A heavily shorted stock is trending everywhere.',
    knownThen: 'Your feed is full of screenshots of huge gains. The stock has already doubled.',
    notKnowable:
      'When the crowd would lose interest, and how far the price would fall when it did.',
    skill: 'FOMO and herding',
    subjects: ['stock'],
    phases: [
      { until: 12, drift: 0.06, vol: 0.07 },
      { until: 16, drift: 0.02, vol: 0.12 },
      { until: 30, drift: -0.06, vol: 0.08 },
      { until: 41, drift: -0.005, vol: 0.05 },
    ],
    news: [
      { day: 0, kind: 'news', text: 'A heavily shorted stock jumps on heavy retail buying.' },
      { day: 4, kind: 'hype', text: '@diamondpaws: "We\'re going to the MOON. Never selling."' },
      {
        day: 9,
        kind: 'news',
        text: 'Trading volume hits records. Some brokers raise margin requirements.',
      },
      { day: 13, kind: 'hype', text: '@rocketcalls: "Last chance before it 10x\'s again!"' },
      { day: 17, kind: 'news', text: 'Some brokers restrict buying. The price swings wildly.' },
      { day: 24, kind: 'hype', text: '@diamondpaws: "Just a dip. Buy more!"' },
      { day: 30, kind: 'news', text: 'Attention fades as the next trending stock takes over.' },
    ],
  },
  {
    id: 'ipo-frenzy',
    shelf: 'crowd',
    name: 'IPO listing frenzy',
    when: 'Listing month',
    blurb: 'A hyped IPO lists after heavy oversubscription.',
    knownThen:
      'The issue was oversubscribed many times over. It listed well above its offer price.',
    notKnowable: 'Whether the listing price already included years of optimism.',
    skill: 'Valuation',
    subjects: ['stock'],
    phases: [
      { until: 6, drift: 0.015, vol: 0.05 },
      { until: 41, drift: -0.014, vol: 0.035 },
    ],
    news: [
      { day: 0, kind: 'news', text: 'The stock lists far above its offer price on day one.' },
      { day: 3, kind: 'hype', text: '@ipoking: "Next 10-bagger. Grab it before institutions do!"' },
      {
        day: 8,
        kind: 'news',
        text: 'Analysts start coverage. Several call the valuation stretched.',
      },
      { day: 18, kind: 'news', text: 'The first quarterly results disappoint.' },
      {
        day: 28,
        kind: 'news',
        text: 'The lock-up for early investors ends. More shares hit the market.',
      },
    ],
  },
];

export const eventCards: EventCard[] = events.map(
  ({ id, shelf, name, when, blurb, knownThen, skill, subjects }) => ({
    id,
    shelf,
    name,
    when,
    blurb,
    knownThen,
    skill,
    subjects,
  }),
);
export const findEvent = (id: string) => events.find((e) => e.id === id);

function normal(rand: () => number) {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}
function walk(rand: () => number, step: (day: number) => number) {
  const out = [100];
  for (let d = 1; d <= TOTAL_DAYS; d++) out.push(out[d - 1] * Math.exp(step(d)));
  return out.map((v) => Math.round(v * 100) / 100);
}

/** All price paths for one run. Deterministic in the seed, so nothing needs storing. */
export function scenario(spec: EventSpec, seed: number, mix: EventMix | null) {
  const rand = rng(seed);
  const equity = walk(rand, (d) => {
    const p = spec.phases.find((ph) => d < ph.until) ?? spec.phases.at(-1)!;
    const jump = rand() < (p.jumpChance ?? 0) ? (p.jumpMean ?? 0) * (0.5 + rand()) : 0;
    const shock = spec.shocks?.find((s) => s.day === d)?.move ?? 0;
    return p.drift - p.vol ** 2 / 2 + p.vol * normal(rand) + jump + shock;
  });
  const debt = walk(rand, () => 0.00025 + 0.002 * normal(rand));
  const gold = walk(rand, () => 0.0004 + 0.009 * normal(rand));
  const total = mix ? mix.equity + mix.debt + mix.gold : 1;
  const mixed = mix
    ? equity.map((e, i) => {
        const v = (mix.equity * e + mix.debt * debt[i] + mix.gold * gold[i]) / total;
        return Math.round(v * 100) / 100;
      })
    : null;
  return { equity, subject: mixed ?? equity, benchmark: mixed ? equity : null };
}

const ADD_STEP = 0.1;
const MAX_INVESTED = 1.5;

/** Replays decisions over the subject path. Returns your holding's value for each day. */
export function replay(
  subject: number[],
  decisions: { day: number; action: EventAction }[],
  upTo: number,
) {
  let invested = 1;
  const values = [100];
  for (let d = 1; d <= upTo; d++) {
    const decision = decisions.find((x) => x.day === d - 1);
    if (decision) invested = nextInvested(invested, decision.action);
    values.push(values[d - 1] * (1 + invested * (subject[d] / subject[d - 1] - 1)));
  }
  const last = decisions.find((x) => x.day === upTo);
  return {
    values: values.map((v) => Math.round(v * 100) / 100),
    invested: last ? nextInvested(invested, last.action) : invested,
    investedBefore: invested,
  };
}
export function nextInvested(invested: number, action: EventAction) {
  if (action === 'trim') return invested * 0.75;
  if (action === 'add') return Math.min(invested + ADD_STEP, MAX_INVESTED);
  if (action === 'exit') return 0;
  return invested;
}

/** First day the holding's fall from its peak reached the exit rule while invested. */
export function triggerDay(
  values: number[],
  decisions: { day: number; action: EventAction }[],
  plan: EventPlan,
) {
  if (plan.exitDrawdown === null) return null;
  let peak = values[0];
  let invested = 1;
  for (let d = 0; d < values.length; d++) {
    const decision = decisions.find((x) => x.day === d);
    peak = Math.max(peak, values[d]);
    if (invested > 0 && (1 - values[d] / peak) * 100 >= plan.exitDrawdown) return d;
    if (decision) invested = nextInvested(invested, decision.action);
  }
  return null;
}

function maxDrawdown(path: number[]) {
  let peak = path[0];
  let worst = 0;
  for (const v of path) {
    peak = Math.max(peak, v);
    worst = Math.max(worst, 1 - v / peak);
  }
  return Math.round(worst * 1000) / 10;
}

export function summarise(
  spec: EventSpec,
  subject: number[],
  benchmark: number[] | null,
  values: number[],
  decisions: { day: number; action: EventAction }[],
  plan: EventPlan,
): RunSummary {
  const tags = new Set<string>();
  let score = 100;
  const trigger = triggerDay(values, decisions, plan);
  let checkpointsLate: number | null = null;
  let ruleIgnored = false;
  if (trigger !== null) {
    const firstChance = Math.ceil(trigger / CHECKPOINT_EVERY) * CHECKPOINT_EVERY;
    const exit = decisions.find((d) => d.day >= firstChance && d.action === 'exit');
    if (exit) {
      checkpointsLate = (exit.day - firstChance) / CHECKPOINT_EVERY;
      score -= 10 * checkpointsLate;
      if (checkpointsLate > 0) tags.add('Late on your own exit rule');
    } else if (firstChance < TOTAL_DAYS) {
      ruleIgnored = true;
      score -= 30;
      tags.add('Ignored your exit rule');
    }
  }
  let adds = 0;
  for (const d of decisions) {
    if (d.action === 'add') {
      adds++;
      if (plan.addRule === 'never' || (plan.addRule === 'once' && adds > 1)) {
        score -= 15;
        tags.add('Broke your add rule');
      }
    }
    // Trading straight after a hype post, with no rule telling you to, is a pressure reaction.
    const hype = spec.news.some(
      (n) => n.kind === 'hype' && n.day > d.day - CHECKPOINT_EVERY && n.day <= d.day,
    );
    const ruleSaysExit = trigger !== null && d.action === 'exit' && d.day >= trigger;
    if (hype && d.action !== 'hold' && !ruleSaysExit) {
      score -= 10;
      tags.add('Traded right after a hype post');
    }
  }
  if (plan.thesis.trim().length < 10) {
    score -= 10;
    tags.add('No written thesis');
  }
  const processScore = Math.max(0, Math.min(100, score));
  const outcome = Math.round((values.at(-1)! - 100) * 10) / 10;
  const holdOutcome = Math.round((subject.at(-1)! - 100) * 10) / 10;
  const hit = values.at(-1)! > 100;
  const verdict: RunVerdict =
    processScore >= 70 ? (hit ? 'earned-win' : 'bad-beat') : hit ? 'dumb-luck' : 'deserved-loss';
  return {
    processScore,
    outcome,
    holdOutcome,
    behaviourGap: Math.round((values.at(-1)! - subject.at(-1)!) * 10) / 10,
    checkpointsLate,
    ruleIgnored,
    subjectDrawdown: maxDrawdown(subject),
    benchmarkDrawdown: benchmark ? maxDrawdown(benchmark) : null,
    confidence: plan.confidence,
    hit,
    brier: Math.round((plan.confidence / 100 - (hit ? 1 : 0)) ** 2 * 1000) / 1000,
    verdict,
    tags: [...tags],
  };
}
