import { z } from 'zod'

export const bookingStatusSchema = z.enum([
  'RESERVED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'EVICTED',
])

export const bookingByIdSchema = z.object({
  id: z.number().int().positive(),
})

export const timelineSearchSchema = z.object({
  week: z.string().optional(),
})
