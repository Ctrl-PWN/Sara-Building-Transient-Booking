import type { QueryClient } from '@tanstack/react-query'
import { mutationOptions } from '@tanstack/react-query'
import type z from 'zod'
import { ledgerKeys } from '@/lib/ledger/ledger.queries'
import { roomKeys } from '@/lib/rooms/rooms.queries'
import { createBooking, updateBookingStatus } from './bookings.functions'
import { bookingKeys } from './bookings.queries'
import type { createBookingServerSchema, updateStatusSchema } from './schemas'

export const bookingMutations = {
  updateStatus: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof updateStatusSchema>) =>
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
      mutationFn: (input: z.infer<typeof createBookingServerSchema>) =>
        createBooking({ data: input }),
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        void queryClient.invalidateQueries({ queryKey: roomKeys.all })
        void queryClient.invalidateQueries({
          queryKey: ledgerKeys.byBooking(result.bookingId),
        })
        onSuccess?.(result.bookingRef)
      },
      onError: (err: Error) => {
        onError?.(err.message || 'Failed to create booking')
      },
    }),
}
