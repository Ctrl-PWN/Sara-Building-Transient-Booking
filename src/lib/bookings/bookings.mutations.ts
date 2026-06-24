import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import type z from "zod";
import { dashboardKeys } from "@/lib/dashboard/dashboard.queries";
import { ledgerKeys } from "@/lib/ledger/ledger.queries";
import { roomKeys } from "@/lib/rooms/rooms.queries";
import { timelineKeys } from "@/lib/timeline/timeline.queries";
import {
	applyLateFee,
	checkInBooking,
	checkOutBooking,
	createBooking,
	extendBooking,
	transferBooking,
	updateBookingStatus,
} from "./bookings.functions";
import { bookingKeys } from "./bookings.queries";
import type {
	checkInBookingSchema,
	checkOutBookingSchema,
	createBookingServerSchema,
	extendBookingSchema,
	transferBookingSchema,
	updateStatusSchema,
} from "./schemas";

function invalidateBookingSideEffects(
	queryClient: QueryClient,
	bookingId?: number,
) {
	void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
	void queryClient.invalidateQueries({ queryKey: roomKeys.all });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
	if (bookingId != null) {
		void queryClient.invalidateQueries({
			queryKey: ledgerKeys.byBooking(bookingId),
		});
		void queryClient.invalidateQueries({
			queryKey: bookingKeys.detail(bookingId),
		});
	}
}

export const bookingMutations = {
	updateStatus: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof updateStatusSchema>) =>
				updateBookingStatus({ data: input }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient);
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
				invalidateBookingSideEffects(queryClient, result.bookingId);
				onSuccess?.(result.bookingRef);
			},
			onError: (err: Error) => {
				onError?.(err.message || "Failed to create booking");
			},
		}),

	checkIn: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof checkInBookingSchema>) =>
				checkInBooking({ data: input }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient, bookingId);
			},
		}),

	checkOut: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof checkOutBookingSchema>) =>
				checkOutBooking({ data: input }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient, bookingId);
			},
		}),

	transfer: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof transferBookingSchema>) =>
				transferBooking({ data: input }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient, bookingId);
			},
		}),

	extend: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof extendBookingSchema>) =>
				extendBooking({ data: input }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient, bookingId);
			},
		}),

	applyLateFee: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: () => applyLateFee({ data: { bookingId } }),
			onSuccess: () => {
				invalidateBookingSideEffects(queryClient, bookingId);
			},
		}),
};
