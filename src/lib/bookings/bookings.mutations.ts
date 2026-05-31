import { mutationOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { timelineKeys } from '@/lib/timeline/timeline.queries'

import { bookingKeys } from './bookings.queries'

// TODO: import updateBookingStatus from './bookings.functions' when write path lands

export type UpdateBookingStatusInput = {
  id: number
  status: string
  cancellationReason?: string
}

export const bookingMutations = {
  updateStatus: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (input: UpdateBookingStatusInput) => {
        // return updateBookingStatus({ data: input })
        void input
        throw new Error('updateBookingStatus server fn not implemented')
      },
      onSuccess: (_data, { id }) => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
      },
    }),
}
