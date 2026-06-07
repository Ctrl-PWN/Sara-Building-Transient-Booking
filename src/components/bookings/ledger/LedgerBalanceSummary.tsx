import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import {
  computeLedgerBalanceStats,
  formatPercent,
} from '@/lib/ledger/ledger-balance'
import type { LedgerDetails } from '@/lib/ledger/types'
import { cn } from '@/lib/utils'

type LedgerBalanceSummaryProps = {
  details: LedgerDetails
}

type StatVariant = 'total' | 'paid' | 'balance'

const statStyles: Record<
  StatVariant,
  {
    container: string
    label: string
    amount: string
    percent: string
    accent: string
  }
> = {
  total: {
    container:
      'border-sky-200/80 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/35',
    label: 'text-sky-700 dark:text-sky-400',
    amount: 'text-sky-950 dark:text-sky-50',
    percent: 'text-sky-600/90 dark:text-sky-400/90',
    accent: 'bg-sky-500',
  },
  paid: {
    container:
      'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/35',
    label: 'text-emerald-700 dark:text-emerald-400',
    amount: 'text-emerald-950 dark:text-emerald-50',
    percent: 'text-emerald-600/90 dark:text-emerald-400/90',
    accent: 'bg-emerald-500',
  },
  balance: {
    container:
      'border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/35',
    label: 'text-amber-800 dark:text-amber-400',
    amount: 'text-amber-950 dark:text-amber-50',
    percent: 'text-amber-700/90 dark:text-amber-400/90',
    accent: 'bg-amber-500',
  },
}

const balanceSettledStyles = {
  container:
    'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/35',
  label: 'text-emerald-700 dark:text-emerald-400',
  amount: 'text-emerald-950 dark:text-emerald-50',
  percent: 'text-emerald-600/90 dark:text-emerald-400/90',
  accent: 'bg-emerald-500',
}

function StatColumn({
  label,
  amount,
  percent,
  variant,
  settled = false,
}: {
  label: string
  amount: string
  percent?: string
  variant: StatVariant
  settled?: boolean
}) {
  const styles =
    variant === 'balance' && settled
      ? balanceSettledStyles
      : statStyles[variant]

  return (
    <div
      className={cn('overflow-hidden rounded-lg border p-3', styles.container)}
    >
      <div className={cn('mb-2 h-1 w-8 rounded-full', styles.accent)} />
      <p className={cn('text-sm font-medium', styles.label)}>{label}</p>
      <p className={cn('text-lg font-semibold', styles.amount)}>{amount}</p>
      {percent ? (
        <p className={cn('text-sm', styles.percent)}>{percent}</p>
      ) : null}
    </div>
  )
}

export function LedgerBalanceSummary({ details }: LedgerBalanceSummaryProps) {
  const stats = computeLedgerBalanceStats(details)
  const hasTotal = details.total > 0
  const balanceSettled = details.remainingBalance === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Payment summary</CardTitle>
          {stats.isFullyPaid ? (
            <Badge variant="success">Paid in full</Badge>
          ) : (
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {formatPercent(stats.paidPercent)} paid
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={stats.progressValue} aria-label="Payment progress" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatColumn
            variant="total"
            label="Total"
            amount={formatPeso(details.total)}
          />
          <StatColumn
            variant="paid"
            label="Paid"
            amount={formatPeso(details.payments)}
            percent={hasTotal ? formatPercent(stats.paidPercent) : undefined}
          />
          <StatColumn
            variant="balance"
            label="Balance due"
            amount={formatPeso(details.remainingBalance)}
            percent={
              hasTotal ? formatPercent(stats.remainingPercent) : undefined
            }
            settled={balanceSettled}
          />
        </div>
      </CardContent>
    </Card>
  )
}
