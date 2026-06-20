export const RESERVATION_BALANCE_DESCRIPTION =
	"Room charge balance due at check-in";

export const RESERVATION_ADVANCE_DESCRIPTION = "Advance payment (2nd month)";

export const WALK_IN_ROOM_CHARGE_DESCRIPTION = "Room charge (walk-in)";

export function isProtectedLedgerTransaction(row: {
	category: string;
	description: string | null;
}): boolean {
	if (row.category === "DEPOSIT") return true;
	if (row.category === "ADVANCE") return true;
	if (row.description === RESERVATION_BALANCE_DESCRIPTION) return true;
	if (row.description === RESERVATION_ADVANCE_DESCRIPTION) return true;
	if (row.description === WALK_IN_ROOM_CHARGE_DESCRIPTION) return true;
	return false;
}
