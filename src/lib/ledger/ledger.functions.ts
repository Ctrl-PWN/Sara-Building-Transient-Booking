import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNotNull, isNull, sum } from 'drizzle-orm'
import { db } from '@/db'
import { ledgerTransactions } from '@/db/schema'
import {
  createExpenseSchema,
  deleteLedgerTransactionSchema,
  getLedgerDetailsSchema,
  payExpenseSchema,
} from './schemas'

export const createExpense = createServerFn({ method: 'POST' })
  .inputValidator(createExpenseSchema)
  .handler(async ({ data }) => {
    return await db.insert(ledgerTransactions).values({
      ...data,
      type: 'EXPENSE',
    })
  })

export const payExpense = createServerFn({ method: 'POST' })
  .inputValidator(payExpenseSchema)
  .handler(async ({ data }) => {
    const [transaction] = await db
      .update(ledgerTransactions)
      .set({
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      })
      .where(eq(ledgerTransactions.id, data.id))
      .returning()
    return transaction
  })

export const getLedgerDetails = createServerFn({ method: 'GET' })
  .inputValidator(getLedgerDetailsSchema)
  .handler(async ({ data }) => {
    // return total, remaining balance, payments
    const [total, remainingBalance, payments] = await Promise.all([
      db
        .select({ total: sum(ledgerTransactions.amount) })
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.bookingId, data.bookingId)),
      db
        .select({ remainingBalance: sum(ledgerTransactions.amount) })
        .from(ledgerTransactions)
        .where(
          and(
            eq(ledgerTransactions.bookingId, data.bookingId),
            isNull(ledgerTransactions.amount),
          ),
        ),
      db
        .select({ payments: sum(ledgerTransactions.amount) })
        .from(ledgerTransactions)
        .where(
          and(
            eq(ledgerTransactions.bookingId, data.bookingId),
            isNotNull(ledgerTransactions.amount),
          ),
        ),
    ])
    return { total, remainingBalance, payments }
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
