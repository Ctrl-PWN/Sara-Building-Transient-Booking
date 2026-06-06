import type { rooms } from '@/db/schema'
import {
  calculateReservationFee,
  calculateStayPricing,
  formatPeso,
} from '@/lib/bookings/stay-pricing'

import type { CreateBookingForm } from './create-booking-form.types'

type Room = typeof rooms.$inferSelect

type CreateBookingPricingSummaryProps = {
  form: CreateBookingForm
  rooms: Room[]
  walkIn: boolean
}

export function CreateBookingPricingSummary({
  form,
  rooms,
  walkIn,
}: CreateBookingPricingSummaryProps) {
  return (
    <form.Subscribe
      selector={(state) => ({
        roomId: state.values.roomId,
        checkInDate: state.values.checkInDate,
        checkOutDate: state.values.checkOutDate,
        reservationFeeType:
          'reservationFeeType' in state.values
            ? state.values.reservationFeeType
            : 'PERCENT',
        reservationFeeValue:
          'reservationFeeValue' in state.values
            ? state.values.reservationFeeValue
            : 0,
      })}
    >
      {({
        roomId,
        checkInDate: start,
        checkOutDate: end,
        reservationFeeType,
        reservationFeeValue,
      }) => {
        const selectedRoom = rooms.find((room) => room.id.toString() === roomId)
        if (!selectedRoom || !start || !end) return null

        const { nights, subtotal } = calculateStayPricing({
          basePrice: selectedRoom.basePrice,
          checkInDate: start,
          checkOutDate: end,
        })

        if (walkIn) {
          return (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Stay total ({nights} night
                  {nights === 1 ? '' : 's'})
                </span>
                <span className="font-medium">{formatPeso(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Amount due now</span>
                <span>{formatPeso(subtotal)}</span>
              </div>
            </div>
          )
        }

        const deposit = calculateReservationFee({
          total: subtotal,
          feeType: reservationFeeType,
          feeValue: reservationFeeValue,
        })
        const balance = Math.max(0, subtotal - deposit)

        return (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Stay total ({nights} night
                {nights === 1 ? '' : 's'})
              </span>
              <span className="font-medium">{formatPeso(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Reservation fee (due now)
              </span>
              <span className="font-medium">{formatPeso(deposit)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Balance due at check-in</span>
              <span>{formatPeso(balance)}</span>
            </div>
          </div>
        )
      }}
    </form.Subscribe>
  )
}
