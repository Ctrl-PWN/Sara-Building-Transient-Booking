import { queryOptions } from '@tanstack/react-query'

import { getBookingById } from './bookings.functions'

export const bookingKeys = {
  all: ['bookings'] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: number) => [...bookingKeys.details(), id] as const,
}

export const bookingQueries = {
  detail: (id: number) =>
    queryOptions({
      queryKey: bookingKeys.detail(id),
      queryFn: () => getBookingById({ data: { id } }),
      staleTime: 5 * 60_000,
    }),
}
