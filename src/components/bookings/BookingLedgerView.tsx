import { PlusIcon } from '@phosphor-icons/react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ledgerMutations } from '@/lib/ledger/ledger.mutations'
import { ledgerQueries } from '@/lib/ledger/ledger.queries'
import type { LedgerTransactionListItem } from '@/lib/ledger/types'

import { BookingLedgerTable } from './BookingLedgerTable'
import { AddExpenseDialog } from './ledger/AddExpenseDialog'
import { LedgerBalanceSummary } from './ledger/LedgerBalanceSummary'
import { PayExpenseDialog } from './ledger/PayExpenseDialog'

type BookingLedgerViewProps = {
  bookingId: number
  bookingStatus: string
}

export function BookingLedgerView({
  bookingId,
  bookingStatus,
}: BookingLedgerViewProps) {
  const queryClient = useQueryClient()
  const { data: details } = useSuspenseQuery(ledgerQueries.details(bookingId))
  const { data: transactions } = useSuspenseQuery(
    ledgerQueries.transactions(bookingId),
  )

  const [addOpen, setAddOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<LedgerTransactionListItem | null>(
    null,
  )

  const deleteMutation = useMutation(
    ledgerMutations.deleteTransaction(queryClient, bookingId),
  )

  const canAddCharge = bookingStatus === 'CHECKED_IN'

  const handlePay = (transaction: LedgerTransactionListItem) => {
    setPayTarget(transaction)
    setPayOpen(true)
  }

  const handleDelete = (transaction: LedgerTransactionListItem) => {
    if (
      !window.confirm(
        `Remove "${transaction.description ?? 'charge'}" from the ledger?`,
      )
    ) {
      return
    }
    deleteMutation.mutate({ id: transaction.id })
  }

  return (
    <section className="space-y-6">
      <LedgerBalanceSummary details={details} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Ledger</CardTitle>
          {canAddCharge ? (
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon data-icon="inline-start" size={16} />
              Add charge
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ledger transactions yet.
            </p>
          ) : (
            <BookingLedgerTable
              transactions={transactions}
              bookingStatus={bookingStatus}
              showActions={canAddCharge}
              onPay={handlePay}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <AddExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        bookingId={bookingId}
      />

      <PayExpenseDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        bookingId={bookingId}
        transaction={payTarget}
      />
    </section>
  )
}
