import type { PaymentMethod } from '@/db/schema/enums'
import type { CreateBookingLedgerLine } from '@/lib/ledger/schemas'
import { createBookingLedgerLinesSchema } from '@/lib/ledger/schemas'

import type { CreateBookingFormValues } from './schemas'
import type { ReservationFeeType } from './stay-pricing'
import { calculateReservationFee, toDecimalString } from './stay-pricing'

export { createBookingLedgerLinesSchema }

export type CreateBookingLedgerInput = {
  walkIn: boolean
  paymentMethod: PaymentMethod
  referenceNumber?: string
  reservationFeeType?: ReservationFeeType
  reservationFeeValue?: number
}

export function buildCreateBookingLedgerLines(
  values: CreateBookingFormValues | CreateBookingLedgerInput,
  stayTotal: number,
): CreateBookingLedgerLine[] {
  if (stayTotal <= 0) {
    throw new Error('Stay total must be greater than zero')
  }

  const paymentFields = {
    paymentMethod: values.paymentMethod,
    referenceNumber: values.referenceNumber?.trim() || undefined,
  }

  if (values.walkIn) {
    const lines: CreateBookingLedgerLine[] = [
      {
        category: 'ROOM_CHARGE',
        amount: toDecimalString(stayTotal),
        isPaid: true,
        description: 'Room charge (walk-in)',
        ...paymentFields,
      },
    ]

    return createBookingLedgerLinesSchema.parse(lines)
  }

  if (values.reservationFeeType == null || values.reservationFeeValue == null) {
    throw new Error('Reservation fee type and value are required')
  }

  const deposit = calculateReservationFee({
    total: stayTotal,
    feeType: values.reservationFeeType,
    feeValue: values.reservationFeeValue,
  })

  if (deposit <= 0) {
    throw new Error('Reservation deposit must be greater than zero')
  }

  if (deposit > stayTotal) {
    throw new Error('Reservation deposit cannot exceed stay total')
  }

  const balance = stayTotal - deposit

  const lines: CreateBookingLedgerLine[] = [
    {
      category: 'DEPOSIT',
      amount: toDecimalString(deposit),
      isPaid: true,
      description: 'Reservation deposit',
      ...paymentFields,
    },
    {
      category: 'ROOM_CHARGE',
      amount: toDecimalString(balance),
      isPaid: false,
      description: 'Room charge balance due at check-in',
    },
  ]

  return createBookingLedgerLinesSchema.parse(lines)
}
