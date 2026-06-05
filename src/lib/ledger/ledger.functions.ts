import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { ledgerTransactions } from '@/db/schema'

import type { LedgerDetails } from './types'

import {
  createExpenseSchema,
  deleteLedgerTransactionSchema,
  getLedgerDetailsSchema,
  getLedgerTransactionsSchema,
  payExpenseSchema,
} from './schemas'

export const createExpense = createServerFn({ method: 'POST' })
  .inputValidator(createExpenseSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(ledgerTransactions)
      .values({
        ...data,
        isPaid: false,
      })
      .returning()
    return row
  })

export const payExpense = createServerFn({ method: 'POST' })
  .inputValidator(payExpenseSchema)
  .handler(async ({ data }) => {
    const [transaction] = await db
      .update(ledgerTransactions)
      .set({
        isPaid: true,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      })
      .where(eq(ledgerTransactions.id, data.id))
      .returning()
    return transaction
  })

export const getLedgerDetails = createServerFn({ method: 'GET' })
  .inputValidator(getLedgerDetailsSchema)
  .handler(async ({ data }): Promise<LedgerDetails> => {
    const rows = await db
      .select({
        amount: ledgerTransactions.amount,
        isPaid: ledgerTransactions.isPaid,
      })
      .from(ledgerTransactions)
      .where(eq(ledgerTransactions.bookingId, data.bookingId))

    let total = 0
    let payments = 0
    let remainingBalance = 0

    for (const row of rows) {
      const amount = Number(row.amount) || 0
      total += amount
      if (row.isPaid) {
        payments += amount
      } else {
        remainingBalance += amount
      }
    }

    return { total, payments, remainingBalance }
  })

export const getLedgerTransactions = createServerFn({ method: 'GET' })
  .inputValidator(getLedgerTransactionsSchema)
  .handler(async ({ data }) => {
    const transactions = await db
      .select()
      .from(ledgerTransactions)
      .where(eq(ledgerTransactions.bookingId, data.bookingId))
    return transactions
  })

export const deleteLedgerTransaction = createServerFn({ method: 'POST' })
  .inputValidator(deleteLedgerTransactionSchema)
  .handler(async ({ data }) => {
    const [transaction] = await db
      .delete(ledgerTransactions)
      .where(eq(ledgerTransactions.id, data.id))
      .returning()
    return transaction
  })
