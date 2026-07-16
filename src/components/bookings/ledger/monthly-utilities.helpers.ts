import type { MonthlyBillingPeriod } from "@/lib/bookings/monthly-billing-periods";
import { isWithinPeriod } from "@/lib/bookings/monthly-billing-periods";
import type { MonthlyInvoiceUtilityLine } from "@/lib/invoices/schemas";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";
import type {
	MonthlyUtilitiesForm,
	UtilityItemValue,
} from "./useMonthlyUtilitiesForm";

export const MAIN_UTILITY_TYPES = ["ELECTRICITY", "WATER", "INTERNET"] as const;

export const UTILITY_TYPE_LABELS: Record<string, string> = {
	ELECTRICITY: "Electricity",
	WATER: "Water",
	INTERNET: "Internet",
	OTHER: "Other",
};

export const DEFAULT_UTILITY_DESCRIPTIONS: Record<string, string> = {
	ELECTRICITY: "Electricity bill",
	WATER: "Water bill",
	INTERNET: "Internet bill",
};

export function getExistingMainTypesInPeriod(
	transactions: LedgerTransactionListItem[],
	period: MonthlyBillingPeriod,
): Set<string> {
	const types = new Set<string>();
	for (const tx of transactions) {
		if (
			tx.category === "UTILITY" &&
			tx.utilityType &&
			tx.utilityType !== "OTHER" &&
			isWithinPeriod(tx.createdAt, period)
		) {
			types.add(tx.utilityType);
		}
	}
	return types;
}

export function getUtilityTransactionsInPeriod(
	transactions: LedgerTransactionListItem[],
	period: MonthlyBillingPeriod,
): LedgerTransactionListItem[] {
	return transactions.filter(
		(tx) => tx.category === "UTILITY" && isWithinPeriod(tx.createdAt, period),
	);
}

const UTILITY_INVOICE_ORDER: Record<string, number> = {
	ELECTRICITY: 0,
	WATER: 1,
	INTERNET: 2,
	OTHER: 3,
};

export function utilitiesToInvoiceLines(
	transactions: LedgerTransactionListItem[],
	period: MonthlyBillingPeriod,
): MonthlyInvoiceUtilityLine[] {
	const txs = getUtilityTransactionsInPeriod(transactions, period);
	return [...txs]
		.sort((a, b) => {
			const orderA = UTILITY_INVOICE_ORDER[a.utilityType ?? "OTHER"] ?? 3;
			const orderB = UTILITY_INVOICE_ORDER[b.utilityType ?? "OTHER"] ?? 3;
			if (orderA !== orderB) return orderA - orderB;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		})
		.map((tx) => ({
			utilityType: tx.utilityType ?? "OTHER",
			description: tx.description ?? "Utility charge",
			amount: Number(tx.amount) || 0,
		}))
		.filter((line) => line.amount > 0);
}

export function buildDefaultUtilityItems(
	existingMainTypesInPeriod: Set<string>,
): UtilityItemValue[] {
	return MAIN_UTILITY_TYPES.filter(
		(type) => !existingMainTypesInPeriod.has(type),
	).map((type) => ({
		utilityType: type,
		amount: 0,
		description: DEFAULT_UTILITY_DESCRIPTIONS[type] ?? "",
	}));
}

export function resetUtilityFormForPeriod(
	form: MonthlyUtilitiesForm,
	periods: MonthlyBillingPeriod[],
	periodIdx: number,
	transactions: LedgerTransactionListItem[],
) {
	const period = periods[periodIdx];
	if (!period) return;
	const existing = getExistingMainTypesInPeriod(transactions, period);
	form.setFieldValue("items", buildDefaultUtilityItems(existing));
	form.setFieldValue("paymentMethod", "CASH");
	form.setFieldValue("referenceNumber", "");
}
