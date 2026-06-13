import { queryOptions } from '@tanstack/react-query'

import {
  getBookingById,
  getBookingHistory,
  getBookings,
} from './bookings.functions'

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  history: () => [...bookingKeys.all, 'history'] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: number) => [...bookingKeys.details(), id] as const,
}

export const bookingQueries = {
  list: () =>
    queryOptions({
      queryKey: bookingKeys.lists(),
      queryFn: () => getBookings(),
    }),
  history: () =>
    queryOptions({
      queryKey: bookingKeys.history(),
      queryFn: () => getBookingHistory(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: bookingKeys.detail(id),
      queryFn: () => getBookingById({ data: { id } }),
    }),
}
