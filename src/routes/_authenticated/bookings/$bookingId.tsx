import { Suspense, useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  bookingKeys,
  bookingQueries,
  roomKeys,
} from '@/lib/bookings/bookings.queries'
import type { BookingStatus } from '@/lib/bookings/bookings.actions'
import { updateBookingStatus } from '@/lib/bookings/bookings.actions'
import { ArrowLeft } from '@phosphor-icons/react'
import { Spinner } from '@/components/ui/spinner'
import { BookingDetailHeader } from '@/components/bookings/BookingDetailHeader'
import { BookingInfoCards } from '@/components/bookings/BookingInfoCards'
import { CancelBookingDialog } from '@/components/bookings/CancelBookingDialog'
import { EvictBookingDialog } from '@/components/bookings/EvictBookingDialog'

function BookingNotFound() {
  return (
    <main className="page-wrap px-4 py-6 pb-8">
      <div className="space-y-8">
        <Link
          to="/bookings"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Bookings
        </Link>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Booking not found.</p>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  loader: async ({ params, context }) => {
    try {
      await context.queryClient.ensureQueryData(
        bookingQueries.detail(Number(params.bookingId)),
      )
    } catch {
      throw notFound()
    }
  },
  notFoundComponent: BookingNotFound,
  component: BookingDetailRoute,
})

function BookingDetailRoute() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap px-4 py-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-6 text-muted-foreground animate-spin" />
          </div>
        </main>
      }
    >
      <BookingDetailPage />
    </Suspense>
  )
}

function BookingDetailPage() {
  const { bookingId } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: booking } = useSuspenseQuery(
    bookingQueries.detail(Number(bookingId)),
  )
  const [cancelOpen, setCancelOpen] = useState(false)
  const [evictOpen, setEvictOpen] = useState(false)

  const updateStatus = useMutation({
    mutationFn: (data: {
      bookingRef: string
      status: BookingStatus
      cancellationReason?: string
      evictionReason?: string
    }) => updateBookingStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all })
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })

  const handleCancel = (reason: string) => {
    updateStatus.mutate({
      bookingRef: booking.bookingRef,
      status: 'CANCELLED',
      cancellationReason: reason,
    })
    setCancelOpen(false)
  }

  const handleEvict = (reason: string) => {
    updateStatus.mutate({
      bookingRef: booking.bookingRef,
      status: 'EVICTED',
      evictionReason: reason,
    })
    setEvictOpen(false)
  }

  const handleCheckIn = () => {
    updateStatus.mutate({
      bookingRef: booking.bookingRef,
      status: 'CHECKED_IN',
    })
  }

  const handleCheckOut = () => {
    updateStatus.mutate({
      bookingRef: booking.bookingRef,
      status: 'CHECKED_OUT',
    })
  }

  return (
    <main className="page-wrap px-4 py-6 pb-8">
      <div className="space-y-8">
        <BookingDetailHeader
          booking={booking}
          onCancelClick={() => setCancelOpen(true)}
          onEvictClick={() => setEvictOpen(true)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />

        <BookingInfoCards booking={booking} />

        <CancelBookingDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          bookingRef={booking.bookingRef}
          guestName={`${booking.firstName} ${booking.lastName}`}
          onConfirm={handleCancel}
        />

        <EvictBookingDialog
          open={evictOpen}
          onOpenChange={setEvictOpen}
          guestName={`${booking.firstName} ${booking.lastName}`}
          roomNumber={booking.roomNumber}
          onConfirm={handleEvict}
        />
      </div>
    </main>
  )
}
