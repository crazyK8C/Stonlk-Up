import { cn } from '@/lib/utils';

// The Stonk Up mark: a rising line inside a rounded frame. The splash screen animates
// the same paths, so keep the geometry here as the single source.
export const LOGO_FRAME = 'M6 2h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z';
export const LOGO_LINE = 'M8 21l5-5 4 3 7-8';
export const LOGO_ARROW = 'M19 11h5v5';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-8', className)}
      fill="none"
      role="img"
      aria-label="Stonk Up"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b8cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path d={LOGO_FRAME} fill="url(#logo-grad)" />
      <path
        d={LOGO_LINE}
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={LOGO_ARROW}
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[15px] font-semibold tracking-[-0.02em]', className)}>
      Stonk <span className="text-muted-foreground">Up</span>
    </span>
  );
}
