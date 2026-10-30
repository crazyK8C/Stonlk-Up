// shadcn/ui Progress (new-york), as a plain element so it needs no Radix dependency.
import * as React from 'react';
import { cn } from '@/lib/utils';

function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: React.ComponentProps<'div'> & { value?: number; indicatorClassName?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      data-slot="progress"
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-[width] duration-700 ease-out',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function Separator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div role="separator" className={cn('h-px w-full shrink-0 bg-border', className)} {...props} />
  );
}

export { Progress, Separator };
