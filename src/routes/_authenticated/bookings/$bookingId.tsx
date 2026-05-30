import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const statusColorMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  RESERVED: 'warning',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'outline',
  CANCELLED: 'destructive',
  EVICTED: 'destructive',
}

const isNonRefundable = (booking: { depositPctSnapshot: string }) =>
  Number(booking.depositPctSnapshot) >= 100

const canCancel = (status: string) =>
  ['RESERVED'].includes(status)

const canCheckIn = (status: string) =>
  ['RESERVED'].includes(status)

const canCheckOut = (status: string) =>
  ['CHECKED_IN'].includes(status)

const canEvict = (status: string, depositPct: string) =>
  status === 'CHECKED_IN' && Number(depositPct) >= 100

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  component: BookingDetailPage,
})

function BookingDetailPage() {
  const { bookingId } = Route.useParams()
  const { bookings, updateBooking, cancelBooking, init } = useStore()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [evictOpen, setEvictOpen] = useState(false)
  const [evictReason, setEvictReason] = useState('')

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

  const handleCancel = async () => {
    await cancelBooking(booking.id, cancelReason || 'Cancelled by staff')
    setCancelOpen(false)
    setCancelReason('')
  }

  const handleEvict = async () => {
    await updateBooking(booking.id, { status: 'EVICTED' })
    setEvictOpen(false)
    setEvictReason('')
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
                {isNonRefundable(booking) && (
                  <Badge variant="destructive">NON-REFUNDABLE</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Guest: {booking.firstName} {booking.lastName}
              </p>
            </div>
            <div className="flex gap-2">
              {canCancel(booking.status) && (
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  Cancel
                </Button>
              )}
              {canCheckIn(booking.status) && (
                <Button
                  onClick={() =>
                    updateBooking(booking.id, { status: 'CHECKED_IN' })
                  }
                >
                  Check In
                </Button>
              )}
              {canCheckOut(booking.status) && (
                <Button
                  onClick={() =>
                    updateBooking(booking.id, { status: 'CHECKED_OUT' })
                  }
                >
                  Check Out
                </Button>
              )}
              {canEvict(booking.status, booking.depositPctSnapshot) && (
                <Button variant="destructive" onClick={() => setEvictOpen(true)}>
                  Evict
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
                <p className="font-medium mt-1">{format(parseISO(booking.checkInDate), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium mt-1">{format(parseISO(booking.checkOutDate), 'MMMM d, yyyy')}</p>
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel {booking.bookingRef} for{' '}
              {booking.firstName} {booking.lastName}?
            </p>
            <div className="space-y-2">
              <Label>Cancellation Reason</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evictOpen} onOpenChange={setEvictOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Evict Guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This is a non-refundable booking. Evicting {booking.firstName}{' '}
              {booking.lastName} from {booking.roomSnapshot.roomNumber}.
            </p>
            <div className="space-y-2">
              <Label>Eviction Reason</Label>
              <Input
                value={evictReason}
                onChange={(e) => setEvictReason(e.target.value)}
                placeholder="Reason for eviction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvictOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEvict}>
              Confirm Eviction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
