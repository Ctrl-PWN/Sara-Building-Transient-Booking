import { queryOptions } from "@tanstack/react-query";

import { getBookingById, getBookings } from "./bookings.functions";

export const bookingKeys = {
	all: ["bookings"] as const,
	lists: () => [...bookingKeys.all, "list"] as const,
	details: () => [...bookingKeys.all, "detail"] as const,
	detail: (id: number) => [...bookingKeys.details(), id] as const,
};

export const bookingQueries = {
	list: () =>
		queryOptions({
			queryKey: bookingKeys.lists(),
			queryFn: () => getBookings(),
		}),
	detail: (id: number) =>
		queryOptions({
			queryKey: bookingKeys.detail(id),
			queryFn: () => getBookingById({ data: { id } }),
		}),
};
