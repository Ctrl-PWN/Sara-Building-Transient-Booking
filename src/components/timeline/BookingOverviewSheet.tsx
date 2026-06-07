import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { BookingFieldGrid } from '@/components/bookings/BookingFieldGrid'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { bookingQueries } from '@/lib/bookings/bookings.queries'
import type { BookingWithRoom } from '@/lib/bookings/types'

type BookingOverviewSheetProps = {
  booking: BookingWithRoom | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingOverviewSheet({
  booking,
  open,
  onOpenChange,
}: BookingOverviewSheetProps) {
  const detailQuery = useQuery({
    ...bookingQueries.detail(booking?.id ?? 0),
    enabled: open && booking != null,
  })

  const displayBooking = detailQuery.data ?? booking

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">
            {displayBooking
              ? `Booking ${displayBooking.bookingRef}`
              : 'Booking'}
          </SheetTitle>
          <SheetDescription>
            Quick review without leaving the timeline.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {displayBooking ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <BookingFieldGrid booking={displayBooking} />
            {detailQuery.isFetching && !detailQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Refreshing details…
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-4">
            <Spinner />
          </div>
        )}

        {displayBooking ? (
          <SheetFooter>
            <Button
              nativeButton={false}
              render={
                <Link
                  to="/bookings/$bookingId"
                  params={{ bookingId: String(displayBooking.id) }}
                />
              }
            >
              View full details
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
