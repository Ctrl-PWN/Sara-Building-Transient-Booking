import type { LedgerDetails } from './types'

export function formatPercent(value: number): string {
  return `${value}%`
}

export function computeLedgerBalanceStats(details: LedgerDetails) {
  const { total, payments, remainingBalance } = details
  const paidPercent = total > 0 ? Math.round((payments / total) * 100) : 0
  const remainingPercent =
    total > 0 ? Math.round((remainingBalance / total) * 100) : 0

  return {
    paidPercent,
    remainingPercent,
    progressValue: paidPercent,
    isFullyPaid: remainingBalance === 0 && total > 0,
  }
}
