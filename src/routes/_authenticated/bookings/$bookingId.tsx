import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusColorMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  RESERVED: 'warning',
  CONFIRMED: 'default',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'outline',
  CANCELLED: 'destructive',
}

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  component: BookingDetailPage,
})

function BookingDetailPage() {
  const { bookingId } = Route.useParams()
  const { bookings, updateBooking, init } = useStore()

  useEffect(() => {
    init()
  }, [])

  const booking = bookings.find((b) => b.id === Number(bookingId))

  if (!booking) {
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

  return (
    <main className="page-wrap px-4 py-6 pb-8">
      <div className="space-y-8">
        <div>
          <Link
            to="/bookings"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Bookings
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-serif tracking-tight text-foreground">
                  {booking.bookingRef}
                </h2>
                <Badge variant={statusColorMap[booking.status]}>
                  {booking.status.replace('_', ' ')}
                </Badge>
                {booking.paymentStatus === 'OVERDUE' && (
                  <Badge variant="destructive">OVERDUE</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Guest: {booking.firstName} {booking.lastName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Record Payment</Button>
              {booking.status === 'CONFIRMED' && (
                <Button
                  onClick={() =>
                    updateBooking(booking.id, { status: 'CHECKED_IN' })
                  }
                >
                  Check In
                </Button>
              )}
              {booking.status === 'RESERVED' && (
                <Button
                  onClick={() =>
                    updateBooking(booking.id, { status: 'CONFIRMED' })
                  }
                >
                  Confirm
                </Button>
              )}
              {booking.status === 'CHECKED_IN' && (
                <Button
                  onClick={() =>
                    updateBooking(booking.id, { status: 'CHECKED_OUT' })
                  }
                >
                  Check Out
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium mt-1">{booking.checkInDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium mt-1">{booking.checkOutDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="font-medium mt-1">
                  {booking.roomSnapshot.roomNumber} ({booking.roomSnapshot.type})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupants</p>
                <p className="font-medium mt-1">{booking.occupantsCount} Pax</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium mt-1">
                  {booking.firstName} {booking.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium mt-1">
                  {booking.contactNumber || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
