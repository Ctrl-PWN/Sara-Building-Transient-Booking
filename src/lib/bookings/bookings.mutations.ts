import { mutationOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { timelineKeys } from '@/lib/timeline/timeline.queries'
import { roomKeys } from '@/lib/bookings/bookings.queries'

import { bookingKeys } from './bookings.queries'
import { updateBookingStatus } from './bookings.actions'

export type UpdateBookingStatusInput = Parameters<
  typeof updateBookingStatus
>[0]['data']

export const bookingMutations = {
  updateStatus: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: UpdateBookingStatusInput) =>
        updateBookingStatus({ data: input }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        void queryClient.invalidateQueries({ queryKey: roomKeys.all })
        void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
      },
    }),
}
