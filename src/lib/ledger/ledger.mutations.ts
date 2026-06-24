import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import type z from "zod";
import { dashboardKeys } from "@/lib/dashboard/dashboard.queries";
import { bookingKeys } from "@/lib/bookings/bookings.queries";
import { roomKeys } from "@/lib/rooms/rooms.queries";
import { timelineKeys } from "@/lib/timeline/timeline.queries";
import {
	createExpense,
	deleteLedgerTransaction,
	generateUtilityPayments,
	payExpense,
	payExpenses,
	payExpensesBulk,
} from "./ledger.functions";
import { ledgerKeys } from "./ledger.queries";
import type {
	createExpenseSchema,
	generateUtilityPaymentsSchema,
	payExpensesBulkSchema,
	payExpensesSchema,
} from "./schemas";
import type { LedgerTransactionRow } from "./types";

function invalidateLedger(queryClient: QueryClient, bookingId: number) {
	return Promise.all([
		queryClient.invalidateQueries({
			queryKey: ledgerKeys.transactions(bookingId),
		}),
		queryClient.invalidateQueries({
			queryKey: ledgerKeys.details(bookingId),
		}),
		queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) }),
		queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
		queryClient.invalidateQueries({ queryKey: roomKeys.all }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
		queryClient.invalidateQueries({ queryKey: timelineKeys.all }),
	]);
}

export const ledgerMutations = {
	createExpense: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof createExpenseSchema>) =>
				createExpense({ data: input }),
			onSuccess: (row: LedgerTransactionRow) => {
				return invalidateLedger(queryClient, row.bookingId);
			},
		}),

	generateUtilityPayments: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof generateUtilityPaymentsSchema>) =>
				generateUtilityPayments({ data: input }),
			onSuccess: () => {
				return invalidateLedger(queryClient, bookingId);
			},
		}),

	payExpense: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: Parameters<typeof payExpense>[0]["data"]) =>
				payExpense({ data: input }),
			onSuccess: () => {
				return invalidateLedger(queryClient, bookingId);
			},
		}),

	payExpensesBulk: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof payExpensesBulkSchema>) =>
				payExpensesBulk({ data: input }),
			onSuccess: () => {
				return invalidateLedger(queryClient, bookingId);
			},
		}),

	payExpenses: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof payExpensesSchema>) =>
				payExpenses({ data: input }),
			onSuccess: () => {
				return invalidateLedger(queryClient, bookingId);
			},
		}),

	deleteTransaction: (queryClient: QueryClient, bookingId: number) =>
		mutationOptions({
			mutationFn: (
				input: Parameters<typeof deleteLedgerTransaction>[0]["data"],
			) => deleteLedgerTransaction({ data: input }),
			onSuccess: () => {
				return invalidateLedger(queryClient, bookingId);
			},
		}),
};
