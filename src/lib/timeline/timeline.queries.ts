import { queryOptions } from '@tanstack/react-query'

import { getTimelineWeek } from './timeline.functions'

export const timelineKeys = {
  all: ['timeline'] as const,
  weeks: () => [...timelineKeys.all, 'week'] as const,
  week: (weekStart: string) => [...timelineKeys.weeks(), weekStart] as const,
}

export const timelineQueries = {
  week: (weekStart: string) =>
    queryOptions({
      queryKey: timelineKeys.week(weekStart),
      queryFn: () => getTimelineWeek({ data: { weekStart } }),
      staleTime: 60_000,
    }),
}
