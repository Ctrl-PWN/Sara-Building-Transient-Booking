import { formatWeekRange, formatWeekOfYearLabel } from '@/lib/timeline/week'
import { PageHeader } from '../layout/PageHeader'
import { Skeleton } from '../ui/skeleton'
import type { TimelinePageContentProps } from './TimelinePageContent'
import { TimelineStatusLegend } from './TimelineStatusLegend'
import { TimelineWeekNav } from './TimelineWeekNav'

export function TimelinePageFallback({ weekStart }: TimelinePageContentProps) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[1280px] flex-col gap-6 px-4 py-6 pb-8">
      <PageHeader
        title="Booking & Calendar"
        description={`${formatWeekRange(weekStart)} · ${formatWeekOfYearLabel(weekStart)}`}
        actions={
          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <TimelineStatusLegend />
            <TimelineWeekNav weekStart={weekStart} />
          </div>
        }
      />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-[min(70vh,48rem)] w-full rounded-xl" />
    </main>
  )
}
