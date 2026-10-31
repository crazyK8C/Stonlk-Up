import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  Dices,
  Gauge,
  History,
  PanelRightClose,
  PanelRightOpen,
  Scale,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventLab } from './EventLab';
import { GapTracker } from './GapTracker';
import { MarketLab } from './MarketLab';
import { RiskSandbox } from './RiskSandbox';
import { PositionSizer } from './lab/PositionSizer';
import { RiskOfRuin } from './lab/RiskOfRuin';

const EASE = [0.22, 1, 0.36, 1] as const;
const LAST_KEY = 'stonkup.lab.last';
const TRIES_KEY = 'stonkup.lab.tries';

type InstrumentId = 'sizer' | 'sandbox' | 'ruin' | 'regime' | 'replay' | 'gaps';
type Station = 'Plan' | 'Simulate' | 'Replay' | 'Review';

type Instrument = {
  id: InstrumentId;
  station: Station;
  name: string;
  icon: LucideIcon;
  question: string;
  minutes: number;
  read: string;
  principle: string;
  tries: string[];
};

const STATIONS: { id: Station; n: string; blurb: string }[] = [
  { id: 'Plan', n: '01', blurb: 'Decide size and exits before the market decides for you.' },
  { id: 'Simulate', n: '02', blurb: 'Run a rule thousands of times and see the spread of outcomes.' },
  { id: 'Replay', n: '03', blurb: 'Live through a market event with a locked plan.' },
  { id: 'Review', n: '04', blurb: 'Measure where your process broke, then pick the next drill.' },
];

const INSTRUMENTS: Instrument[] = [
  {
    id: 'sizer',
    station: 'Plan',
    name: 'Position sizer',
    icon: Calculator,
    question: 'How big should this trade be?',
    minutes: 2,
    read: 'Enter your account, the share of it you accept losing, and how far away your exit is. The sizer returns the position that keeps the loss to that amount.',
    principle: 'Size comes from the loss you accept, not from how sure you feel. Amount at risk ÷ distance to exit = position size.',
    tries: [
      'Set risk to 1% and the exit to 5%. Now halve the exit distance. The size doubles: why is a tight exit not automatically safer?',
      'Find the exit distance at which risking 2% would need more money than the account holds.',
      'A friend puts half their account in one stock with a 10% exit. What share of the account are they really risking?',
    ],
  },
  {
    id: 'sandbox',
    station: 'Simulate',
    name: 'Sizing sandbox',
    icon: Scale,
    question: 'Same winning strategy, different bet size. Who survives?',
    minutes: 4,
    read: 'One hundred traders share the exact same wins and losses. Only the bet size changes. Green paths end above ₹1L, red below.',
    principle: 'A strategy with an edge can still ruin you if the bets are too large. The Kelly figure is a ceiling, not a target.',
    tries: [
      'Keep the win rate at 45%. Move risk from 2% to 25% and count how many traders halve their account.',
      'Find the win rate at which the edge is exactly zero. The payoff is 1.5×.',
      'Set risk near the Kelly figure, then at twice Kelly. Compare the median balance.',
    ],
  },
  {
    id: 'ruin',
    station: 'Simulate',
    name: 'Risk of ruin',
    icon: Dices,
    question: 'What are the odds this strategy hits my pain limit?',
    minutes: 4,
    read: 'Describe a strategy by its win rate and payoff, choose a bet size and the drawdown you would quit at. A thousand simulated accounts show the range of outcomes.',
    principle: 'Plan for the 1-in-20 bad run, not the typical one. Ruin odds rise far faster than bet size.',
    tries: [
      'At a 50% win rate and 1.5× payoff, find the largest risk per trade that keeps the chance of a −30% drawdown under 5%.',
      'Drop the win rate by five points. Watch how much the ruin odds move for a small change in edge.',
      'Compare the typical worst drawdown with the 1-in-20 one. Which would you have to sit through?',
    ],
  },
  {
    id: 'regime',
    station: 'Simulate',
    name: 'Regime drill',
    icon: Waves,
    question: 'Same rules, different market. Can you tell them apart?',
    minutes: 3,
    read: 'Explore three model markets, calm bull, choppy sideways and crash with recovery, then guess which one you are looking at from the shape alone.',
    principle: 'Results depend on the market regime as much as on skill. A rule that shines in one regime can bleed in another.',
    tries: [
      'In Explore, compare Crash and Choppy. Which has the worse single day, and which the worse overall result?',
      'Switch to Guess and get three right in a row.',
      'Load Calm bull twice. How different can two runs of the same market be?',
    ],
  },
  {
    id: 'replay',
    station: 'Replay',
    name: 'Event replay',
    icon: History,
    question: 'Can I stick to my plan through a real market event?',
    minutes: 8,
    read: 'Choose an event modelled on market history, lock a plan, then decide at each checkpoint as the chart reveals. The debrief separates your process from the outcome.',
    principle: 'Judge the decision, not the result. A good process with a bad outcome is a bad beat, not a mistake.',
    tries: [
      'Pick a global shock in mystery mode, so you plan without knowing the date.',
      'Run one event twice: once for the index, once for your portfolio mix. Compare the gaps.',
      'Aim for an Earned win or a Bad beat. Both mean you followed your plan.',
    ],
  },
  {
    id: 'gaps',
    station: 'Review',
    name: 'Gap tracker',
    icon: Gauge,
    question: 'Where does my plan break down?',
    minutes: 2,
    read: 'Every finished event replay adds four gaps: plan, behaviour, benchmark and confidence. Over several runs a pattern appears.',
    principle: 'You improve fastest by training the one gap that costs you most, not by trading more.',
    tries: [
      'Finish three event replays, then read the pattern line here.',
      'Find your biggest gap and open the instrument that trains it.',
    ],
  },
];

const NEXT = ['Pre-mortem card & playbook', 'Options payoff builder', 'Challenge mode', 'Correlation lab'];

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the Lab still works, it just forgets */
  }
}

/** Faint graph-paper grid used behind every Lab surface. */
const GRID =
  'bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]';

function Mono({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground', className)}>
      {children}
    </span>
  );
}

function Lobby({
  resume,
  onOpen,
}: {
  resume: Instrument | null;
  onOpen: (id: InstrumentId) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className={cn('relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0c0f]', GRID)}>
        <div className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_65%)]" />
        <div className="relative grid gap-10 p-6 md:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <Mono className="text-cyan">Strategy Lab · Workbench v1</Mono>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-6xl">
              One bench for every
              <br />
              <span className="text-muted-foreground">trading decision.</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Size a trade, simulate it a thousand times, live through market history with a locked plan, then measure exactly
              where your process broke. Every market here is a labelled model. Nothing is a forecast or advice.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onOpen(resume?.id ?? 'sizer')}
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-cyan px-6 text-sm font-semibold text-[#03131c] shadow-[0_0_40px_-8px_rgba(56,189,248,0.6)] transition hover:brightness-110"
              >
                {resume ? `Resume · ${resume.name}` : 'Enter the Lab'}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href="#lab-stations" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                See what's inside
              </a>
            </div>
          </div>

          {/* Workflow schematic */}
          <div className="rounded-xl border border-white/[0.07] bg-black/40 p-5 backdrop-blur">
            <Mono>How a session works</Mono>
            <ol className="mt-4 flex flex-col">
              {[
                ['Pick an instrument', 'Each one answers a single question about your trading.'],
                ['Run the drill', 'Set the inputs, then work through the Try this tasks. Each has a target.'],
                ['Read and measure', 'Results come in rupees. Replays log your gaps for Review.'],
              ].map(([t, d], i) => (
                <li key={t} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < 2 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-white/10" />}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 font-mono text-[11px] text-cyan">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs leading-relaxed text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Stations */}
      <section id="lab-stations" className="grid scroll-mt-24 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATIONS.map((s, si) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: si * 0.07, ease: EASE }}
            className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c0d10] p-5"
          >
            <div className="flex items-baseline justify-between">
              <Mono className="text-cyan">Station {s.n}</Mono>
              <span className="text-lg font-semibold tracking-tight">{s.id}</span>
            </div>
            <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
            <div className="mt-4 flex flex-1 flex-col gap-2">
              {INSTRUMENTS.filter((i) => i.station === s.id).map((ins) => (
                <button
                  key={ins.id}
                  onClick={() => onOpen(ins.id)}
                  className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-cyan/30 hover:bg-cyan/[0.04]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground transition group-hover:text-cyan">
                    <ins.icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2 text-sm font-medium">
                      {ins.name}
                      <span className="font-mono text-[10px] font-normal text-muted-foreground">~{ins.minutes} min</span>
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">{ins.question}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-white/[0.08] px-5 py-4">
        <Mono className="mr-2">On the bench next</Mono>
        {NEXT.map((n) => (
          <span key={n} className="rounded-full border border-white/[0.06] px-3 py-1 text-xs text-muted-foreground">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function Brief({
  ins,
  done,
  onToggle,
}: {
  ins: Instrument;
  done: number[];
  onToggle: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-col gap-2">
        <Mono>How to read it</Mono>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{ins.read}</p>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-cyan/15 bg-cyan/[0.04] p-4">
        <Mono className="text-cyan">Principle</Mono>
        <p className="text-[13px] leading-relaxed">{ins.principle}</p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Mono>Try this</Mono>
          <span className="font-mono text-[10px] text-muted-foreground">
            {done.length}/{ins.tries.length}
          </span>
        </div>
        <ol className="flex flex-col gap-2">
          {ins.tries.map((t, i) => {
            const on = done.includes(i);
            return (
              <li key={i}>
                <button
                  onClick={() => onToggle(i)}
                  aria-pressed={on}
                  className={cn(
                    'flex w-full gap-3 rounded-lg border p-3 text-left text-[13px] leading-relaxed transition',
                    on
                      ? 'border-gain/25 bg-gain/[0.05] text-muted-foreground'
                      : 'border-white/[0.06] hover:border-white/15',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-4 shrink-0 place-items-center rounded border',
                      on ? 'border-gain bg-gain text-black' : 'border-white/25',
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  {t}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Workspace({
  active,
  onOpen,
  onExit,
  renders,
}: {
  active: Instrument;
  onOpen: (id: InstrumentId) => void;
  onExit: () => void;
  renders: Record<InstrumentId, () => ReactNode>;
}) {
  const [briefOpen, setBriefOpen] = useState(true);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[data-active]');
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - 8, behavior: 'smooth' });
  }, [active.id]);
  const [tries, setTries] = useState<Record<string, number[]>>(() => load(TRIES_KEY, {}));
  const toggle = (i: number) =>
    setTries((prev) => {
      const cur = prev[active.id] ?? [];
      const next = { ...prev, [active.id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
      save(TRIES_KEY, next);
      return next;
    });


  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08090b] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
      {/* Bench toolbar */}
      <div className="flex h-12 items-center gap-3 border-b border-white/[0.06] bg-[#0c0d10] px-3">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Lobby
        </button>
        <span className="h-4 w-px bg-white/10" />
        <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">Lab</span>
          <span className="hidden sm:inline">/</span>
          <span className="hidden sm:inline">{active.station}</span>
          <span className="hidden sm:inline">/</span>
          <span className="truncate text-foreground">{active.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-warn/25 bg-warn/[0.06] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn md:inline">
            Model · not a forecast
          </span>
          <button
            onClick={() => setBriefOpen((v) => !v)}
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground lg:inline-flex"
            aria-pressed={briefOpen}
          >
            {briefOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            Brief
          </button>
        </div>
      </div>

      {/* Mobile instrument strip */}
      <div ref={strip} className="relative flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2 lg:hidden">
        {INSTRUMENTS.map((ins) => (
          <button
            key={ins.id}
            data-active={ins.id === active.id || undefined}
            onClick={() => onOpen(ins.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition',
              ins.id === active.id ? 'bg-cyan/10 text-cyan' : 'text-muted-foreground',
            )}
          >
            <ins.icon className="size-3.5" />
            {ins.name}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'grid min-h-[720px]',
          briefOpen ? 'lg:grid-cols-[208px_minmax(0,1fr)_300px]' : 'lg:grid-cols-[208px_minmax(0,1fr)]',
        )}
      >
        {/* Instrument rail */}
        <nav aria-label="Lab instruments" className="hidden flex-col gap-5 border-r border-white/[0.06] bg-[#0b0c0e] p-3 lg:flex">
          {STATIONS.map((s) => (
            <div key={s.id} className="flex flex-col gap-0.5">
              <Mono className="px-2 pb-1.5 text-[9px]">
                {s.n} · {s.id}
              </Mono>
              {INSTRUMENTS.filter((i) => i.station === s.id).map((ins) => {
                const on = ins.id === active.id;
                return (
                  <button
                    key={ins.id}
                    onClick={() => onOpen(ins.id)}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition',
                      on ? 'text-foreground' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground',
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="lab-rail"
                        className="absolute inset-0 rounded-lg border border-cyan/20 bg-cyan/[0.07]"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <ins.icon className={cn('relative size-4', on && 'text-cyan')} />
                    <span className="relative">{ins.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Canvas */}
        <section className={cn('lab-canvas @container min-w-0 p-4 md:p-7', GRID)}>
          <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-col gap-6"
            >
              <header className="flex flex-col gap-2">
                <Mono className="text-cyan">
                  {active.station} · {active.name}
                </Mono>
                <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] md:text-3xl">{active.question}</h2>
              </header>
              {renders[active.id]()}
          </motion.div>
        </section>

        {/* Brief: right panel on desktop, below the canvas on smaller screens */}
        {briefOpen && (
          <aside className="border-t border-white/[0.06] bg-[#0b0c0e] lg:border-l lg:border-t-0">
            <div className="flex h-10 items-center border-b border-white/[0.06] px-5">
              <Mono>Brief</Mono>
            </div>
            <Brief ins={active} done={tries[active.id] ?? []} onToggle={toggle} />
          </aside>
        )}
      </div>
    </div>
  );
}

export function StrategyLab({
  signedIn,
  onNeedAuth,
  onOpenReflect,
}: {
  signedIn: boolean;
  onNeedAuth: () => void;
  onOpenReflect: () => void;
}) {
  const [active, setActive] = useState<InstrumentId | null>(null);
  const [last, setLast] = useState<InstrumentId | null>(() => load<InstrumentId | null>(LAST_KEY, null));
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const open = (id: InstrumentId) => {
    setActive(id);
    setLast(id);
    save(LAST_KEY, id);
  };
  const renders: Record<InstrumentId, () => ReactNode> = {
    sizer: () => (
      <div className="max-w-2xl rounded-xl border border-white/[0.06] bg-[#0c0d10] p-5">
        <PositionSizer />
      </div>
    ),
    sandbox: () => <RiskSandbox />,
    ruin: () => <RiskOfRuin />,
    regime: () => <MarketLab />,
    replay: () => <EventLab signedIn={signedIn} onNeedAuth={onNeedAuth} onOpenReflect={onOpenReflect} />,
    gaps: () => <GapTracker onOpenLab={() => open('replay')} />,
  };
  const current = INSTRUMENTS.find((i) => i.id === active);
  const resume = INSTRUMENTS.find((i) => i.id === last) ?? null;

  // Swaps are immediate with an entrance animation only, so switching never waits on
  // an exit animation (which stalls in background tabs).
  return current ? (
    <motion.div
      key="bench"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <Workspace active={current} onOpen={open} onExit={() => setActive(null)} renders={renders} />
    </motion.div>
  ) : (
    <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Lobby resume={resume} onOpen={open} />
    </motion.div>
  );
}
