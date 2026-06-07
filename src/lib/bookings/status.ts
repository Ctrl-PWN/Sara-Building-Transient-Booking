import type { TimelineLegendStatus } from './types'

export type BookingStatusPresentation = {
  label: string
  legendLabel: string
  colorVar: string
}

export type DerivedBookingStatus = TimelineLegendStatus | 'OVERDUE'

const presentationByStatus: Record<
  DerivedBookingStatus,
  BookingStatusPresentation
> = {
  RESERVED: {
    label: 'Reserved',
    legendLabel: 'Reserved',
    colorVar: '--status-reserved',
  },
  CHECKED_IN: {
    label: 'Checked-In',
    legendLabel: 'Checked-In',
    colorVar: '--status-occupied',
  },
  CHECKED_OUT: {
    label: 'Checked-Out',
    legendLabel: 'Checked-Out',
    colorVar: '--status-checked-out',
  },
  OVERDUE: {
    label: 'Overdue',
    legendLabel: 'Overdue',
    colorVar: '--status-overdue',
  },
}

export const timelineLegendStatuses: TimelineLegendStatus[] = [
  'RESERVED',
  'CHECKED_IN',
  'CHECKED_OUT',
]

export function normalizeBookingStatus(status: string): TimelineLegendStatus {
  if (status === 'CHECKED_IN') return 'CHECKED_IN'
  if (status === 'CHECKED_OUT') return 'CHECKED_OUT'
  return 'RESERVED'
}

export function computeBookingDisplayStatus(
  status: string,
  checkOutDate: string | Date,
): DerivedBookingStatus {
  if (status === 'CHECKED_IN') {
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (today > checkout) return 'OVERDUE'
  }
  return normalizeBookingStatus(status)
}

export function getBookingStatusPresentation(
  status: string,
): BookingStatusPresentation {
  if (status in presentationByStatus) {
    return presentationByStatus[status as DerivedBookingStatus]
  }
  return presentationByStatus[normalizeBookingStatus(status)]
}

export function formatPaymentStatus(paymentStatus: string): string {
  return paymentStatus
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
