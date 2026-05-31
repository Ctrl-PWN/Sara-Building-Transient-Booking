import { queryOptions } from '@tanstack/react-query'

import {
  getBookings,
  getBookingById,
  getRooms,
} from './bookings.functions'

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: number) => [...bookingKeys.details(), id] as const,
}

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
}

export const bookingQueries = {
  list: () =>
    queryOptions({
      queryKey: bookingKeys.lists(),
      queryFn: () => getBookings(),
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: bookingKeys.detail(id),
      queryFn: () => getBookingById({ data: { id } }),
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    }),
}

export const roomQueries = {
  list: () =>
    queryOptions({
      queryKey: roomKeys.lists(),
      queryFn: () => getRooms(),
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    }),
}
