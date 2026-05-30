import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export const Route = createFileRoute('/_authenticated/ledger')({
  component: LedgerPage,
})

function LedgerPage() {
  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title="Ledger"
        description="Expense records and related transactions in one place."
      />

      <section className="block-card p-6">
        <h2 className="font-body text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground m-0">
          Balance summary
        </h2>
        <p className="mt-2 font-display text-3xl font-semibold text-foreground m-0">
          $0.00
        </p>
        <p className="mt-1 font-body text-sm text-muted-foreground m-0">
          Placeholder until ledger data is connected.
        </p>
      </section>

      <section className="block-card overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                No ledger entries yet.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <PlaceholderPanel
        title="Ledger operations"
        description="Expense entry, payment, and removal flows will be added in ledger feature tasks."
      />
    </main>
  )
}
