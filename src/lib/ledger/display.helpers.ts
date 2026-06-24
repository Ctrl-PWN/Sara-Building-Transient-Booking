export function formatLedgerCategory(category: string): string {
	return category
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

export function formatPaymentMethod(
	method: string | null | undefined,
	fallback = "—",
): string {
	if (!method) return fallback;
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}
