import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Flame,
  Zap,
  Coins,
  Target,
  BookOpen,
  BarChart3,
  ChevronRight,
  Check,
  Lock,
  X,
  Clock3,
  Infinity,
  Sparkles,
  LogOut,
  Menu,
  ShieldCheck,
  ExternalLink,
  CircleHelp,
  Play,
  Trophy,
  CheckCircle2,
  FlaskConical,
  House,
} from 'lucide-react';
import type { Profile, Question, Reveal, Difficulty, Mode, Attempt } from '../shared/types';
import { confidenceLevels, levels } from '../shared/types';
import './index.css';
import { api } from './lib/api';
import { MiniChart } from './components/GameArt';
import { HomeBento } from './components/HomeBento';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoMark, Wordmark } from './components/Logo';
import { Splash, SPLASH_KEY } from './components/Splash';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { RiskSandbox } from './components/RiskSandbox';
import { MarketLab } from './components/MarketLab';
import { StudyLuxe } from './components/StudyLuxe';
import { EventLab } from './components/EventLab';
import { GapTracker } from './components/GapTracker';
type View = 'play' | 'study' | 'practice' | 'lab' | 'stats' | 'guide';
type Daily = {
  day: string;
  resetAt: string;
  questions: Question[];
  completed: Attempt[];
  tickets: Record<string, string>;
};
function App() {
  const [view, setView] = useState<View>('play'),
    [player, setPlayer] = useState<Profile | null>(null),
    [boot, setBoot] = useState(true),
    [auth, setAuth] = useState(false),
    [authMode, setAuthMode] = useState<'register' | 'login'>('register'),
    [authBusy, setAuthBusy] = useState(false),
    [adult, setAdult] = useState(false),
    [error, setError] = useState(''),
    [mode, setMode] = useState<Mode | null>(null),
    [difficulty, setDifficulty] = useState<Difficulty>('Beginner'),
    [category, setCategory] = useState<string | null>(null),
    [daily, setDaily] = useState<Daily | null>(null),
    [question, setQuestion] = useState<Question | null>(null),
    [ticket, setTicket] = useState(''),
    [selected, setSelected] = useState<string | null>(null),
    [confidence, setConfidence] = useState<number | null>(null),
    [reveal, setReveal] = useState<Reveal | null>(null),
    [busy, setBusy] = useState(false),
    [complete, setComplete] = useState(false),
    [pending, setPending] = useState<Mode | null>(null),
    [time, setTime] = useState(Date.now()),
    [storage, setStorage] = useState(''),
    [historyFilter, setHistoryFilter] = useState('All'),
    [statsDimension, setStatsDimension] = useState<'category' | 'difficulty'>('category'),
    [splash, setSplash] = useState(() => {
      try {
        return sessionStorage.getItem(SPLASH_KEY) !== '1';
      } catch {
        return true;
      }
    }),
    finishSplash = useCallback(() => {
      setSplash(false);
      try {
        sessionStorage.setItem(SPLASH_KEY, '1');
      } catch {
        /* storage unavailable: the intro may replay next visit */
      }
    }, []);
  useEffect(() => {
    api<{ storage: string }>('/health')
      .then((v) => setStorage(v.storage))
      .catch(() => {});
    api<Profile>('/user/profile')
      .then(setPlayer)
      .catch(() => {})
      .finally(() => setBoot(false));
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view, mode, question?.id]);
  useEffect(() => {
    if (reveal)
      document.getElementById('answer-reveal')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
  }, [reveal]);
  useEffect(() => {
    if (!auth) return;
    const prior = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.auth-modal');
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuth(false);
        setPending(null);
        setError('');
      }
      if (event.key === 'Tab') {
        const items = Array.from(
          dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]') ?? [],
        );
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      prior?.focus();
    };
  }, [auth]);
  async function loadRound(
    nextMode: Mode,
    user = player,
    filter?: { difficulty?: Difficulty; category?: string | null },
  ) {
    const roundDifficulty = filter?.difficulty ?? difficulty;
    const roundCategory = filter && 'category' in filter ? filter.category : category;
    if (filter?.difficulty) setDifficulty(filter.difficulty);
    if (filter && 'category' in filter) setCategory(filter.category ?? null);
    if (!user) {
      setPending(nextMode);
      setAuth(true);
      return;
    }
    setBusy(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setQuestion(null);
    setMode(nextMode);
    setSelected(null);
    setConfidence(null);
    setReveal(null);
    setComplete(false);
    try {
      if (nextMode === 'daily') {
        const d = await api<Daily>('/questions/daily');
        setDaily(d);
        const q = d.questions.find((q) => !d.completed.some((a) => a.questionId === q.id));
        if (q) {
          setQuestion(q);
          setTicket(d.tickets[q.id]);
        } else {
          setComplete(true);
          setQuestion(null);
        }
      } else {
        const r = await api<{ question: Question; ticket: string }>(
          '/questions/unlimited?' +
            (roundCategory
              ? 'category=' + encodeURIComponent(roundCategory)
              : 'difficulty=' + roundDifficulty),
        );
        setQuestion(r.question);
        setTicket(r.ticket);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const user = await api<Profile>('/auth/' + authMode, {
        name: form.get('name') || undefined,
        email: form.get('email'),
        password: form.get('password'),
        adult: authMode === 'register' ? adult : undefined,
      });
      setPlayer(user);
      setAuth(false);
      if (pending) await loadRound(pending, user);
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function guest() {
    setAuthBusy(true);
    setError('');
    try {
      const u = await api<Profile>('/auth/guest', { adult });
      setPlayer(u);
      setAuth(false);
      if (pending) await loadRound(pending, u);
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function submit() {
    if (!question || selected === null || confidence === null || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<Reveal>('/questions/' + question.id + '/answer', {
        optionId: selected,
        ticket,
        confidence,
      });
      setReveal(r);
      setPlayer(r.profile);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(v: View) {
    setView(v);
    setMode(null);
    setError('');
  }
  const xp = player?.xp ?? 0,
    level = player?.level ?? 1,
    attempts = player?.attempts ?? [],
    today = attempts.filter(
      (a) => a.mode === 'daily' && a.day === new Date(time).toISOString().slice(0, 10),
    ),
    reset = new Date(
      daily?.resetAt ?? new Date(time).toISOString().slice(0, 10) + 'T00:00:00Z',
    ).getTime();
  const seconds = Math.max(
    0,
    Math.floor(((reset > time ? reset : reset + 86400000) - time) / 1000),
  );
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
  const nav = [
    { id: 'play' as View, label: 'Home', short: 'Home', icon: House },
    { id: 'study' as View, label: 'Study', short: 'Study', icon: BookOpen },
    { id: 'practice' as View, label: 'Practice', short: 'Practice', icon: Target },
    { id: 'lab' as View, label: 'Strategy Lab', short: 'Lab', icon: FlaskConical },
    { id: 'stats' as View, label: 'Reflect', short: 'Reflect', icon: BarChart3 },
  ];
  const viewTitle: Record<View, string> = {
    play: 'Home',
    study: 'Study',
    practice: 'Practice',
    lab: 'Strategy Lab',
    stats: 'Reflect',
    guide: 'How it works',
  };
  const categories = [
    'Market basics',
    'Fundamentals',
    'Mathematics',
    'Probability',
    'Risk',
    'Macroeconomics',
    'Portfolio',
    'Psychology',
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>{splash && <Splash onDone={finishSplash} />}</AnimatePresence>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 md:px-8">
            <a
              className="flex shrink-0 items-center gap-2.5"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('play');
              }}
            >
              <LogoMark className="size-8" />
              <Wordmark />
            </a>
            <nav
              className="mx-auto hidden items-center gap-1 rounded-full border border-white/[0.07] bg-card/60 p-1 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] md:flex"
              aria-label="Main navigation"
            >
              {nav.map((n) => {
                const active = view === n.id && !mode;
                return (
                  <button
                    key={n.id}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => navigate(n.id)}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-secondary shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <n.icon className={cn('relative size-4', active && 'text-primary')} />
                    <span className="relative">{n.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <span className="hidden h-8 items-center gap-1.5 rounded-full border border-white/[0.07] bg-card px-3 font-mono text-xs lg:flex">
                <Flame className="size-3.5 text-warn" />
                {player?.streak ?? 0}
                <span className="text-muted-foreground">streak</span>
              </span>
              <span
                className="flex h-8 items-center gap-1.5 rounded-full border border-white/[0.07] bg-card px-3 font-mono text-xs"
                title={`Level ${level} · ${levels[level - 1]}`}
              >
                <Zap className="size-3.5 text-primary" />
                {xp.toLocaleString()}
                <span className="text-muted-foreground">XP · L{level}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="How it works"
                onClick={() => navigate('guide')}
              >
                <CircleHelp />
              </Button>
              {player ? (
                <>
                  <button
                    className="grid size-8 place-items-center rounded-full border border-white/[0.08] bg-secondary text-xs font-semibold"
                    aria-label="Open Reflect"
                    title={player.name}
                    onClick={() => navigate('stats')}
                  >
                    {player.name.slice(0, 1).toUpperCase()}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden size-8 rounded-full sm:inline-flex"
                    aria-label="Sign out"
                    onClick={async () => {
                      await api('/auth/logout', {});
                      setPlayer(null);
                      setMode(null);
                    }}
                  >
                    <LogOut />
                  </Button>
                </>
              ) : (
                <Button size="sm" className="rounded-full px-4" onClick={() => setAuth(true)}>
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <motion.div
            key={mode ? 'mode-' + mode : view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {error && !auth && (
              <div className="error-banner" role="alert">
                {error}
                <button onClick={() => setError('')} aria-label="Dismiss error">
                  <X size={15} />
                </button>
              </div>
            )}
            {!mode && view === 'play' && (
              <HomeBento
                player={player}
                todayCount={today.length}
                countdown={countdown}
                busy={boot || busy}
                onStartDaily={() => loadRound('daily')}
                onNavigate={(to) => navigate(to)}
                onSignIn={() => setAuth(true)}
              />
            )}
            {mode && (
              <div className="game-page">
                <div className="game-top">
                  <button
                    className="text-link"
                    onClick={() => {
                      setMode(null);
                      setError('');
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to playground
                  </button>
                  <span className="game-mode">
                    <span className="green-dot" />
                    {mode === 'daily' ? 'DAILY CHALLENGE' : 'UNLIMITED PRACTICE'}
                  </span>
                  {mode === 'unlimited' && category && (
                    <button
                      className="category-chip"
                      aria-label={`Practising ${category} questions. Clear the category filter.`}
                      onClick={() => {
                        setCategory(null);
                        setQuestion(null);
                        setReveal(null);
                      }}
                    >
                      {category} <X size={13} />
                    </button>
                  )}
                  {mode === 'unlimited' && !category && (
                    <select
                      aria-label="Difficulty"
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value as Difficulty);
                        setQuestion(null);
                        setReveal(null);
                      }}
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Quant'].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>
                {mode === 'daily' && (
                  <div className="round-progress">
                    {Array.from({ length: 10 }, (_, i) => {
                      const attempt = player?.attempts.find(
                        (a) =>
                          a.questionId === daily?.questions[i]?.id &&
                          a.day === daily?.day &&
                          a.mode === 'daily',
                      );
                      return (
                        <span
                          key={i}
                          className={
                            attempt
                              ? attempt.correct
                                ? 'passed'
                                : 'missed'
                              : daily?.questions[i]?.id === question?.id
                                ? 'current'
                                : ''
                          }
                        >
                          {attempt ? <Check size={13} /> : i + 1}
                        </span>
                      );
                    })}
                    <span className="round-count">{today.length}/10 complete</span>
                  </div>
                )}
                {busy && !question && !complete && (
                  <div className="loading-card">
                    <span className="spinner" />
                    Loading the next scenario…
                  </div>
                )}
                {!question && !busy && !complete && (
                  <div className="empty-state">
                    <Infinity size={40} />
                    <h2>Unlimited practice</h2>
                    <p>{difficulty} practice is ready. Repeated questions earn no extra XP.</p>
                    <button className="primary-btn" onClick={() => loadRound('unlimited')}>
                      Start a scenario
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
                {complete && (
                  <div className="completion-card">
                    <span className="completion-icon">
                      <Trophy size={44} />
                    </span>
                    <div className="eyebrow">DAILY CHALLENGE COMPLETE</div>
                    <h1>
                      Today’s ten are done.
                      <br />
                      <span>Process beats results.</span>
                    </h1>
                    <p>Review your calibration in Reflect, or keep practising.</p>
                    <div className="result-stats">
                      <div>
                        <strong>{today.filter((a) => a.correct).length}/10</strong>
                        <span>Correct predictions</span>
                      </div>
                      <div>
                        <strong>+{today.reduce((s, a) => s + a.xp, 0)}</strong>
                        <span>XP earned today</span>
                      </div>
                      <div>
                        <strong>{player?.streak}</strong>
                        <span>Day streak</span>
                      </div>
                    </div>
                    <button className="primary-btn" onClick={() => loadRound('unlimited')}>
                      Keep practising
                      <Infinity size={19} />
                    </button>
                    <p className="muted small">
                      Next daily challenge in {countdown} · resets at 00:00 UTC
                    </p>
                  </div>
                )}
                {question && !complete && (
                  <>
                    <div className="question-layout">
                      <section className="question-card">
                        <div className="question-meta">
                          <span className="event-pill">
                            {question.kind === 'historical' ? 'HISTORICAL EVENT' : 'MODEL SCENARIO'}
                          </span>
                          <span>
                            {question.difficulty} <span className="meta-dot">·</span>{' '}
                            {question.category}
                          </span>
                        </div>
                        <div className="ticker-heading">
                          <span className="ticker-icon">
                            <TrendingUp size={22} />
                          </span>
                          <div>
                            <strong>{question.ticker}</strong>
                            <span>{question.date}</span>
                          </div>
                          <span className="question-reward">
                            <Zap size={14} />
                            {mode === 'daily' ? '100' : '20'} XP for a first correct answer
                          </span>
                        </div>
                        <h1>{question.title}</h1>
                        <p className="question-description">{question.description}</p>
                        <div className="answer-label">
                          {reveal ? 'YOUR PREDICTION, REVEALED' : 'LOCK IN YOUR PREDICTION'}
                          <span>{question.format.toUpperCase()}</span>
                        </div>
                        <div className="answer-options">
                          {question.options.map((o, i) => (
                            <button
                              key={o.id}
                              disabled={!!reveal || busy}
                              className={
                                'answer-option ' +
                                (selected === o.id ? 'selected ' : '') +
                                (reveal && o.id === reveal.correctAnswer
                                  ? 'correct '
                                  : reveal && o.id === selected && !reveal.correct
                                    ? 'wrong '
                                    : '')
                              }
                              onClick={() => setSelected(o.id)}
                            >
                              <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                              <span>{o.label}</span>
                              {reveal && o.id === reveal.correctAnswer ? (
                                <CheckCircle2 size={19} />
                              ) : (
                                <span className="radio-dot" />
                              )}
                            </button>
                          ))}
                        </div>
                        {!reveal && (
                          <fieldset className="confidence-picker">
                            <legend>How sure are you?</legend>
                            <div className="confidence-options">
                              {confidenceLevels.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  aria-pressed={confidence === c.value}
                                  className={
                                    'confidence-option ' +
                                    (confidence === c.value ? 'selected' : '')
                                  }
                                  disabled={busy}
                                  onClick={() => setConfidence(c.value)}
                                >
                                  <strong>{c.value}%</strong>
                                  <span>{c.label}</span>
                                </button>
                              ))}
                            </div>
                          </fieldset>
                        )}
                        {!reveal ? (
                          <div className="lock-row">
                            <span>
                              <Lock size={13} />
                              {confidence === null
                                ? 'Pick an answer and how sure you are.'
                                : 'Locked answers are final.'}
                            </span>
                            <button
                              className="primary-btn"
                              onClick={submit}
                              disabled={selected === null || confidence === null || busy}
                            >
                              {busy ? 'Checking…' : 'Lock prediction'}
                              <Lock size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="locked-confirmation">
                            <Lock size={13} />
                            Prediction locked at {confidence}% sure. Your lesson is below.
                          </div>
                        )}
                      </section>
                      <aside className="game-aside">
                        <div className="game-tip">
                          <Target size={18} />
                          <h4>
                            {reveal
                              ? reveal.correct
                                ? 'CORRECT'
                                : 'NOT THIS TIME'
                              : 'HOW THIS WORKS'}
                          </h4>
                          <p>
                            {reveal
                              ? reveal.correct
                                ? 'Check whether your confidence matched. Being right for the wrong reason still counts against calibration.'
                                : 'Read why before moving on. A miss you understand is worth more than a lucky hit.'
                              : 'Pick an answer, say how sure you are, then lock it in. No real money is involved.'}
                          </p>
                        </div>
                        <div className="game-tip">
                          <Sparkles size={18} />
                          <h4>
                            {reveal
                              ? 'KNOWLEDGE IS THE REAL RETURN'
                              : 'A TIP FROM THE TRADING DESK'}
                          </h4>
                          <p>
                            {mode === 'daily'
                              ? 'Finish all 10 to build your streak. Getting a prediction wrong still earns 15 XP for showing up.'
                              : 'Practice pays 20 XP per first correct question. Replays are for learning, not farming.'}
                          </p>
                        </div>
                        <div className="game-tip subtle">
                          <ShieldCheck size={16} />
                          <p>
                            {question.kind === 'model'
                              ? 'This is a simplified educational model. Real-world outcomes depend on context and uncertainty.'
                              : 'This question is grounded in a published historical source. Hindsight is not a prediction superpower.'}
                          </p>
                        </div>
                      </aside>
                    </div>
                    {reveal && (
                      <section
                        id="answer-reveal"
                        className={'reveal-card ' + (reveal.correct ? 'win' : 'loss')}
                        aria-live="polite"
                      >
                        <div className="reveal-heading">
                          <span className="reveal-icon">
                            {reveal.correct ? <Check size={25} /> : <X size={25} />}
                          </span>
                          <div>
                            <div className="eyebrow">
                              {reveal.correct ? 'CORRECT' : 'NOT THIS TIME'}
                            </div>
                            <h2>
                              {reveal.correct
                                ? 'Your prediction checks out.'
                                : 'Here’s what happened.'}
                            </h2>
                          </div>
                          <span className="earned-reward">
                            +{reveal.xp} XP <span>+{reveal.coins} coins</span>
                          </span>
                        </div>
                        <div className="reveal-body">
                          <div>
                            <h4>Here’s why.</h4>
                            <p>{reveal.explanation}</p>
                            <a
                              className="source-link"
                              href={reveal.source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {reveal.source.label}
                              <ExternalLink size={13} />
                            </a>
                          </div>
                          {reveal.chart && (
                            <div className="reveal-chart">
                              <MiniChart large values={reveal.chart.values} color="#b5d987" />
                              <span>{reveal.chart.label}</span>
                            </div>
                          )}
                        </div>
                        <div className="concept-unlock">
                          <BookOpen size={18} />
                          <span>
                            CONCEPT DISCOVERED<strong>{reveal.concept}</strong>
                          </span>
                          <CheckCircle2 size={20} />
                        </div>
                        <button className="primary-btn next-btn" onClick={() => loadRound(mode!)}>
                          {mode === 'daily' && today.length === 10
                            ? 'See my results'
                            : 'Next scenario'}
                          <ArrowRight size={19} />
                        </button>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}
            {!mode && view === 'practice' && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">REPS MAKE IT A HABIT</div>
                    <h1>
                      Quick reps.
                      <br />
                      <span>Honest confidence.</span>
                    </h1>
                    <p>
                      Predict, say how sure you are, then see why. Every answer sharpens your
                      calibration in Reflect.
                    </p>
                  </div>
                </div>
                <section className="practice-daily content-panel">
                  <div>
                    <div className="card-overline">DAILY CHALLENGE</div>
                    <h3>10 events. One shot each.</h3>
                    <p>
                      {today.length}/10 done today · new set in <strong>{countdown}</strong>
                    </p>
                    <div className="progress-track">
                      <span style={{ width: `${today.length * 10}%` }} />
                    </div>
                  </div>
                  <button
                    className="primary-btn"
                    disabled={boot || busy}
                    onClick={() => loadRound('daily')}
                  >
                    {today.length === 10 ? 'See results' : today.length ? 'Continue' : 'Start'}
                    <ArrowRight size={18} />
                  </button>
                </section>
                <div className="section-heading">
                  <h3>
                    Unlimited practice<span>REDUCED XP, ONCE PER QUESTION</span>
                  </h3>
                </div>
                <div className="practice-grid">
                  {(['Beginner', 'Intermediate', 'Advanced', 'Quant'] as Difficulty[]).map(
                    (d, i) => (
                      <button
                        key={d}
                        className="practice-card"
                        onClick={() =>
                          loadRound('unlimited', player, { difficulty: d, category: null })
                        }
                      >
                        <span className="practice-level">{'●'.repeat(i + 1)}</span>
                        <strong>{d}</strong>
                        <span>
                          {
                            [
                              'First principles',
                              'Fundamentals + news',
                              'Risk + probability',
                              'Math-heavy',
                            ][i]
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
                <div className="section-heading">
                  <h3>
                    Practice by topic<span>PAIRS WITH THE STUDY TRACKS</span>
                  </h3>
                </div>
                <div className="category-row">
                  {categories.map((c) => (
                    <button
                      key={c}
                      className="category-chip"
                      onClick={() => loadRound('unlimited', player, { category: c })}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
            {!mode && view === 'study' && (
              <StudyLuxe
                currentLevel={level}
                onPractice={(c) => loadRound('unlimited', player, { category: c })}
                onPracticeLevel={(d) =>
                  loadRound('unlimited', player, { difficulty: d, category: null })
                }
              />
            )}
            {!mode && view === 'stats' && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">REFLECT · YOUR MARKET BRAIN, UNDER THE MICROSCOPE</div>
                    <h1>
                      Results swing with luck.
                      <br />
                      <span>Process is what you control.</span>
                    </h1>
                    <p>Your gaps, your calibration, and the receipts for every prediction.</p>
                  </div>
                </div>
                <div className="stats-overview">
                  {[
                    {
                      icon: Target,
                      label: 'Prediction accuracy',
                      value: attempts.length ? `${player?.accuracy}%` : '—',
                    },
                    { icon: Zap, label: 'Total XP earned', value: xp.toLocaleString() },
                    {
                      icon: Flame,
                      label: 'Completed daily streak',
                      value: String(player?.streak ?? 0),
                    },
                    {
                      icon: BookOpen,
                      label: 'Concepts practiced',
                      value: String(new Set(attempts.map((a) => a.questionId)).size),
                    },
                  ].map((s) => (
                    <div className="stat-card" key={s.label}>
                      <s.icon size={23} />
                      <strong>{s.value}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                {player && <GapTracker onOpenLab={() => navigate('lab')} />}
                {!attempts.length ? (
                  <div className="empty-state">
                    <Target size={42} />
                    <h2>No predictions. Infinite potential.</h2>
                    <p>
                      Your stats start with one prediction. Make your first call to begin measuring
                      calibration.
                    </p>
                    <button className="primary-btn" onClick={() => loadRound('daily')}>
                      Make my first prediction
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="stats-breakdown">
                      <div className="content-panel">
                        <div className="section-heading compact">
                          <h3>Accuracy by topic</h3>
                          <select
                            aria-label="Accuracy breakdown"
                            value={statsDimension}
                            onChange={(e) =>
                              setStatsDimension(e.target.value as 'category' | 'difficulty')
                            }
                          >
                            <option value="category">By category</option>
                            <option value="difficulty">By difficulty</option>
                          </select>
                        </div>
                        {Array.from(
                          new Set(
                            attempts.map((a) =>
                              statsDimension === 'category'
                                ? a.category
                                : (a.difficulty ?? 'Beginner'),
                            ),
                          ),
                        ).map((c) => {
                          const a = attempts.filter(
                              (a) =>
                                (statsDimension === 'category'
                                  ? a.category
                                  : (a.difficulty ?? 'Beginner')) === c,
                            ),
                            value = Math.round(
                              (a.filter((a) => a.correct).length / a.length) * 100,
                            );
                          return (
                            <div className="category-row" key={c}>
                              <span>
                                {c}
                                <small>{a.length} attempts</small>
                              </span>
                              <div className="progress-track">
                                <span style={{ width: value + '%' }} />
                              </div>
                              <strong>{value}%</strong>
                            </div>
                          );
                        })}
                      </div>
                      <div className="content-panel">
                        <h3>Next best practice</h3>
                        <p>Your most useful next step is to revisit a concept you missed.</p>
                        <div className="practice-recommendation">
                          <Sparkles size={25} />
                          <strong>
                            {attempts.filter((a) => !a.correct).at(-1)?.category ??
                              'Keep your momentum'}
                          </strong>
                          <span>
                            Average response time:{' '}
                            {Math.round(
                              attempts.reduce((s, a) => s + a.duration, 0) / attempts.length,
                            )}
                            s
                          </span>
                        </div>
                        <button className="primary-btn" onClick={() => loadRound('unlimited')}>
                          Practice again
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="content-panel calibration-panel">
                      <div className="section-heading compact">
                        <h3>How well do you know what you know?</h3>
                        <span className="muted small">
                          {player?.calibration.brier === null || !player
                            ? 'No rated predictions yet'
                            : `Brier score ${player.calibration.brier.toFixed(2)} · lower is better`}
                        </span>
                      </div>
                      {player && player.calibration.count ? (
                        <>
                          <p className="muted small">
                            When you say you’re a certain percent sure, how often are you right? A
                            well-calibrated player’s bars land on their markers.
                          </p>
                          <div className="calibration-rows">
                            {player.calibration.buckets.map((b) => (
                              <div className="calibration-row" key={b.stated}>
                                <span>{b.stated}% sure</span>
                                <div
                                  className="calibration-track"
                                  role="img"
                                  aria-label={`When ${b.stated}% sure you were right ${b.hitRate}% of the time across ${b.n} predictions`}
                                >
                                  <span style={{ width: `${b.hitRate}%` }} />
                                  <i style={{ left: `${b.stated}%` }} />
                                </div>
                                <strong>
                                  {b.hitRate}% right <small>({b.n})</small>
                                </strong>
                              </div>
                            ))}
                          </div>
                          <p className="calibration-verdict">
                            {(() => {
                              const rated = player.calibration.buckets;
                              const stated =
                                rated.reduce((s, b) => s + b.stated * b.n, 0) /
                                player.calibration.count;
                              const hit =
                                rated.reduce((s, b) => s + b.hitRate * b.n, 0) /
                                player.calibration.count;
                              if (player.calibration.count < 10)
                                return `Only ${player.calibration.count} rated prediction${player.calibration.count === 1 ? '' : 's'} so far. Give it at least 10 before reading much into this.`;
                              if (stated - hit > 10)
                                return `You tend to be overconfident: you say ${Math.round(stated)}% on average but are right ${Math.round(hit)}% of the time.`;
                              if (hit - stated > 10)
                                return `You tend to be underconfident: you're right ${Math.round(hit)}% of the time but only say ${Math.round(stated)}%.`;
                              return 'Nicely calibrated: your confidence roughly matches how often you’re right.';
                            })()}
                          </p>
                        </>
                      ) : (
                        <p className="muted small">
                          Pick how sure you are before locking each prediction. Your calibration
                          shows up here.
                        </p>
                      )}
                    </div>
                    <div className="content-panel history-panel">
                      <div className="section-heading compact">
                        <h3>Prediction receipts</h3>
                        <select
                          value={historyFilter}
                          aria-label="Filter prediction history"
                          onChange={(e) => setHistoryFilter(e.target.value)}
                        >
                          <option>All</option>
                          <option>Correct</option>
                          <option>Missed</option>
                        </select>
                      </div>
                      {attempts
                        .filter(
                          (a) =>
                            historyFilter === 'All' ||
                            (historyFilter === 'Correct' ? a.correct : !a.correct),
                        )
                        .slice()
                        .reverse()
                        .slice(0, 30)
                        .map((a, i) => (
                          <div className="history-row" key={i}>
                            <span
                              className={
                                a.correct ? 'history-status correct' : 'history-status wrong'
                              }
                            >
                              {a.correct ? <Check size={17} /> : <X size={17} />}
                            </span>
                            <div>
                              <strong>{a.category}</strong>
                              <span>
                                {a.questionId.replaceAll('-', ' ')} · {a.mode} ·{' '}
                                {new Date(a.at).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="history-outcome">
                              {a.correct ? 'Good call' : 'Lesson learned'}
                            </span>
                            <strong>+{a.xp} XP</strong>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </>
            )}
            {!mode && view === 'lab' && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">STRATEGY LAB · PRACTICE WITHOUT THE PAIN</div>
                    <h1>
                      Test the decision.
                      <br />
                      <span>Not your savings.</span>
                    </h1>
                    <p>
                      Drills that show how sizing, luck and market regimes shape results. Every
                      market here is a labelled model.
                    </p>
                  </div>
                </div>
                <h2 className="lab-drill-title" id="event-lab">
                  Event Lab · Live through market history, then measure the gaps
                </h2>
                <EventLab
                  signedIn={!!player}
                  onNeedAuth={() => setAuth(true)}
                  onOpenReflect={() => navigate('stats')}
                />
                <h2 className="lab-drill-title lab-drill-spaced">
                  Drill 1 · Same winning strategy, only the bet size changes
                </h2>
                <RiskSandbox />
                <MarketLab />
                <p className="muted path-note">
                  This is a model for learning, not a forecast. Real markets add fees, slippage,
                  gaps and emotions.
                </p>
              </>
            )}
            {!mode && view === 'guide' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                    How it works
                  </span>
                  <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                    A simulator for your trading decisions.
                  </h1>
                  <p className="max-w-2xl text-muted-foreground">
                    Practise on model markets, rate how sure you are, and measure the gap between
                    your plan and what you actually do. No real money is ever involved.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      icon: BookOpen,
                      title: 'Learn',
                      text: 'Short Study tracks: a concept, a worked example with real numbers, and a quick check.',
                    },
                    {
                      icon: Target,
                      title: 'Train',
                      text: 'Daily and unlimited predictions. Say how sure you are before you lock each answer.',
                    },
                    {
                      icon: FlaskConical,
                      title: 'Simulate',
                      text: 'Live through model scenarios shaped like real market events, with a locked plan and checkpoints.',
                    },
                    {
                      icon: BarChart3,
                      title: 'Measure',
                      text: 'Reflect shows your calibration and four gaps: plan, behaviour, benchmark and confidence.',
                    },
                  ].map((s) => (
                    <Card key={s.title} className="px-5">
                      <s.icon className="size-5 text-primary" />
                      <div className="text-base font-semibold">{s.title}</div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                    </Card>
                  ))}
                </div>
                <Card className="gap-3 px-6 text-sm leading-relaxed text-muted-foreground">
                  <h2 className="text-base font-semibold text-foreground">Rules and scoring</h2>
                  <p>
                    Stonk Up is for educational purposes only and does not provide financial advice
                    or investment recommendations. Market outcomes are uncertain, and past outcomes
                    do not guarantee future results. Every market in the Lab is a labelled model,
                    not real prices.
                  </p>
                  <p>
                    Daily challenges reset at 00:00 UTC (05:30 IST). Unlimited practice awards
                    reduced XP, once per question. XP and coins are progress markers only and can
                    never be exchanged for money.
                  </p>
                  <h2 id="privacy" className="pt-2 text-base font-semibold text-foreground">
                    Privacy notice
                  </h2>
                  <p>
                    Stonk Up is for people aged 18 and over. To save your progress we store your
                    name, email, a scrypt hash of your password (never the password itself), your
                    answers, how long each took, your confidence ratings, your Event Lab runs and
                    reflections, and your XP and coins. Guests get a random ID instead of an email.
                    A session cookie keeps you signed in for seven days.
                  </p>
                  <p>
                    We use this only to run the platform and show your stats. There are no ads, no
                    analytics trackers, and we don’t sell or share your data. The app is hosted on
                    Render with the database on Neon, and fonts load from Google Fonts, which sees
                    your IP address.
                  </p>
                  <div className="pt-2">
                    <Button onClick={() => loadRound('daily')}>
                      Start today’s challenge <ArrowRight />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-5 text-xs text-muted-foreground">
            <span>© {new Date(time).getFullYear()} Stonk Up</span>
            <span>Educational platform. Not financial advice.</span>
            {storage === 'local-demo' && (
              <span className="ml-auto rounded-md border px-2 py-0.5 font-mono text-[11px]">
                Local demo storage
              </span>
            )}
          </footer>
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-[#0b0b0e]/95 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {nav.map((item) => {
          const active = view === item.id && !mode;
          return (
            <button
              key={item.id}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px]',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
              onClick={() => navigate(item.id)}
            >
              <item.icon className="size-5" />
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
      {auth && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAuth(false);
              setPending(null);
              setError('');
            }
          }}
        >
          <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button
              className="modal-close icon-btn"
              aria-label="Close sign in"
              onClick={() => {
                setAuth(false);
                setPending(null);
                setError('');
              }}
            >
              <X />
            </button>
            <div className="eyebrow">STONK UP ACCOUNT</div>
            <h2 id="auth-title">
              {authMode === 'register' ? 'Create your account.' : 'Welcome back.'}
            </h2>
            <p>Save your progress, calibration and Event Lab runs across devices.</p>
            <div className="auth-tabs">
              <button
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                }}
              >
                Create account
              </button>
              <button
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
              >
                Sign in
              </button>
            </div>
            <label className="age-check">
              <input
                type="checkbox"
                aria-label="I’m 18 or older and I’ve read the privacy notice"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              <span>
                I’m 18 or older and I’ve read the{' '}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    setAuth(false);
                    setPending(null);
                    navigate('guide');
                    setTimeout(() => document.getElementById('privacy')?.scrollIntoView(), 100);
                  }}
                >
                  privacy notice
                </button>
                .
              </span>
            </label>
            <form onSubmit={authenticate}>
              {authMode === 'register' && (
                <label>
                  Player name
                  <input
                    name="name"
                    autoComplete="nickname"
                    required
                    minLength={2}
                    maxLength={32}
                    placeholder="Your name"
                    autoFocus
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={10}
                  maxLength={128}
                  placeholder="At least 10 characters"
                />
              </label>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button disabled={authBusy} className="primary-btn" type="submit">
                {authBusy
                  ? 'One moment…'
                  : authMode === 'register'
                    ? 'Create account & play'
                    : 'Sign in'}
                <ArrowRight size={17} />
              </button>
            </form>
            <div className="auth-or">or take it for a spin</div>
            <button disabled={authBusy} className="guest-btn" onClick={guest}>
              Play as guest
              <ArrowUpRight size={16} />
            </button>
            <span className="auth-note">Guest progress stays with this browser session.</span>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
