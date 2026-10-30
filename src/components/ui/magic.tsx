// Magic UI pieces (bento grid, number ticker, border beam) and a spotlight card,
// adapted to this project's tokens. Used sparingly: one beam per screen at most.
import * as React from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

export function BentoGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 md:grid-cols-6 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-700 [&>*]:[animation-fill-mode:both] [&>*:nth-child(2)]:[animation-delay:75ms] [&>*:nth-child(3)]:[animation-delay:150ms] [&>*:nth-child(4)]:[animation-delay:200ms] [&>*:nth-child(5)]:[animation-delay:300ms] [&>*:nth-child(6)]:[animation-delay:300ms] [&>*:nth-child(7)]:[animation-delay:500ms] [&>*:nth-child(8)]:[animation-delay:500ms] [&>*:nth-child(9)]:[animation-delay:700ms]',
        className,
      )}
      {...props}
    />
  );
}

/** Card with a soft light that follows the pointer. */
export function SpotlightCard({ className, children, ...props }: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !ref.current) return;
    ref.current.style.setProperty('--x', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.8)] transition-colors hover:border-[#33333a]',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), rgba(61,123,255,0.10), transparent 60%)',
        }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}

/** Counts up to `value` once the number scrolls into view. */
export function NumberTicker({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 120 });
  const inView = useInView(ref, { once: true, margin: '0px' });
  const format = React.useCallback(
    (n: number) =>
      prefix +
      Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(n) +
      suffix,
    [decimals, prefix, suffix],
  );
  React.useEffect(() => {
    if (!inView) return;
    motionValue.set(value);
    // Always land on the real number, even where animation frames don't run
    // (background tabs, thumbnails) or the visitor prefers reduced motion.
    const settle = setTimeout(() => {
      if (ref.current) ref.current.textContent = format(value);
    }, 1800);
    return () => clearTimeout(settle);
  }, [inView, motionValue, value, format]);
  React.useEffect(
    () =>
      spring.on('change', (v) => {
        if (ref.current) ref.current.textContent = format(v);
      }),
    [spring, format],
  );
  return (
    <span ref={ref} className={cn('tabular-nums', className)} aria-label={format(value)}>
      {format(value)}
    </span>
  );
}

/** An animated beam of light travelling around the card's border. */
export function BorderBeam({
  size = 120,
  duration = 8,
  colorFrom = '#3d7bff',
  colorTo = '#a78bfa',
  className,
}: {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration }}
      />
    </div>
  );
}
