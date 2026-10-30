// The Study: an editorial, private-library dashboard. Its own visual world inside the app:
// warm black, champagne gold, a high-contrast serif and hairline rules.
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { levels, type Difficulty } from '../../shared/types';
import { studyTracks, type StudyTrack } from '@/content/study';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'stonkup.study.done';
const EASE = [0.22, 1, 0.36, 1] as const;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Completion is a per-browser convenience; progress that matters lives on the server.
function readDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function writeDone(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('text-[11px] font-medium uppercase tracking-[0.28em] text-gold', className)}>
    {children}
  </span>
);

function GoldButton({
  children,
  onClick,
  solid = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  solid?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group inline-flex h-11 items-center gap-3 rounded-full px-6 text-[12px] font-medium uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
        solid
          ? 'bg-gradient-to-b from-gold-soft to-gold text-ink shadow-[0_10px_30px_-12px_rgba(201,169,110,0.7)] hover:brightness-110'
          : 'border border-gold/40 text-gold-soft hover:border-gold hover:bg-gold/[0.06]',
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-40 place-items-center">
      <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgba(201,169,110,0.12)"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#gold-ring)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - done / total) }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
        />
        <defs>
          <linearGradient id="gold-ring" x1="0" x2="1">
            <stop offset="0" stopColor="#e6d3a8" />
            <stop offset="1" stopColor="#a8864c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center" role="img" aria-label={`${done} of ${total} chapters read`}>
        <div className="font-serif text-5xl leading-none text-gold-soft">{done}</div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
          of {total} read
        </div>
      </div>
    </div>
  );
}

function Lesson({
  track,
  index,
  done,
  onDone,
  onBack,
  onPractice,
}: {
  track: StudyTrack;
  index: number;
  done: boolean;
  onDone: () => void;
  onBack: () => void;
  onPractice: (category: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === track.check.answer;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col gap-12"
    >
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.24em] text-white/50 transition-colors hover:text-gold-soft"
      >
        <ArrowLeft className="size-3.5" /> The Study
      </button>
      <header className="grid gap-8 md:grid-cols-[auto_1fr] md:items-end">
        <span className="font-serif text-[7rem] leading-[0.8] text-transparent [-webkit-text-stroke:1px_rgba(201,169,110,0.55)] md:text-[9rem]">
          {ROMAN[index]}
        </span>
        <div className="flex flex-col gap-4">
          <Eyebrow>
            Chapter {ROMAN[index]} · {track.tag} · Level {track.level}
          </Eyebrow>
          <h2 className="font-serif text-5xl font-medium leading-[1.02] tracking-[-0.01em] text-white md:text-6xl">
            {track.title}
          </h2>
          <p className="max-w-2xl font-serif text-2xl italic leading-snug text-white/70">
            {track.summary}
          </p>
        </div>
      </header>
      <div className="h-px bg-gradient-to-r from-gold/40 via-gold/10 to-transparent" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-6">
          <Eyebrow>Principles</Eyebrow>
          <ol className="flex flex-col">
            {track.ideas.map((idea, i) => (
              <li
                key={idea}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-gold/10 py-5 first:border-t"
              >
                <span className="font-serif text-2xl text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[15px] leading-relaxed text-white/80">{idea}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col gap-6">
          <Eyebrow>Worked example</Eyebrow>
          <div className="rounded-2xl border border-gold/15 bg-gradient-to-b from-white/[0.03] to-transparent p-7">
            <p className="font-serif text-xl leading-snug text-white">{track.example.setup}</p>
            <ol className="mt-5 flex flex-col gap-3">
              {track.example.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                  <span className="font-mono text-xs leading-6 text-gold/80">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-l border-gold/50 pl-4 text-[15px] leading-relaxed text-gold-soft">
              {track.example.result}
            </p>
          </div>
        </section>
      </div>
      <section className="flex flex-col gap-6 rounded-3xl border border-gold/15 bg-[#0e0d0a] p-7 md:p-10">
        <Eyebrow>Examination</Eyebrow>
        <p className="max-w-3xl font-serif text-3xl leading-tight text-white">
          {track.check.question}
        </p>
        <div className="flex flex-col">
          {track.check.options.map((option, i) => {
            const isAnswer = i === track.check.answer;
            const state =
              picked === null ? 'idle' : isAnswer ? 'right' : i === picked ? 'wrong' : 'muted';
            return (
              <button
                key={option}
                disabled={picked !== null}
                onClick={() => {
                  setPicked(i);
                  if (isAnswer && !done) onDone();
                }}
                className={cn(
                  'group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-gold/10 py-4 text-left transition-colors first:border-t',
                  state === 'idle' && 'hover:bg-gold/[0.04]',
                  state === 'muted' && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'font-serif text-2xl',
                    state === 'right'
                      ? 'text-gold'
                      : state === 'wrong'
                        ? 'text-loss'
                        : 'text-white/40',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span
                  className={cn(
                    'text-[15px]',
                    state === 'right' ? 'text-gold-soft' : 'text-white/85',
                  )}
                >
                  {option}
                </span>
                {state === 'right' ? (
                  <Check className="size-5 text-gold" aria-label="Correct answer" />
                ) : state === 'wrong' ? (
                  <X className="size-5 text-loss" aria-label="Your answer, incorrect" />
                ) : (
                  <ArrowRight className="size-4 text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-gold/70" />
                )}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-[15px] leading-relaxed text-white/75"
          >
            <span className={cn('font-serif text-xl', correct ? 'text-gold' : 'text-loss')}>
              {correct ? 'Correct. ' : 'Not quite. '}
            </span>
            {track.check.why}
          </motion.p>
        )}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {picked !== null && !correct && (
            <button
              onClick={() => setPicked(null)}
              className="text-[12px] uppercase tracking-[0.2em] text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              Try again
            </button>
          )}
          <GoldButton solid onClick={() => onPractice(track.practiceCategory)}>
            Practise {track.practiceCategory}
          </GoldButton>
        </div>
      </section>
    </motion.article>
  );
}

export function StudyLuxe({
  currentLevel,
  onPractice,
  onPracticeLevel,
}: {
  currentLevel: number;
  onPractice: (category: string) => void;
  onPracticeLevel: (difficulty: Difficulty) => void;
}) {
  const [done, setDone] = useState<string[]>(readDone);
  const [open, setOpen] = useState<string | null>(null);
  const openIndex = studyTracks.findIndex((t) => t.id === open);
  const nextIndex = Math.max(
    0,
    studyTracks.findIndex((t) => !done.includes(t.id)),
  );
  const next = studyTracks[nextIndex];

  return (
    <div className="relative -mx-4 overflow-hidden rounded-none bg-ink px-5 py-10 text-white md:mx-0 md:rounded-[2rem] md:border md:border-gold/10 md:px-14 md:py-16">
      {/* Warm vignette and a faint gold horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_0%,rgba(201,169,110,0.12),transparent_60%),radial-gradient(60%_50%_at_0%_100%,rgba(201,169,110,0.06),transparent_70%)]"
      />
      <div className="relative">
        {openIndex >= 0 ? (
          <Lesson
            key={studyTracks[openIndex].id}
            track={studyTracks[openIndex]}
            index={openIndex}
            done={done.includes(studyTracks[openIndex].id)}
            onDone={() => {
              const nextDone = [...done, studyTracks[openIndex].id];
              setDone(nextDone);
              writeDone(nextDone);
            }}
            onBack={() => setOpen(null)}
            onPractice={onPractice}
          />
        ) : (
          <div className="flex flex-col gap-16">
            {/* Masthead */}
            <header className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="flex flex-col gap-6"
              >
                <Eyebrow>The Study · Volume I</Eyebrow>
                <h1 className="font-serif text-6xl font-medium leading-[0.95] tracking-[-0.015em] md:text-[5.5rem]">
                  The discipline
                  <br />
                  <em className="font-normal text-gold-soft">behind every trade.</em>
                </h1>
                <p className="max-w-xl text-[15px] leading-relaxed text-white/60">
                  Ten chapters on the habits that separate a process from a gamble. Each one is a
                  short principle, a worked example in rupees, and an examination.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: EASE, delay: 0.2 }}
              >
                <ProgressRing done={done.length} total={studyTracks.length} />
              </motion.div>
            </header>

            {/* Featured chapter */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="relative grid gap-8 overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-[#16130d] via-[#0f0d0a] to-ink p-8 md:grid-cols-[auto_1fr] md:items-center md:p-12"
            >
              <span className="font-serif text-[8rem] leading-[0.75] text-transparent [-webkit-text-stroke:1px_rgba(201,169,110,0.6)] md:text-[11rem]">
                {ROMAN[nextIndex]}
              </span>
              <div className="flex flex-col gap-5">
                <Eyebrow>
                  {done.length === studyTracks.length ? 'Revisit' : 'Your next chapter'}
                </Eyebrow>
                <h2 className="font-serif text-4xl leading-tight md:text-5xl">{next.title}</h2>
                <p className="max-w-xl text-[15px] leading-relaxed text-white/65">{next.summary}</p>
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <GoldButton solid onClick={() => setOpen(next.id)}>
                    Begin chapter
                  </GoldButton>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                    {next.tag} · Level {next.level} · About 5 minutes
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Chapter index */}
            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between gap-4">
                <Eyebrow>Contents</Eyebrow>
                <span className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {done.length} of {studyTracks.length} read
                </span>
              </div>
              <ol className="flex flex-col">
                {studyTracks.map((t, i) => {
                  const read = done.includes(t.id);
                  return (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.5, ease: EASE, delay: i * 0.03 }}
                    >
                      <button
                        onClick={() => {
                          setOpen(t.id);
                          window.scrollTo({ top: 0 });
                        }}
                        className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-gold/10 py-6 text-left transition-colors hover:bg-[linear-gradient(90deg,rgba(201,169,110,0.06),transparent)] md:grid-cols-[5rem_1fr_10rem_6rem_2rem]"
                      >
                        <span className="font-serif text-3xl text-gold/80 transition-colors group-hover:text-gold">
                          {ROMAN[i]}
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className="font-serif text-2xl leading-tight text-white md:text-[1.7rem]">
                            {t.title}
                          </span>
                          <span className="line-clamp-1 text-[13px] text-white/45 md:hidden">
                            {t.tag} · Level {t.level}
                          </span>
                        </span>
                        <span className="hidden text-[11px] uppercase tracking-[0.22em] text-white/45 md:block">
                          {t.tag}
                        </span>
                        <span className="hidden text-[11px] uppercase tracking-[0.22em] md:block">
                          {read ? (
                            <span className="inline-flex items-center gap-1.5 text-gold">
                              <Check className="size-3.5" /> Read
                            </span>
                          ) : (
                            <span className="text-white/35">Level {t.level}</span>
                          )}
                        </span>
                        <ArrowRight className="size-4 text-white/25 transition-all group-hover:translate-x-1 group-hover:text-gold" />
                      </button>
                    </motion.li>
                  );
                })}
              </ol>
            </section>

            {/* Curriculum ledger */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Eyebrow>The curriculum</Eyebrow>
                <p className="max-w-xl text-[14px] text-white/55">
                  Eight levels, earned with XP. Open any level you have reached to practise at its
                  difficulty.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gold/10 bg-gold/10 sm:grid-cols-4">
                {levels.map((name, i) => {
                  const reached = i + 1 <= currentLevel;
                  const current = i + 1 === currentLevel;
                  return (
                    <button
                      key={name}
                      disabled={!reached}
                      onClick={() =>
                        onPracticeLevel(
                          i < 2
                            ? 'Beginner'
                            : i < 4
                              ? 'Intermediate'
                              : i < 6
                                ? 'Advanced'
                                : 'Quant',
                        )
                      }
                      className={cn(
                        'flex min-h-28 flex-col justify-between gap-4 bg-ink p-5 text-left transition-colors',
                        reached ? 'hover:bg-[#13110c]' : 'cursor-not-allowed',
                        current && 'bg-[#15120c]',
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className={cn(
                            'font-serif text-2xl',
                            reached ? 'text-gold' : 'text-white/20',
                          )}
                        >
                          {ROMAN[i]}
                        </span>
                        {current && (
                          <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
                            You are here
                          </span>
                        )}
                      </span>
                      <span>
                        <span
                          className={cn(
                            'block text-[15px]',
                            reached ? 'text-white' : 'text-white/35',
                          )}
                        >
                          {name}
                        </span>
                        <span className="text-[11px] text-white/35">
                          {i === 0 ? 'Start' : `${(i * 1000).toLocaleString('en-IN')} XP`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
