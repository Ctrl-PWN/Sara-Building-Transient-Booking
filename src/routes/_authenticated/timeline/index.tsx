import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { TimelinePageContent } from '@/components/timeline/TimelinePageContent'
import { timelineSearchSchema } from '@/lib/bookings/schemas'
import { timelineQueries } from '@/lib/timeline/timeline.queries'
import { resolveWeekStart } from '@/lib/timeline/week'
import { TimelinePageFallback } from '@/components/timeline/TimelinePageFallback'

export const Route = createFileRoute('/_authenticated/timeline/')({
  validateSearch: (search) => timelineSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ week: search.week }),
  loader: async ({ context, deps }) => {
    const weekStart = resolveWeekStart(deps.week)
    await context.queryClient.ensureQueryData(timelineQueries.week(weekStart))
    return { weekStart }
  },
  component: TimelineRoute,
})

function TimelineRoute() {
  const { weekStart } = Route.useLoaderData()

  return (
    <Suspense fallback={<TimelinePageFallback weekStart={weekStart} />}>
      <TimelinePageContent weekStart={weekStart} />
    </Suspense>
  )
}
