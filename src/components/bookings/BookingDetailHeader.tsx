import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BookingWithRoom } from '@/lib/bookings/types'
import { computeBookingDisplayStatus } from '@/lib/bookings/status'

const statusColorMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  RESERVED: 'warning',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'outline',
  CANCELLED: 'destructive',
  EVICTED: 'destructive',
  OVERDUE: 'destructive',
}

const isNonRefundable = (depositPctSnapshot: string) =>
  Number(depositPctSnapshot) >= 100

const canCancel = (status: string) => ['RESERVED'].includes(status)

const canCheckIn = (status: string) => ['RESERVED'].includes(status)

const canCheckOut = (status: string) => ['CHECKED_IN'].includes(status)

const canEvict = (status: string, paymentStatus: string) =>
  status === 'CHECKED_IN' && paymentStatus === 'PAID_IN_FULL'

type BookingDetailHeaderProps = {
  booking: BookingWithRoom
  onCancelClick: () => void
  onEvictClick: () => void
  onCheckIn: () => void
  onCheckOut: () => void
}

export function BookingDetailHeader({
  booking,
  onCancelClick,
  onEvictClick,
  onCheckIn,
  onCheckOut,
}: BookingDetailHeaderProps) {
  const displayStatus = computeBookingDisplayStatus(
    booking.status,
    booking.checkOutDate,
  )

  return (
    <div>
      <Link
        to="/bookings"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeftIcon className="mr-2" size={16} />
        Back to Bookings
      </Link>
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-serif tracking-tight text-foreground">
              {booking.bookingRef}
            </h2>
            <Badge variant={statusColorMap[displayStatus]}>
              {displayStatus.replace('_', ' ')}
            </Badge>
            {booking.paymentStatus === 'OVERDUE' && (
              <Badge variant="destructive">OVERDUE</Badge>
            )}
            {isNonRefundable(booking.depositPctSnapshot) && (
              <Badge variant="destructive">NON-REFUNDABLE</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Guest: {booking.firstName} {booking.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          {canCancel(booking.status) && (
            <Button variant="outline" onClick={onCancelClick}>
              Cancel
            </Button>
          )}
          {canCheckIn(booking.status) && (
            <Button onClick={onCheckIn}>Check In</Button>
          )}
          {canCheckOut(booking.status) && (
            <Button onClick={onCheckOut}>Check Out</Button>
          )}
          {canEvict(booking.status, booking.paymentStatus) && (
            <Button variant="destructive" onClick={onEvictClick}>
              Evict
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
