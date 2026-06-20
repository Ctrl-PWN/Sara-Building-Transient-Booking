import {
	isProtectedLedgerTransaction,
	RESERVATION_ADVANCE_DESCRIPTION,
	RESERVATION_BALANCE_DESCRIPTION,
	WALK_IN_ROOM_CHARGE_DESCRIPTION,
} from "@/lib/ledger/ledger.constants";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

export {
	RESERVATION_ADVANCE_DESCRIPTION,
	RESERVATION_BALANCE_DESCRIPTION,
	WALK_IN_ROOM_CHARGE_DESCRIPTION,
};

export function canDeleteLedgerTransaction(
	transaction: LedgerTransactionListItem,
	bookingStatus: string,
): boolean {
	if (bookingStatus !== "CHECKED_IN") return false;
	if (transaction.isPaid) return false;
	return !isProtectedLedgerTransaction(transaction);
}

export function canPayLedgerTransaction(
	transaction: LedgerTransactionListItem,
	bookingStatus: string,
): boolean {
	return bookingStatus === "CHECKED_IN" && !transaction.isPaid;
}
