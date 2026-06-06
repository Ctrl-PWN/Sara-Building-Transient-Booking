import type { QueryClient } from '@tanstack/react-query'
import { mutationOptions } from '@tanstack/react-query'
import type z from 'zod'
import { bookingKeys } from '@/lib/bookings/bookings.queries'
import {
  createExpense,
  deleteLedgerTransaction,
  payExpense,
  payExpenses,
  payExpensesBulk,
} from './ledger.functions'
import { ledgerKeys } from './ledger.queries'
import type {
  createExpenseSchema,
  payExpensesBulkSchema,
  payExpensesSchema,
} from './schemas'
import type { LedgerTransactionRow } from './types'

function invalidateLedger(queryClient: QueryClient, bookingId: number) {
  void queryClient.invalidateQueries({
    queryKey: ledgerKeys.transactions(bookingId),
  })
  void queryClient.invalidateQueries({
    queryKey: ledgerKeys.details(bookingId),
  })
  void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
}

export const ledgerMutations = {
  createExpense: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof createExpenseSchema>) =>
        createExpense({ data: input }),
      onSuccess: (row: LedgerTransactionRow) => {
        invalidateLedger(queryClient, row.bookingId)
      },
    }),

  payExpense: (queryClient: QueryClient, bookingId: number) =>
    mutationOptions({
      mutationFn: (input: Parameters<typeof payExpense>[0]['data']) =>
        payExpense({ data: input }),
      onSuccess: () => {
        invalidateLedger(queryClient, bookingId)
      },
    }),

  payExpensesBulk: (queryClient: QueryClient, bookingId: number) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof payExpensesBulkSchema>) =>
        payExpensesBulk({ data: input }),
      onSuccess: () => {
        invalidateLedger(queryClient, bookingId)
      },
    }),

  payExpenses: (queryClient: QueryClient, bookingId: number) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof payExpensesSchema>) =>
        payExpenses({ data: input }),
      onSuccess: () => {
        invalidateLedger(queryClient, bookingId)
      },
    }),

  deleteTransaction: (queryClient: QueryClient, bookingId: number) =>
    mutationOptions({
      mutationFn: (
        input: Parameters<typeof deleteLedgerTransaction>[0]['data'],
      ) => deleteLedgerTransaction({ data: input }),
      onSuccess: () => {
        invalidateLedger(queryClient, bookingId)
      },
    }),
}
