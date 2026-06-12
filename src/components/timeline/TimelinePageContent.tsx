import { CalendarBlankIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { BookingOverviewSheet } from '@/components/timeline/BookingOverviewSheet'
import { TimelineGrid } from '@/components/timeline/TimelineGrid'
import { TimelineStatusLegend } from '@/components/timeline/TimelineStatusLegend'
import { TimelineWeekNav } from '@/components/timeline/TimelineWeekNav'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { timelineQueries } from '@/lib/timeline/timeline.queries'
import { formatWeekOfYearLabel, formatWeekRange } from '@/lib/timeline/week'

export type TimelinePageContentProps = {
  weekStart: string
}

export function TimelinePageContent({ weekStart }: TimelinePageContentProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null,
  )

  const { data } = useSuspenseQuery(timelineQueries.week(weekStart))

  const selectedBooking =
    data.bookings.find((booking) => booking.id === selectedBookingId) ?? null

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[1280px] flex-col gap-6 px-4 py-6 pb-8">
      <PageHeader
        title="Booking & Calendar"
        description={`${formatWeekRange(weekStart)} · ${formatWeekOfYearLabel(weekStart)}`}
        actions={
          <div className="flex flex-col gap-3">
            <TimelineStatusLegend />
            <TimelineWeekNav weekStart={weekStart} />
          </div>
        }
      />
      <Separator className="opacity-40" />

      {data.rooms.length === 0 ? (
        <Empty className="block-card border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarBlankIcon />
            </EmptyMedia>
            <EmptyTitle>No rooms configured</EmptyTitle>
            <EmptyDescription>
              Add rooms to start scheduling bookings on the timeline.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TimelineGrid
          days={data.days}
          rooms={data.rooms}
          bookings={data.bookings}
          weekStart={data.weekStart}
          weekEnd={data.weekEnd}
          selectedBookingId={selectedBookingId}
          onSelectBooking={setSelectedBookingId}
        />
      )}

      <BookingOverviewSheet
        booking={selectedBooking}
        open={selectedBookingId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null)
        }}
      />
    </main>
  )
}
