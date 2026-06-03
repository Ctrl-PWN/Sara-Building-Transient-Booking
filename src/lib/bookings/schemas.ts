import { z } from 'zod'

import { bookingPaymentStatusEnum, bookingStatusEnum } from '@/db/schema/enums'

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

export const createBookingFormSchema = z
  .object({
    roomId: z.string().min(1, 'Room is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    contactNumber: z.string(),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    occupantsCount: z.number().int().min(1, 'At least 1 occupant required'),
  })
  .refine(
    (data) =>
      !data.checkInDate ||
      !data.checkOutDate ||
      new Date(data.checkOutDate) > new Date(data.checkInDate),
    {
      message: 'Check-out must be after check-in date',
      path: ['checkOutDate'],
    },
  )
