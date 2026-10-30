import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LOGO_ARROW, LOGO_FRAME, LOGO_LINE } from './Logo';

const EASE = [0.22, 1, 0.36, 1] as const;
const WORD = 'Stonk Up';
export const SPLASH_KEY = 'stonkup.splash.seen';

/** Logo intro shown once per browser session. Click or press any key to skip. */
export function Splash({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const total = reduced ? 600 : 2600;
  useEffect(() => {
    const t = setTimeout(onDone, total);
    const skip = () => onDone();
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, total]);

  const draw = (delay: number, duration = 0.9) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { delay, duration, ease: EASE }, opacity: { delay, duration: 0.01 } },
  });

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-[#050506]"
      onClick={onDone}
      role="status"
      aria-label="Loading Stonk Up"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: reduced ? 0.2 : 0.7, ease: EASE }}
    >
      {/* Soft halo behind the mark */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute size-[520px] rounded-full bg-[radial-gradient(circle,rgba(61,123,255,0.22)_0%,rgba(139,92,246,0.10)_40%,transparent_70%)]"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />
      <div className="relative flex flex-col items-center gap-7">
        <motion.svg
          viewBox="0 0 32 32"
          className="size-24 overflow-visible"
          fill="none"
          aria-hidden="true"
          initial={{ scale: 0.85, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <defs>
            <linearGradient
              id="splash-grad"
              x1="0"
              y1="0"
              x2="32"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#5b8cff" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <motion.path
            d={LOGO_FRAME}
            stroke="url(#splash-grad)"
            strokeWidth="1.2"
            {...draw(0.1, 1)}
          />
          <motion.path
            d={LOGO_FRAME}
            fill="url(#splash-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.6, ease: EASE }}
          />
          <motion.path
            d={LOGO_LINE}
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...draw(1.05, 0.7)}
          />
          <motion.path
            d={LOGO_ARROW}
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...draw(1.55, 0.35)}
          />
        </motion.svg>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex text-4xl font-semibold tracking-[-0.03em] md:text-5xl"
            aria-hidden="true"
          >
            {WORD.split('').map((ch, i) => (
              <motion.span
                key={i}
                className={i >= 6 ? 'text-muted-foreground' : undefined}
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.9 + i * 0.05, duration: 0.6, ease: EASE }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </div>
          <motion.p
            className="text-sm tracking-wide text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            Train the decision before you risk the money.
          </motion.p>
        </div>
        <div className="h-px w-40 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <motion.div
            className="h-full bg-gradient-to-r from-[#5b8cff] to-[#8b5cf6]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: total / 1000 - 0.2, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
