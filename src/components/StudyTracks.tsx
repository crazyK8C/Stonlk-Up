import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, X } from 'lucide-react';
import { levels } from '../../shared/types';
import { studyTracks, type StudyTrack } from '../content/study';

const STORAGE_KEY = 'stonkup.study.done';

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

function Lesson({
  track,
  done,
  onDone,
  onBack,
  onPractice,
}: {
  track: StudyTrack;
  done: boolean;
  onDone: () => void;
  onBack: () => void;
  onPractice: (category: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === track.check.answer;
  return (
    <article className="lesson">
      <button className="text-link" onClick={onBack}>
        <ArrowLeft size={16} /> All skill tracks
      </button>
      <div className="lesson-head">
        <span className="track-tag">{track.tag}</span>
        <span className="muted small">
          Level {track.level} · {levels[track.level - 1]}
        </span>
      </div>
      <h2>{track.title}</h2>
      <p className="lesson-summary">{track.summary}</p>
      <div className="lesson-grid">
        <section className="content-panel">
          <h3>Key ideas</h3>
          <ul className="lesson-ideas">
            {track.ideas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </section>
        <section className="content-panel">
          <h3>
            <Lightbulb size={16} /> Worked example
          </h3>
          <p>{track.example.setup}</p>
          <ol className="lesson-steps">
            {track.example.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="lesson-result">{track.example.result}</p>
        </section>
      </div>
      <section className="content-panel lesson-check">
        <h3>Quick check</h3>
        <p>{track.check.question}</p>
        <div className="answer-options">
          {track.check.options.map((option, i) => (
            <button
              key={option}
              disabled={picked !== null}
              className={
                'answer-option ' +
                (picked === null
                  ? ''
                  : i === track.check.answer
                    ? 'correct'
                    : i === picked
                      ? 'wrong'
                      : '')
              }
              onClick={() => {
                setPicked(i);
                if (i === track.check.answer && !done) onDone();
              }}
            >
              <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {picked !== null && i === track.check.answer ? (
                <CheckCircle2 size={19} />
              ) : picked === i ? (
                <X size={19} />
              ) : (
                <span className="radio-dot" />
              )}
            </button>
          ))}
        </div>
        {picked !== null && (
          <p className="lesson-why" role="status">
            <strong>{correct ? 'Right. ' : 'Not quite. '}</strong>
            {track.check.why}
          </p>
        )}
        <div className="lesson-actions">
          {picked !== null && !correct && (
            <button className="guest-btn" onClick={() => setPicked(null)}>
              Try again
            </button>
          )}
          <button className="primary-btn" onClick={() => onPractice(track.practiceCategory)}>
            Practice {track.practiceCategory.toLowerCase()} questions
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </article>
  );
}

export function StudyTracks({ onPractice }: { onPractice: (category: string) => void }) {
  const [done, setDone] = useState<string[]>(readDone);
  const [open, setOpen] = useState<string | null>(null);
  const track = studyTracks.find((t) => t.id === open);
  if (track)
    return (
      <Lesson
        key={track.id}
        track={track}
        done={done.includes(track.id)}
        onDone={() => {
          const next = [...done, track.id];
          setDone(next);
          writeDone(next);
        }}
        onBack={() => setOpen(null)}
        onPractice={onPractice}
      />
    );
  return (
    <>
      <div className="track-progress">
        <strong>
          {done.length}/{studyTracks.length}
        </strong>
        <span>skill tracks checked off</span>
        <div className="progress-track">
          <span style={{ width: `${(done.length / studyTracks.length) * 100}%` }} />
        </div>
      </div>
      <div className="track-grid">
        {studyTracks.map((t) => (
          <button
            key={t.id}
            className={'track-card ' + (done.includes(t.id) ? 'done' : '')}
            onClick={() => {
              setOpen(t.id);
              window.scrollTo({ top: 0 });
            }}
          >
            <span className="track-card-top">
              <span className="track-tag">{t.tag}</span>
              {done.includes(t.id) ? (
                <CheckCircle2 size={18} aria-label="Completed" />
              ) : (
                <span className="muted small">Lvl {t.level}</span>
              )}
            </span>
            <strong>{t.title}</strong>
            <span className="track-summary">{t.summary}</span>
            <span className="track-cta">
              {done.includes(t.id) ? 'Review' : 'Start'} <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
