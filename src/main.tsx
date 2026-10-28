import React, { useEffect, useState } from 'react';
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
  Cat,
  CheckCircle2,
  FlaskConical,
  House,
} from 'lucide-react';
import type {
  Profile,
  Question,
  Reveal,
  Difficulty,
  Mode,
  Attempt,
  ReactionType,
} from '../shared/types';
import { confidenceLevels, levels } from '../shared/types';
import './styles.css';
import { api } from './lib/api';
import { Mascot, MiniChart } from './components/GameArt';
import { RiskSandbox } from './components/RiskSandbox';
import { MarketLab } from './components/MarketLab';
import { StudyTracks } from './components/StudyTracks';
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
    [reaction, setReaction] = useState<{ url: string; message: string; type: ReactionType } | null>(
      null,
    ),
    [pending, setPending] = useState<Mode | null>(null),
    [menu, setMenu] = useState(false),
    [time, setTime] = useState(Date.now()),
    [storage, setStorage] = useState(''),
    [historyFilter, setHistoryFilter] = useState('All'),
    [statsDimension, setStatsDimension] = useState<'category' | 'difficulty'>('category');
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
    if (!reaction) return;
    const t = setTimeout(() => setReaction(null), 4500);
    return () => clearTimeout(t);
  }, [reaction]);
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
      api<{ url: string; message: string; type: ReactionType }>('/reactions/' + r.reaction)
        .then(setReaction)
        .catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(v: View) {
    setView(v);
    setMode(null);
    setMenu(false);
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
    <div className="app-shell">
      <aside className={'sidebar ' + (menu ? 'open' : '')}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('play');
          }}
        >
          <span className="brand-mark">
            <TrendingUp size={25} />
          </span>
          stonk<span className="brand-up">up</span>
          <span className="brand-dot">↗</span>
        </a>
        <div className="side-caption">YOUR NEXT BAD DECISION STARTS HERE</div>
        <div className="nav-label">THE PLAYGROUND</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'nav-item active' : 'nav-item'}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === 'play' && <span className="nav-live" />}
            </button>
          ))}
        </nav>
        <div className="side-divider" />
        <button
          className={'nav-item ' + (view === 'guide' ? 'active' : '')}
          onClick={() => navigate('guide')}
        >
          <CircleHelp size={19} />
          How to play
        </button>
        <div className="sidebar-bottom">
          <div className="cat-note">
            <Cat size={28} />
            <p>
              Bad predictions.
              <br />
              <strong>Good character development.</strong>
            </p>
          </div>
          <div className="side-profile">
            <div className="avatar">
              {player ? player.name.slice(0, 1).toUpperCase() : <Cat size={21} />}
            </div>
            <div>
              <strong>{player?.name ?? 'Future market legend'}</strong>
              <span>
                {levels[level - 1]} · Level {level}
              </span>
            </div>
            {player ? (
              <button
                aria-label="Sign out"
                className="icon-btn"
                onClick={async () => {
                  await api('/auth/logout', {});
                  setPlayer(null);
                  setMode(null);
                }}
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button className="icon-btn" aria-label="Sign in" onClick={() => setAuth(true)}>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-btn"
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              The playground <ChevronRight size={13} />
              <strong>
                {mode
                  ? mode === 'daily'
                    ? 'Daily challenge'
                    : 'Unlimited practice'
                  : viewTitle[view]}
              </strong>
            </span>
          </div>
          <div className="topbar-stats">
            <span className="streak">
              <Flame size={18} />
              {player?.streak ?? 0}
              <span className="stat-unit">day streak</span>
            </span>
            <span className="coins">
              <Coins size={18} />
              {player?.coins ?? 0}
            </span>
            <span className="xp">
              <Zap size={17} />
              {xp.toLocaleString()} XP
            </span>
            <button
              className="top-avatar"
              aria-label={player ? 'Open player stats' : 'Create an account'}
              onClick={() => (player ? navigate('stats') : setAuth(true))}
            >
              {player?.name.slice(0, 1).toUpperCase() ?? 'K'}
            </button>
          </div>
        </header>
        <main>
          {error && !auth && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </div>
          )}
          {!mode && view === 'play' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="green-dot" /> THE MARKET IS OPEN. YOUR BRAIN SHOULD BE TOO.
                  </div>
                  <h1>
                    Less scrolling. <span>More stonking.</span>
                  </h1>
                  <p>Real-world events. Questionable instincts. A smarter you.</p>
                </div>
                <div className="today-date">
                  {new Date(time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <span>LET’S MAKE SOME MOVES</span>
                </div>
              </div>
              <section className="feature-grid">
                <div className="daily-card">
                  <div className="daily-background">
                    <MiniChart color="#728d59" large />
                  </div>
                  <div className="daily-copy">
                    <div className="live-pill">
                      <span /> DAILY CHALLENGE <span className="pill-divider">/</span> VOL.{' '}
                      {new Date(time).getUTCDate().toString().padStart(2, '0')}
                    </div>
                    <h2>
                      The market moved.
                      <br />
                      Did you see it coming?
                    </h2>
                    <p>
                      10 events. 10 predictions. One chance to prove
                      <br className="desktop-break" /> your inner market genius isn’t just a lucky
                      cat.
                    </p>
                    <div className="daily-details">
                      <span>
                        <Target size={15} />
                        10 questions
                      </span>
                      <span>
                        <Clock3 size={15} />
                        ~5 minutes
                      </span>
                      <span>
                        <Zap size={15} />
                        Up to 1,000 XP
                      </span>
                    </div>
                    <button
                      className="primary-btn"
                      disabled={boot || busy}
                      onClick={() => loadRound('daily')}
                    >
                      {today.length === 10
                        ? 'View your results'
                        : today.length
                          ? 'Continue challenge'
                          : 'Let’s play'}
                      <ArrowUpRight size={19} />
                    </button>
                    <div className="reset-note">
                      <Clock3 size={13} /> New challenge in <strong>{countdown}</strong>
                    </div>
                  </div>
                  <div className="daily-art">
                    <span className="floating-tag tag-up">↗ BIG BRAIN ENERGY</span>
                    <Mascot />
                    <span className="floating-tag tag-down">WALL STREET? MEOW STREET.</span>
                    <span className="art-spark spark-one">✦</span>
                    <span className="art-spark spark-two">✧</span>
                  </div>
                </div>
                <div className="level-card">
                  <div className="card-overline">
                    YOUR CHARACTER ARC <Sparkles size={16} />
                  </div>
                  <div className="level-avatar">
                    <Cat size={42} strokeWidth={1.3} />
                    <span>{level}</span>
                  </div>
                  <div className="level-name">{levels[level - 1]}</div>
                  <p>
                    {xp === 0
                      ? 'Every legend starts with a guess.'
                      : 'Your instincts are getting sharper.'}
                  </p>
                  <div className="level-progress-label">
                    <span>LEVEL {level}</span>
                    <strong>{level === 8 ? 'MAX LEVEL' : `${xp % 1000} / 1,000 XP`}</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: level === 8 ? '100%' : `${(xp % 1000) / 10}%` }} />
                  </div>
                  <div className="level-next">
                    <Lock size={13} />
                    {level === 8 ? 'You reached the summit' : `Next up: ${levels[level]}`}
                  </div>
                  <button className="text-link" onClick={() => navigate('study')}>
                    Explore your learning path
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              <div className="section-heading">
                <div>
                  <h3>
                    Pick your playground<span>YOUR MONEY IS SAFE. YOUR EGO, LESS SO.</span>
                  </h3>
                </div>
                <span className="muted small">Learn by doing. Lose absolutely nothing.</span>
              </div>
              <section className="mode-grid">
                <button className="mode-card unlimited" onClick={() => loadRound('unlimited')}>
                  <div className="mode-top">
                    <span className="mode-icon purple">
                      <Infinity size={24} />
                    </span>
                    <span className="mode-pill">NO LIMITS. NO PRESSURE.</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>Unlimited mode</h3>
                  <p>
                    Keep guessing. Keep learning.
                    <br />
                    The market has plenty of plot twists.
                  </p>
                  <div className="mode-bottom">
                    <span>4 difficulty levels</span>
                    <span className="play-circle">
                      <Play size={13} fill="currentColor" />
                    </span>
                  </div>
                  <div className="decorative-loop">∞</div>
                </button>
                <button className="mode-card path-card" onClick={() => navigate('study')}>
                  <div className="mode-top">
                    <span className="mode-icon green">
                      <BookOpen size={23} />
                    </span>
                    <span className="mode-pill">SMALL STEPS. BIG BRAIN.</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>From noob to know-it-all</h3>
                  <p>
                    A learning path that levels up
                    <br />
                    with you. Math arrives fashionably late.
                  </p>
                  <div className="mode-bottom">
                    <span>8 levels to conquer</span>
                    <div className="step-dots">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </button>
                <button className="mode-card stats-card" onClick={() => navigate('stats')}>
                  <div className="mode-top">
                    <span className="mode-icon orange">
                      <BarChart3 size={24} />
                    </span>
                    <span className="mode-pill">RECEIPTS INCLUDED.</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>Meet your market brain</h3>
                  <p>
                    Find your strengths. Spot your blind
                    <br />
                    spots. Give your future self a head start.
                  </p>
                  <div className="mode-bottom">
                    <span>Your prediction history</span>
                    <div className="tiny-bars">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </button>
              </section>
              <section className="bottom-grid">
                <div className="mission-card">
                  <div className="section-heading compact">
                    <h3>Your daily side quests</h3>
                    <span className="muted small">A LITTLE PROGRESS GOES A LONG WAY</span>
                  </div>
                  {[
                    {
                      title: 'Show up. Make a prediction.',
                      desc: 'Complete your first daily question',
                      value: today.length ? 1 : 0,
                      total: 1,
                      icon: Target,
                      reward: '+100 XP*',
                    },
                    {
                      title: 'Trust the process, not the hype.',
                      desc: 'Get 3 predictions right today',
                      value: today.filter((a) => a.correct).length,
                      total: 3,
                      icon: CheckCircle2,
                      reward: '3 good calls',
                    },
                    {
                      title: 'Finish what you stonked.',
                      desc: 'Complete all 10 daily questions',
                      value: today.length,
                      total: 10,
                      icon: Flame,
                      reward: 'Build your streak',
                    },
                  ].map((m) => (
                    <div className="mission" key={m.title}>
                      <span className={'mission-icon ' + (m.value >= m.total ? 'done' : '')}>
                        <m.icon size={19} />
                      </span>
                      <div className="mission-text">
                        <strong>{m.title}</strong>
                        <span>{m.desc}</span>
                      </div>
                      <span className="mission-reward">{m.reward}</span>
                      <div className="mission-meter">
                        <span>
                          {Math.min(m.value, m.total)}/{m.total}
                        </span>
                        <div className="progress-track">
                          <span style={{ width: `${Math.min(m.value / m.total, 1) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mission-footnote">
                    *For a correct daily prediction. Side quests track progress; no bonus XP.
                  </div>
                </div>
                <div className="wisdom-card">
                  <span className="card-overline">
                    <span>✳</span> A LITTLE MARKET WISDOM
                  </span>
                  <blockquote>
                    “Being right once is luck. Understanding why is how you get better.”
                  </blockquote>
                  <p>— The Meow Street trading desk</p>
                  <div className="wisdom-bottom">
                    <span>Patience is a position, too.</span>
                    <BookOpen size={18} />
                  </div>
                </div>
              </section>
              <div className="bottom-tagline">
                <ShieldCheck size={14} />
                <span>Real lessons. Virtual stakes. Zero financial advice.</span>
                <span className="cat-signature">Built for curious humans. Approved by cats.</span>
              </div>
            </>
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
                  Getting your next market plot twist…
                </div>
              )}
              {!question && !busy && !complete && (
                <div className="empty-state">
                  <Infinity size={40} />
                  <h2>A different kind of challenge.</h2>
                  <p>{difficulty} practice is ready. Repeated questions earn no extra XP.</p>
                  <button className="primary-btn" onClick={() => loadRound('unlimited')}>
                    Deal me a question
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
                    You showed up.
                    <br />
                    <span>The cat respects that.</span>
                  </h1>
                  <p>Every prediction is a rep for your market brain.</p>
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
                    Keep playing
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
                                  'confidence-option ' + (confidence === c.value ? 'selected' : '')
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
                              : 'Your first instinct. Your final answer.'}
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
                      <div className="coach-cat">
                        <Mascot small />
                        <div className="speech-bubble">
                          {reveal
                            ? reveal.correct
                              ? 'An excellent use of your one brain cell.'
                              : 'A wrong answer is just a lesson with dramatic timing.'
                            : 'No real money. Just you, the market, and a suspiciously confident cat.'}
                        </div>
                      </div>
                      <div className="game-tip">
                        <Sparkles size={18} />
                        <h4>
                          {reveal ? 'KNOWLEDGE IS THE REAL RETURN' : 'A TIP FROM THE TRADING DESK'}
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
                            {reveal.correct
                              ? 'GOOD CALL, MARKET HUMAN.'
                              : 'THE MARKET HAD OTHER PLANS.'}
                          </div>
                          <h2>
                            {reveal.correct
                              ? 'Your prediction checks out.'
                              : 'Let’s unpack that one.'}
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
                          : 'Next market plot twist'}
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
                {(['Beginner', 'Intermediate', 'Advanced', 'Quant'] as Difficulty[]).map((d, i) => (
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
                ))}
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
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">LEARN IT BEFORE YOU'RE TESTED ON IT</div>
                  <h1>
                    Ten skills that matter
                    <br />
                    <span>more than stock tips.</span>
                  </h1>
                  <p>
                    Short lessons with a worked example and a quick check. Then practise the topic.
                  </p>
                </div>
                <span className="path-total">
                  {xp.toLocaleString()}
                  <small>TOTAL XP EARNED</small>
                </span>
              </div>
              <StudyTracks onPractice={(c) => loadRound('unlimited', player, { category: c })} />
              <div className="section-heading study-levels-heading">
                <h3>
                  Your level path<span>FROM MARKET BABY TO QUANT OVERLORD</span>
                </h3>
              </div>
              <div className="learning-grid">
                {levels.map((l, i) => (
                  <button
                    key={l}
                    className={
                      'learning-card ' +
                      (i + 1 === level
                        ? 'current-level '
                        : i + 1 > level
                          ? 'locked-level'
                          : 'unlocked-level')
                    }
                    onClick={() => {
                      if (i + 1 <= level) {
                        setDifficulty(
                          i < 2
                            ? 'Beginner'
                            : i < 4
                              ? 'Intermediate'
                              : i < 6
                                ? 'Advanced'
                                : 'Quant',
                        );
                        setMode('unlimited');
                        setQuestion(null);
                        setReveal(null);
                        setComplete(false);
                      }
                    }}
                  >
                    <div className="learning-card-top">
                      <span>LEVEL {i + 1}</span>
                      {i + 1 > level ? (
                        <Lock size={18} />
                      ) : i + 1 === level ? (
                        <span className="you-are-here">YOU ARE HERE</span>
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                    </div>
                    <div className="learning-symbol">
                      {['◉', '↗', '⚡', '✳', '∑', '◈', '◎', '∞'][i]}
                    </div>
                    <h3>{l}</h3>
                    <p>
                      {
                        [
                          'Stocks, supply & demand, bulls & bears',
                          'Earnings, market cap & company fundamentals',
                          'Probability, position sizing & drawdowns',
                          'Rates, inflation & news reactions',
                          'Expected returns, volatility & Sharpe ratios',
                          'Diversification, correlation & risk allocation',
                          'FOMO, fear, greed & behavioral finance',
                          'Mathematical models & advanced strategies',
                        ][i]
                      }
                    </p>
                    <div className="learning-bottom">
                      <span>
                        {i === 0 ? 'Your journey starts here' : `${i * 1000} XP to unlock`}
                      </span>
                      {i + 1 <= level && <ArrowRight size={17} />}
                    </div>
                  </button>
                ))}
              </div>
              <p className="muted path-note">
                Levels track earned XP. Unlimited practice is available at every difficulty from the
                playground.
              </p>
            </>
          )}
          {!mode && view === 'stats' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR MARKET BRAIN, UNDER THE MICROSCOPE</div>
                  <h1>
                    Numbers don’t lie.
                    <br />
                    <span>But they can be funny.</span>
                  </h1>
                  <p>Your predictions, progress, and a few places to get better.</p>
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
              {!attempts.length ? (
                <div className="empty-state">
                  <Target size={42} />
                  <h2>No predictions. Infinite potential.</h2>
                  <p>Your stats start with one guess. Let’s give the cat something to judge.</p>
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
                        <h3>Your strengths & plot twists</h3>
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
                          value = Math.round((a.filter((a) => a.correct).length / a.length) * 100);
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
                      <h3>Practice makes less terrible.</h3>
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
                        Pick how sure you are before locking each prediction. Your calibration shows
                        up here.
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
                    Drills that show how sizing, luck and market regimes shape results. Every market
                    here is a labelled model.
                  </p>
                </div>
              </div>
              <h2 className="lab-drill-title">
                Drill 1 · Same winning strategy, only the bet size changes
              </h2>
              <RiskSandbox />
              <MarketLab />
              <p className="muted path-note">
                This is a model for learning, not a forecast. Real markets add fees, slippage, gaps
                and emotions.
              </p>
            </>
          )}
          {!mode && view === 'guide' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">WELCOME TO MEOW STREET</div>
                  <h1>
                    Real lessons.
                    <br />
                    <span>Very unserious cats.</span>
                  </h1>
                  <p>Learn the market. Make terrible predictions. Get better.</p>
                </div>
              </div>
              <div className="guide-grid">
                {[
                  {
                    icon: TrendingUp,
                    title: '01. Something happens.',
                    text: 'You get a market event or a simplified scenario. Read the information that was available at the time.',
                  },
                  {
                    icon: Lock,
                    title: '02. Make the call.',
                    text: 'Pick your answer and lock it in. Your response goes to the server, which controls scoring and rewards.',
                  },
                  {
                    icon: Cat,
                    title: '03. Meet the consequences.',
                    text: 'The cat reacts. You see the outcome, the explanation, and a source. Model charts are explicitly labeled.',
                  },
                  {
                    icon: Zap,
                    title: '04. Get a little smarter.',
                    text: 'Earn XP, discover concepts, and move up the learning path. Finish 10 daily questions to build a streak.',
                  },
                ].map((s) => (
                  <div className="content-panel" key={s.title}>
                    <s.icon className="guide-icon" size={30} />
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="content-panel guide-fineprint">
                <h3>The fine print. Short, we promise.</h3>
                <p>
                  Stonk Up is for educational and entertainment purposes only and does not provide
                  financial advice or investment recommendations. Market outcomes are uncertain.
                  Past outcomes do not guarantee future results.
                </p>
                <p>
                  Daily challenges reset at 00:00 UTC. Unlimited practice awards reduced XP only
                  once per question. Guests keep their progress in their current session; create an
                  account for a reusable login.
                </p>
                <h4 id="privacy">Privacy notice</h4>
                <p>
                  Stonk Up is for people aged 18 and over. To save your progress we store your
                  player name, email, a scrypt hash of your password (never the password itself),
                  your answers, how long each took, and your XP and coins. Guests get a random ID
                  instead of an email. A session cookie keeps you signed in for seven days.
                </p>
                <p>
                  We use this only to run the game and show your stats. There are no ads, no
                  analytics trackers, and we don’t sell or share your data. The app is hosted on
                  Render with the database on Neon, and fonts load from Google Fonts, which sees
                  your IP address.
                </p>
                <h4>Cat credits</h4>
                <p>
                  Reaction artwork: Twemoji © Twitter and contributors, licensed under{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  .{' '}
                  <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">
                    Maintained source repository
                  </a>
                  . The trading-cat mascot is original vector artwork.
                </p>
                <button className="primary-btn" onClick={() => loadRound('daily')}>
                  Enough reading. Let’s play.
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
          <footer>
            <span>© {new Date(time).getFullYear()} Stonk Up</span>
            <span>Educational game. Not financial advice.</span>
            {storage === 'local-demo' && (
              <span className="demo-label">LOCAL DEMO · SERVER-SAVED PROGRESS</span>
            )}
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {nav.map((item) => (
          <button
            key={item.id}
            className={view === item.id && !mode ? 'active' : ''}
            aria-current={view === item.id && !mode ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={19} />
            <span>{item.short}</span>
          </button>
        ))}
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
            <span className="auth-cat">
              <Cat size={36} />
            </span>
            <div className="eyebrow">YOUR CHARACTER ARC STARTS HERE</div>
            <h2 id="auth-title">
              {authMode === 'register'
                ? 'Hello, future market legend.'
                : 'Back for more plot twists?'}
            </h2>
            <p>Save your XP. Build your streak. Make the cat proud.</p>
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
                    placeholder="Your market alter ego"
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
      {reaction && (
        <div
          className={'reaction-toast ' + (reveal?.correct ? 'celebrating' : 'mourning')}
          role="status"
        >
          <img
            src={reaction.url}
            alt={reaction.type + ' cat'}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <span>MEOW STREET SAYS</span>
            <strong>{reaction.message}</strong>
          </div>
          <button
            className="icon-btn"
            aria-label="Dismiss cat reaction"
            onClick={() => setReaction(null)}
          >
            <X size={14} />
          </button>
          {reveal?.correct && (
            <div className="confetti">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          )}
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
