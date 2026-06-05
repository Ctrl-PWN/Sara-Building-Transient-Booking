import { useSuspenseQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import { ledgerQueries } from '@/lib/ledger/ledger.queries'

import { BookingLedgerTable } from './BookingLedgerTable'

type BookingLedgerViewProps = {
  bookingId: number
}

export function BookingLedgerView({ bookingId }: BookingLedgerViewProps) {
  const { data: details } = useSuspenseQuery(ledgerQueries.details(bookingId))
  const { data: transactions } = useSuspenseQuery(
    ledgerQueries.transactions(bookingId),
  )

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPeso(details.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPeso(details.payments)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPeso(details.remainingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ledger transactions yet.
            </p>
          ) : (
            <BookingLedgerTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
