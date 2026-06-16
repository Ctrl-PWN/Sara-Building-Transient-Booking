import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import type z from "zod";
import { dashboardKeys } from "@/lib/dashboard/dashboard.queries";
import { ledgerKeys } from "@/lib/ledger/ledger.queries";
import { roomKeys } from "@/lib/rooms/rooms.queries";
import {
	checkInBooking,
	checkOutBooking,
	createBooking,
	transferBooking,
	updateBookingStatus,
} from "./bookings.functions";
import { bookingKeys } from "./bookings.queries";
import type {
	checkInBookingSchema,
	checkOutBookingSchema,
	createBookingServerSchema,
	transferBookingSchema,
	updateStatusSchema,
} from "./schemas";

export const bookingMutations = {
	updateStatus: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof updateStatusSchema>) =>
				updateBookingStatus({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
				void queryClient.invalidateQueries({ queryKey: roomKeys.all });
				void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
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
				void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
				void queryClient.invalidateQueries({ queryKey: roomKeys.all });
				void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
				void queryClient.invalidateQueries({
					queryKey: ledgerKeys.byBooking(result.bookingId),
				});
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
				void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
				void queryClient.invalidateQueries({ queryKey: roomKeys.all });
				void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
				void queryClient.invalidateQueries({
					queryKey: ledgerKeys.byBooking(bookingId),
				});
			},
		}),

	checkOut: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof checkOutBookingSchema>) =>
				checkOutBooking({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
				void queryClient.invalidateQueries({ queryKey: roomKeys.all });
				void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
				void queryClient.invalidateQueries({
					queryKey: ledgerKeys.byBooking(bookingId),
				});
			},
		}),

	transfer: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof transferBookingSchema>) =>
				transferBooking({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
				void queryClient.invalidateQueries({ queryKey: roomKeys.all });
				void queryClient.invalidateQueries({
					queryKey: ledgerKeys.byBooking(bookingId),
				});
			},
		}),
};
