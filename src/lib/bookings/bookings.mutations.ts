import { mutationOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { createBooking, updateBookingStatus } from './bookings.functions'
import { bookingKeys } from './bookings.queries'
import { roomKeys } from '@/lib/rooms/rooms.queries'

export type UpdateBookingStatusInput = Parameters<
  typeof updateBookingStatus
>[0]['data']

export type CreateBookingInput = Omit<
  Parameters<typeof createBooking>[0]['data'],
  'depositPercentage'
>

export const bookingMutations = {
  updateStatus: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: UpdateBookingStatusInput) =>
        updateBookingStatus({ data: input }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      },
    }),

  createBooking: (
    queryClient: QueryClient,
    onSuccess?: (bookingRef: string) => void,
    onError?: (error: string) => void,
  ) =>
    mutationOptions({
      mutationFn: (input: CreateBookingInput) =>
        createBooking({
          data: {
            ...input,
            depositPercentage: 100,
          },
        }),
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        onSuccess?.(result.bookingRef)
      },
      onError: (err: Error) => {
        onError?.(err.message || 'Failed to create booking')
      },
    }),
}
