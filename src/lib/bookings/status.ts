import type { TimelineLegendStatus } from './types'

export type BookingStatusPresentation = {
  label: string
  legendLabel: string
  colorVar: string
}

const presentationByLegend: Record<
  TimelineLegendStatus,
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
}

export const timelineLegendStatuses: TimelineLegendStatus[] = [
  'RESERVED',
  'CHECKED_IN',
  'CHECKED_OUT',
]

export function normalizeBookingStatus(
  status: string,
): TimelineLegendStatus {
  if (status === 'CHECKED_IN') return 'CHECKED_IN'
  if (status === 'CHECKED_OUT') return 'CHECKED_OUT'
  return 'RESERVED'
}

export function getBookingStatusPresentation(
  status: string,
): BookingStatusPresentation {
  return presentationByLegend[normalizeBookingStatus(status)]
}

export function formatPaymentStatus(paymentStatus: string): string {
  return paymentStatus
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
