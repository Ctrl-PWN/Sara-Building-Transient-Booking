import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import type { LedgerTransactionListItem } from '@/lib/ledger/types'

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return '—'
  if (method === 'BANK_TRANSFER') return 'Bank transfer'
  return method.charAt(0) + method.slice(1).toLowerCase()
}

const columns: ColumnDef<LedgerTransactionListItem>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), 'MMM d, yyyy h:mm a'),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => formatCategory(row.original.category),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description ?? '—',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = Number(row.original.amount)
      return (
        <span className={amount < 0 ? 'text-destructive' : undefined}>
          {formatPeso(amount)}
        </span>
      )
    },
  },
  {
    accessorKey: 'isPaid',
    header: 'Status',
    cell: ({ row }) =>
      row.original.isPaid ? (
        <Badge variant="secondary">Paid</Badge>
      ) : (
        <Badge variant="outline">Unpaid</Badge>
      ),
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment',
    cell: ({ row }) => formatPaymentMethod(row.original.paymentMethod),
  },
]

type BookingLedgerTableProps = {
  transactions: LedgerTransactionListItem[]
}

export function BookingLedgerTable({ transactions }: BookingLedgerTableProps) {
  return <DataTable columns={columns} data={transactions} />
}
