import z from 'zod'

export const createExpenseSchema = z.object({
  bookingId: z.number(),
  amount: z.string(),
  description: z.string(),
  category: z.string(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
})

export const payExpenseSchema = z.object({
  id: z.number(),
  amount: z.string(),
  paymentMethod: z.string(),
  referenceNumber: z.string(),
})

export const getLedgerDetailsSchema = z.object({
  bookingId: z.number(),
})

export const deleteLedgerTransactionSchema = z.object({
  id: z.number(),
})
