import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  CalendarClock,
  FlaskConical,
  Gauge,
  LineChart,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { EventRunListItem, Profile } from '../../shared/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { studyTracks } from '@/content/study';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Progress, Separator } from '@/components/ui/progress';
import { BentoGrid, BorderBeam, NumberTicker, SpotlightCard } from '@/components/ui/magic';

type Destination = 'study' | 'practice' | 'lab' | 'stats';

// Illustrative shapes only, drawn from the app's own model scenarios.
const HERO_PATH = [
  100, 101, 100.4, 102, 103.5, 102.8, 104.6, 106, 105.1, 107.4, 106.2, 108.9, 110.4, 109.2, 111.8,
  113.5, 112.1, 114.9, 116.2, 115.4, 118.6,
];
const CRASH_PATH = [
  100, 101, 101.5, 102, 101, 99, 96, 92, 88, 82, 77, 74, 76, 79, 82, 85, 88, 90, 92, 94, 95,
];

function AreaSpark({
  values,
  id,
  color = 'var(--primary)',
  className,
}: {
  values: number[];
  id: string;
  color?: string;
  className?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * 300,
    8 + (1 - (v - min) / (max - min || 1)) * 84,
  ]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${line} 300,100`} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TileHead({
  icon: Icon,
  label,
  action,
}: {
  icon: typeof Target;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </span>
      {action}
    </div>
  );
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function PositionCalculator() {
  const [account, setAccount] = useState(100000);
  const [risk, setRisk] = useState(1);
  const [stop, setStop] = useState(5);
  const atRisk = (account * risk) / 100;
  const size = stop > 0 ? atRisk / (stop / 100) : 0;
  const share = account > 0 ? (size / account) * 100 : 0;
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-account">Account ₹</Label>
          <Input
            id="calc-account"
            inputMode="numeric"
            value={account}
            onChange={(e) =>
              setAccount(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-risk">Risk %</Label>
          <Input
            id="calc-risk"
            type="number"
            min={0.1}
            max={10}
            step={0.5}
            value={risk}
            onChange={(e) => setRisk(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-stop">Exit %</Label>
          <Input
            id="calc-stop"
            type="number"
            min={0.5}
            max={50}
            step={0.5}
            value={stop}
            onChange={(e) => setStop(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[11px] text-muted-foreground">Position size</div>
          <div className="font-mono text-lg font-semibold">{inr(size)}</div>
          <div className="text-[11px] text-muted-foreground">{share.toFixed(0)}% of account</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[11px] text-muted-foreground">Planned loss if exit hits</div>
          <div className="font-mono text-lg font-semibold text-loss">−{inr(atRisk)}</div>
          <div className="text-[11px] text-muted-foreground">Gaps can make it larger</div>
        </div>
      </div>
      {share > 100 && (
        <p className="text-[11px] text-warn">
          Bigger than the account: this would need leverage. Widen the exit or lower the risk.
        </p>
      )}
      <p className="mt-auto text-[11px] text-muted-foreground">
        Size = amount at risk ÷ distance to your exit. Illustrative arithmetic, not advice.
      </p>
    </div>
  );
}

export function HomeBento({
  player,
  todayCount,
  countdown,
  busy,
  onStartDaily,
  onNavigate,
  onSignIn,
}: {
  player: Profile | null;
  todayCount: number;
  countdown: string;
  busy: boolean;
  onStartDaily: () => void;
  onNavigate: (to: Destination) => void;
  onSignIn: () => void;
}) {
  const [runs, setRuns] = useState<EventRunListItem[] | null>(null);
  useEffect(() => {
    if (!player) return setRuns(null);
    api<EventRunListItem[]>('/events/runs')
      .then(setRuns)
      .catch(() => setRuns([]));
  }, [player]);
  const studyDone = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem('stonkup.study.done') ?? '[]') as string[]).length;
    } catch {
      return 0;
    }
  }, []);
  const nextTrack = useMemo(() => {
    try {
      const done = JSON.parse(localStorage.getItem('stonkup.study.done') ?? '[]') as string[];
      return studyTracks.find((t) => !done.includes(t.id)) ?? studyTracks[0];
    } catch {
      return studyTracks[0];
    }
  }, []);
  const finished = (runs ?? []).filter((r) => r.done && r.summary).map((r) => r.summary!);
  const avg = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
  const cal = player?.calibration;
  const greeting = player
    ? `Welcome back, ${player.name.split(' ')[0]}`
    : 'Decision training for new traders';

  return (
    <div className="flex flex-col gap-6 pb-4">
      <BentoGrid>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border bg-[radial-gradient(120%_120%_at_0%_0%,#14203f_0%,#0d0f17_45%,#0b0b0e_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(61,123,255,0.55)] md:col-span-4 md:row-span-2 md:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_left,#000_30%,transparent_75%)]"
          />
          <AreaSpark
            values={HERO_PATH}
            id="hero-area"
            className="absolute inset-x-0 bottom-0 h-[45%] w-full opacity-80"
          />
          <BorderBeam size={160} duration={10} />
          <div className="relative flex h-full max-w-xl flex-col gap-5">
            <Badge variant="default" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-gain shadow-[0_0_8px_var(--gain)]" />
              {greeting}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-[3.25rem]">
              Train the decision
              <br />
              <span className="bg-gradient-to-r from-[#7aa2ff] via-[#a78bfa] to-[#7aa2ff] bg-clip-text text-transparent">
                before you risk the money.
              </span>
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Most new traders lose money because nobody trains their process first. Practise on
              model markets, rate how sure you are, and measure the gap between your plan and what
              you actually do.
            </p>
            <div className="mt-auto flex flex-wrap gap-3">
              <Button size="lg" onClick={onStartDaily} disabled={busy}>
                {todayCount === 10
                  ? "See today's results"
                  : todayCount
                    ? "Continue today's challenge"
                    : "Start today's challenge"}
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('lab')}>
                Open the Event Lab <FlaskConical />
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground">
              <span>6 market events</span>
              <span>10 skill tracks</span>
              <span>20 decision scenarios</span>
            </div>
          </div>
        </div>

        {/* Daily challenge */}
        <SpotlightCard className="md:col-span-2">
          <TileHead
            icon={CalendarClock}
            label="Daily challenge"
            action={<span className="font-mono text-xs text-muted-foreground">{countdown}</span>}
          />
          <div className="flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{todayCount}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ 10 decisions today</span>
          </div>
          <Progress value={todayCount * 10} className="mt-4" />
          <p className="mt-3 text-xs text-muted-foreground">
            New set at 05:30 IST. Finish all ten to keep your streak.
          </p>
          <Button
            variant="secondary"
            className="mt-auto w-full"
            onClick={onStartDaily}
            disabled={busy}
          >
            {todayCount === 10 ? 'Review results' : todayCount ? 'Continue' : 'Start'}{' '}
            <ArrowRight />
          </Button>
        </SpotlightCard>

        {/* Calibration */}
        <SpotlightCard className="md:col-span-2">
          <TileHead
            icon={Gauge}
            label="Calibration"
            action={
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => (player ? onNavigate('stats') : onSignIn())}
              >
                Details
              </button>
            }
          />
          {cal && cal.brier !== null ? (
            <>
              <div className="flex items-end gap-2">
                <NumberTicker
                  value={cal.brier}
                  decimals={2}
                  className="text-4xl font-semibold tracking-tight"
                />
                <span className="pb-1 text-sm text-muted-foreground">Brier score</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Lower is better · {cal.count} rated prediction{cal.count === 1 ? '' : 's'}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {cal.buckets.slice(-3).map((b) => (
                  <div
                    key={b.stated}
                    className="grid grid-cols-[52px_1fr_44px] items-center gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">{b.stated}% sure</span>
                    <div className="relative h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-violet"
                        style={{ width: `${b.hitRate}%` }}
                      />
                      <i
                        className="absolute -top-1 h-3.5 w-0.5 bg-primary"
                        style={{ left: `${b.stated}%` }}
                      />
                    </div>
                    <span className="text-right font-mono">{b.hitRate}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Rate how sure you are on every prediction. Over time this shows whether your
                confidence matches your accuracy.
              </p>
              <Button
                variant="secondary"
                className="mt-auto w-full"
                onClick={() => onNavigate('practice')}
              >
                Make a rated prediction <ArrowRight />
              </Button>
            </>
          )}
        </SpotlightCard>

        {/* Event Lab feature */}
        <SpotlightCard className="md:col-span-3">
          <TileHead
            icon={FlaskConical}
            label="Event Lab"
            action={<Badge variant="outline">Model scenario</Badge>}
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Live through the 2020 crash</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Lock a plan, decide every five days as headlines and hype arrive, then see how your
                choices compare with simply holding.
              </p>
            </div>
            <AreaSpark
              values={CRASH_PATH}
              id="crash-area"
              color="var(--loss)"
              className="h-28 w-full"
            />
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <span className="text-xs text-muted-foreground">Six events · blind mode available</span>
            <Button variant="outline" size="sm" onClick={() => onNavigate('lab')}>
              Start a run <ArrowUpRight />
            </Button>
          </div>
        </SpotlightCard>

        {/* Gap tracker */}
        <SpotlightCard className="md:col-span-3">
          <TileHead
            icon={LineChart}
            label="Your gaps"
            action={
              finished.length ? (
                <span className="text-xs text-muted-foreground">
                  {finished.length} run{finished.length === 1 ? '' : 's'}
                </span>
              ) : undefined
            }
          />
          {finished.length ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Process score',
                  value: avg(finished.map((s) => s.processScore)).toFixed(0),
                  tone: 'text-foreground',
                },
                {
                  label: 'Behaviour gap',
                  value: `${avg(finished.map((s) => s.behaviourGap)).toFixed(1)} pts`,
                  tone: avg(finished.map((s) => s.behaviourGap)) < 0 ? 'text-loss' : 'text-gain',
                },
                {
                  label: 'Rules ignored',
                  value: `${finished.filter((s) => s.ruleIgnored).length}/${finished.length}`,
                  tone: 'text-foreground',
                },
                {
                  label: 'Confidence gap',
                  value: `${(avg(finished.map((s) => s.confidence)) - avg(finished.map((s) => (s.hit ? 100 : 0)))).toFixed(0)} pts`,
                  tone: 'text-foreground',
                },
              ].map((g) => (
                <div key={g.label} className="rounded-lg bg-muted/60 p-3">
                  <div className="text-[11px] text-muted-foreground">{g.label}</div>
                  <div className={cn('font-mono text-lg font-semibold', g.tone)}>{g.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Finish an Event Lab run to see your plan, behaviour, benchmark and confidence gaps.
              Process is what you control; results swing with luck.
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-auto self-start px-0 text-primary hover:bg-transparent"
            onClick={() => (player ? onNavigate('stats') : onSignIn())}
          >
            Open Reflect <ArrowRight />
          </Button>
        </SpotlightCard>

        {/* Position size calculator */}
        <SpotlightCard className="md:col-span-2">
          <TileHead icon={Calculator} label="Position size" />
          <PositionCalculator />
        </SpotlightCard>

        {/* Study */}
        <SpotlightCard className="md:col-span-2">
          <TileHead
            icon={BookOpen}
            label="Study"
            action={
              <span className="font-mono text-xs text-muted-foreground">
                {studyDone}/{studyTracks.length}
              </span>
            }
          />
          <Progress value={(studyDone / studyTracks.length) * 100} indicatorClassName="bg-violet" />
          <div className="mt-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Up next
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight">{nextTrack.title}</div>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {nextTrack.summary}
          </p>
          <Button
            variant="secondary"
            className="mt-auto w-full"
            onClick={() => onNavigate('study')}
          >
            Open the lesson <ArrowRight />
          </Button>
        </SpotlightCard>

        {/* Evidence */}
        <SpotlightCard className="md:col-span-2">
          <TileHead icon={ShieldCheck} label="Why train first" />
          <NumberTicker
            value={93}
            suffix="%"
            className="text-5xl font-semibold tracking-tight text-loss"
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            of individual F&amp;O traders in India lost money between FY22 and FY24, averaging about
            ₹2 lakh each.
          </p>
          <Separator className="my-4" />
          <a
            className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            href="https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html"
            target="_blank"
            rel="noreferrer"
          >
            Source: SEBI study, Sept 2024 <ArrowUpRight className="size-3" />
          </a>
        </SpotlightCard>
      </BentoGrid>
      <p className="text-xs text-muted-foreground">
        Stonk Up is for educational purposes only and does not provide financial advice or
        investment recommendations. All markets in the Lab are labelled models.
      </p>
    </div>
  );
}
