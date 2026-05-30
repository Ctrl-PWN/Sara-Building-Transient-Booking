import { Suspense } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { BookingFieldGrid } from '@/components/bookings/BookingFieldGrid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { bookingQueries } from '@/lib/bookings/bookings.queries'

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  loader: async ({ context, params }) => {
    const id = Number(params.bookingId)
    if (!Number.isInteger(id) || id <= 0) {
      throw notFound()
    }

    try {
      await context.queryClient.ensureQueryData(bookingQueries.detail(id))
    } catch {
      throw notFound()
    }

    return { id }
  },
  component: BookingDetailPage,
})

function BookingDetailPage() {
  const { id } = Route.useLoaderData()

  return (
    <Suspense fallback={<BookingDetailFallback bookingId={id} />}>
      <BookingDetailContent id={id} />
    </Suspense>
  )
}

function BookingDetailContent({ id }: { id: number }) {
  const { data: booking } = useSuspenseQuery(bookingQueries.detail(id))

  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title={`Booking ${booking.bookingRef}`}
        description="Full booking information for operational review."
        actions={
          <Button variant="outline" render={<Link to="/bookings" />}>
            Back to list
          </Button>
        }
      />

      <section className="block-card p-5">
        <BookingFieldGrid booking={booking} />
      </section>
    </main>
  )
}

function BookingDetailFallback({ bookingId }: { bookingId: number }) {
  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title={`Booking ${bookingId}`}
        description="Full booking information for operational review."
      />
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}
