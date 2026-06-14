import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PaymentMethod } from '@/db/schema/enums'
import {
  dynamicSchemaValidators,
  useAppForm,
} from '@/integrations/tanstack-form'
import { bookingMutations } from '@/lib/bookings/bookings.mutations'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import type { BookingWithRoom } from '@/lib/bookings/types'
import { RESERVATION_BALANCE_DESCRIPTION } from '@/lib/ledger/ledger.constants'
import { ledgerQueries } from '@/lib/ledger/ledger.queries'
import { ledgerPaymentFieldsSchema } from '@/lib/ledger/schemas'

import { LedgerPaymentFieldsSection } from './ledger/LedgerPaymentFieldsSection'

type CheckInBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingWithRoom
  bookingId: number
}

export function CheckInBookingDialog({
  open,
  onOpenChange,
  booking,
  bookingId,
}: CheckInBookingDialogProps) {
  const queryClient = useQueryClient()
  const { data: transactions } = useSuspenseQuery(
    ledgerQueries.transactions(bookingId),
  )

  const roomBalance = transactions.find(
    (row) =>
      !row.isPaid &&
      row.category === 'ROOM_CHARGE' &&
      row.description === RESERVATION_BALANCE_DESCRIPTION,
  )

  const mutation = useMutation(bookingMutations.checkIn(queryClient, bookingId))

  const form = useAppForm({
    defaultValues: {
      paymentMethod: 'CASH' as PaymentMethod,
      referenceNumber: '',
    },
    ...dynamicSchemaValidators(ledgerPaymentFieldsSchema),
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        bookingRef: booking.bookingRef,
        paymentMethod: value.paymentMethod,
        referenceNumber: value.referenceNumber,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const balanceAmount = roomBalance ? Number(roomBalance.amount) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Check in guest</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.AppForm>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Guest:</span>{' '}
                {booking.firstName} {booking.lastName}
              </p>
              <p>
                <span className="text-muted-foreground">Room:</span>{' '}
                {booking.roomNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Stay:</span>{' '}
                {format(new Date(booking.checkInDate), 'MMM d, yyyy')} at{' '}
                {booking.checkInTime} –{' '}
                {format(new Date(booking.checkOutDate), 'MMM d, yyyy')} at{' '}
                {booking.checkOutTime}
              </p>
              <p className="font-medium pt-1">
                Room balance due: {formatPeso(balanceAmount)}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Collect the full room balance before checking the guest in.
            </p>

            <LedgerPaymentFieldsSection form={form} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <form.SubmitButton label="Check in & record payment" />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  )
}
