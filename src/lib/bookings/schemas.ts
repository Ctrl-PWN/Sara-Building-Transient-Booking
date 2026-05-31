import { z } from 'zod'

import {
  bookingPaymentStatusEnum,
  bookingStatusEnum,
} from '@/db/schema/enums'

export const bookingStatusSchema = z.enum(bookingStatusEnum.enumValues)
export const bookingPaymentStatusSchema = z.enum(
  bookingPaymentStatusEnum.enumValues,
)

export const bookingByIdSchema = z.object({
  id: z.number().int().positive(),
})

export const timelineSearchSchema = z.object({
  week: z.string().optional(),
})
