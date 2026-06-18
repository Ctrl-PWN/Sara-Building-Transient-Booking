import { queryOptions } from "@tanstack/react-query";

import { getLedgerDetails, getLedgerTransactions } from "./ledger.functions";

export const ledgerKeys = {
	all: ["ledger"] as const,
	byBooking: (bookingId: number) =>
		[...ledgerKeys.all, "booking", bookingId] as const,
	transactions: (bookingId: number) =>
		[...ledgerKeys.byBooking(bookingId), "transactions"] as const,
	details: (bookingId: number) =>
		[...ledgerKeys.byBooking(bookingId), "details"] as const,
};

export const ledgerQueries = {
	transactions: (bookingId: number) =>
		queryOptions({
			queryKey: ledgerKeys.transactions(bookingId),
			queryFn: () => getLedgerTransactions({ data: { bookingId } }),
		}),
	details: (bookingId: number) =>
		queryOptions({
			queryKey: ledgerKeys.details(bookingId),
			queryFn: () => getLedgerDetails({ data: { bookingId } }),
		}),
};
