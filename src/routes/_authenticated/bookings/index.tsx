import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { bookingQueries } from '@/lib/bookings/bookings.queries'
import { roomQueries } from '@/lib/rooms/rooms.queries'
import { FeedbackDialog } from '@/components/ui/feedback-dialog'
import { BookingsPageHeader } from '@/components/bookings/BookingsPageHeader'
import { BookingsTable } from '@/components/bookings/BookingsTable'
import { CreateBookingDialog } from '@/components/bookings/CreateBookingDialog'

export const Route = createFileRoute('/_authenticated/bookings/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(bookingQueries.list())
    await context.queryClient.ensureQueryData(roomQueries.list())
  },
  component: BookingsRoute,
})

function BookingsRoute() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-center text-muted-foreground">Loading...</div>}>
      <BookingsListPage />
    </Suspense>
  )
}

function BookingsListPage() {
  const { data: bookings } = useSuspenseQuery(bookingQueries.list())
  const { data: rooms } = useSuspenseQuery(roomQueries.list())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [walkIn, setWalkIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBookings = searchQuery.trim()
    ? bookings.filter((b) => {
        const q = searchQuery.toLowerCase()
        return (
          b.firstName.toLowerCase().includes(q) ||
          b.lastName.toLowerCase().includes(q) ||
          b.bookingRef.toLowerCase().includes(q)
        )
      })
    : bookings

  return (
    <main className="page-wrap px-4 py-6 pb-8">
      <div className="space-y-8">
        <BookingsPageHeader
          onNewReservation={() => {
            setWalkIn(false)
            setIsAddOpen(true)
          }}
          onWalkIn={() => {
            setWalkIn(true)
            setIsAddOpen(true)
          }}
        />

        <BookingsTable
          bookings={filteredBookings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <CreateBookingDialog
          open={isAddOpen}
          onOpenChange={(open) => {
            if (!open) setWalkIn(false)
            setIsAddOpen(open)
          }}
          rooms={rooms}
          bookings={bookings}
          walkIn={walkIn}
          onSuccess={(bookingRef) => {
            setIsAddOpen(false)
            setWalkIn(false)
            setSuccess(`Booking ${bookingRef} created successfully`)
          }}
          onError={(msg) => {
            setError(msg)
          }}
        />

        <FeedbackDialog
          open={error != null}
          onClose={() => setError(null)}
          title="Error"
          message={error}
          type="error"
        />

        <FeedbackDialog
          open={success != null}
          onClose={() => setSuccess(null)}
          title="Success"
          message={success}
          type="success"
        />
      </div>
    </main>
  )
}
