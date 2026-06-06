import { createFileRoute, notFound } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { bookingQueries } from '@/lib/bookings/bookings.queries'
import { ledgerQueries } from '@/lib/ledger/ledger.queries'

const InvoicePdfPreview = lazy(() =>
  import('@/components/bookings/invoice/InvoicePdfPreview').then((m) => ({
    default: m.InvoicePdfPreview,
  })),
)

export const Route = createFileRoute(
  '/_authenticated/bookings/$bookingId/invoice',
)({
  loader: async ({ params, context }) => {
    const id = Number(params.bookingId)
    try {
      const [booking, transactions] = await Promise.all([
        context.queryClient.ensureQueryData(bookingQueries.detail(id)),
        context.queryClient.ensureQueryData(ledgerQueries.transactions(id)),
      ])
      return { booking, transactions }
    } catch {
      throw notFound()
    }
  },
  component: InvoiceRoute,
})

function InvoiceRoute() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap px-4 py-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-6 animate-spin text-muted-foreground" />
          </div>
        </main>
      }
    >
      <InvoicePage />
    </Suspense>
  )
}

function InvoicePage() {
  const { booking, transactions } = Route.useLoaderData()

  const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const payments = transactions
    .filter((tx) => tx.isPaid)
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const remainingBalance = total - payments

  return (
    <InvoicePdfPreview
      booking={booking}
      transactions={transactions}
      total={total}
      payments={payments}
      remainingBalance={remainingBalance}
    />
  )
}
