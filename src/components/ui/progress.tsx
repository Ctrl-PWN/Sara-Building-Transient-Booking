import type * as React from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = {
  value: number
  className?: string
  completeClassName?: string
  'aria-label'?: string
}

function Progress({
  value,
  className,
  completeClassName,
  'aria-label': ariaLabel = 'Progress',
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const isComplete = clamped === 100

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-[width] duration-300 ease-out',
          isComplete && (completeClassName ?? 'bg-emerald-600 dark:bg-emerald-500'),
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export { Progress }
export type { ProgressProps }
