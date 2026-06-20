import type { ledgerTransactions } from "@/db/schema";
import type {
	LedgerTransactionCategory,
	PaymentMethod,
	UtilityType,
} from "@/db/schema/enums";

export type LedgerTransactionRow = typeof ledgerTransactions.$inferSelect;

export type LedgerTransactionListItem = {
	id: number;
	bookingId: number;
	category: LedgerTransactionCategory;
	amount: string;
	isPaid: boolean;
	description: string | null;
	paymentMethod: PaymentMethod | null;
	referenceNumber: string | null;
	utilityType: UtilityType | null;
	createdAt: string;
};

export type LedgerDetails = {
	total: number;
	remainingBalance: number;
	payments: number;
};

export type InsertLedgerTransactionInput = {
	bookingId: number;
	category: LedgerTransactionCategory;
	amount: string;
	isPaid: boolean;
	description?: string | null;
	paymentMethod?: PaymentMethod | null;
	referenceNumber?: string | null;
	utilityType?: UtilityType | null;
};
