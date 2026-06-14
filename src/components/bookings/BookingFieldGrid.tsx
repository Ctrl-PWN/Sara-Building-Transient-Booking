import { format, parseISO } from 'date-fns'

import type { ReactNode } from 'react'

import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import {
  computeBookingDisplayStatus,
  formatPaymentStatus,
} from '@/lib/bookings/status'
import type { BookingWithRoom } from '@/lib/bookings/types'
import { formatGuestName } from '@/lib/bookings/types'

type BookingFieldGridProps = {
  booking: BookingWithRoom
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground m-0">
        {label}
      </p>
      <div className="font-body text-sm text-foreground">{value}</div>
    </div>
  )
}

function formatDate(date: string, time?: string) {
  const formatted = format(parseISO(date), 'EEE d MMM yyyy')
  return time ? `${formatted} at ${time}` : formatted
}

export function BookingFieldGrid({ booking }: BookingFieldGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Guest" value={formatGuestName(booking)} />
      <Field label="Reference" value={booking.bookingRef} />
      <Field label="Contact" value={booking.contactNumber ?? 'Not provided'} />
      <Field label="Room" value={booking.roomNumber} />
      <Field
        label="Check-in"
        value={formatDate(booking.checkInDate, booking.checkInTime)}
      />
      <Field
        label="Check-out"
        value={formatDate(booking.checkOutDate, booking.checkOutTime)}
      />
      <Field label="Occupants" value={booking.occupantsCount} />
      <Field
        label="Status"
        value={
          <BookingStatusBadge
            status={computeBookingDisplayStatus(
              booking.status,
              booking.checkOutDate,
              booking.checkOutTime,
            )}
          />
        }
      />
      <Field
        label="Payment"
        value={formatPaymentStatus(booking.paymentStatus)}
      />
    </div>
  )
}
