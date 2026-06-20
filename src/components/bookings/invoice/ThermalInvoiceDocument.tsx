import "@/lib/pdf/fonts";

import {
	Document,
	Font,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import { format } from "date-fns";

import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

Font.registerHyphenationCallback((word) => [word]);

const PAGE_WIDTH_PT = 80 * (72 / 25.4);
const PAGE_HEIGHT_PT = 600;
const SAFE_WIDTH_PT = PAGE_WIDTH_PT - 16;

const COLORS = {
	ink: "#000000",
	label: "#6b7280",
};

const styles = StyleSheet.create({
	page: {
		width: PAGE_WIDTH_PT,
		height: PAGE_HEIGHT_PT,
		paddingTop: 16,
		paddingBottom: 16,
		paddingHorizontal: 8,
		fontFamily: "Inter",
		fontSize: 9,
		color: COLORS.ink,
	},
	center: { textAlign: "center" },
	bold: { fontWeight: 700 },
	brand: {
		fontSize: 12,
		fontWeight: 700,
		letterSpacing: 0.5,
	},
	brandBlock: {
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 8,
		color: COLORS.label,
		marginTop: 2,
	},
	rule: {
		width: "100%",
		borderTopWidth: 1,
		borderTopColor: COLORS.ink,
		borderTopStyle: "solid",
		marginVertical: 6,
	},
	ruleThick: {
		width: "100%",
		borderTopWidth: 1.5,
		borderTopColor: COLORS.ink,
		borderTopStyle: "solid",
		marginVertical: 6,
	},
	kvRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginVertical: 1,
	},
	kvLabel: { color: COLORS.label, fontSize: 9 },
	kvValue: { fontSize: 9, fontWeight: 500, maxWidth: SAFE_WIDTH_PT * 0.6 },
	docTitle: {
		fontSize: 11,
		fontWeight: 700,
		letterSpacing: 1,
		textAlign: "center",
		marginTop: 2,
		paddingVertical: 4,
	},
	itemBlock: {
		paddingVertical: 4,
	},
	itemTitle: {
		fontSize: 9,
		fontWeight: 500,
	},
	itemMeta: {
		fontSize: 8,
		color: COLORS.label,
		marginTop: 1,
	},
	itemAmountRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 2,
	},
	itemAmount: {
		fontSize: 9,
		fontWeight: 600,
	},
	paidPill: {
		fontSize: 7,
		fontWeight: 500,
		paddingHorizontal: 5,
		paddingVertical: 1,
		borderRadius: 3,
		color: "#ffffff",
		backgroundColor: COLORS.ink,
	},
	unpaidPill: {
		fontSize: 7,
		fontWeight: 500,
		paddingHorizontal: 5,
		paddingVertical: 1,
		borderRadius: 3,
		color: COLORS.ink,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: COLORS.ink,
	},
	totalsBlock: {
		marginTop: 4,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 1,
	},
	totalsLabel: { fontSize: 9, color: COLORS.label },
	totalsValue: { fontSize: 9, fontWeight: 500 },
	balanceLabel: { fontSize: 10, fontWeight: 700 },
	balanceValue: { fontSize: 10, fontWeight: 700 },
	footer: {
		marginTop: 8,
		fontSize: 8,
		color: COLORS.label,
		textAlign: "center",
	},
	pageNumber: {
		position: "absolute",
		bottom: 8,
		left: 0,
		right: 0,
		fontSize: 7,
		color: COLORS.label,
		textAlign: "center",
	},
});

function formatCategory(category: string): string {
	return category
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

function formatPaymentMethod(method: string | null): string {
	if (!method) return "—";
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}

type ThermalInvoiceDocumentProps = {
	booking: BookingWithRoom;
	issuedBy: string;
	transactions: LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
};

export function ThermalInvoiceDocument({
	booking,
	transactions,
	issuedBy,
	total,
	payments,
	remainingBalance,
}: ThermalInvoiceDocumentProps) {
	const invoiceRef = `INV-${booking.bookingRef}`;
	const issuedDate = format(new Date(), "MMM d, yyyy h:mm a");

	return (
		<Document
			title={`Receipt ${invoiceRef}`}
			author="Sara Building Transient"
			subject={`Receipt for ${formatGuestName(booking)}`}
		>
			<Page size={[PAGE_WIDTH_PT, PAGE_HEIGHT_PT]} style={styles.page} wrap>
				<View style={styles.brandBlock}>
					<Text style={[styles.brand, styles.center]}>SARA BUILDING</Text>
					<Text style={[styles.brand, styles.center]}>TRANSIENT</Text>
					<Text style={[styles.subtitle, styles.center]}>
						Guest House · Ledger
					</Text>
				</View>

				<View style={styles.ruleThick} />
				<Text style={styles.docTitle}>RECEIPT {invoiceRef}</Text>
				<View style={styles.rule} />

				<View>
					<View>
						<View style={styles.kvRow}>
							<Text style={styles.kvLabel}>Guest</Text>
							<Text style={styles.kvValue}>{formatGuestName(booking)}</Text>
						</View>
						{booking.contactNumber ? (
							<View style={styles.kvRow}>
								<Text style={styles.kvLabel}>Contact</Text>
								<Text style={styles.kvValue}>{booking.contactNumber}</Text>
							</View>
						) : null}
						<View style={styles.kvRow}>
							<Text style={styles.kvLabel}>Booking</Text>
							<Text style={styles.kvValue}>{booking.bookingRef}</Text>
						</View>
					</View>

					<View style={[styles.rule, { marginVertical: 3 }]} />

					<View>
						{booking.checkIn ? (
							<View style={styles.kvRow}>
								<Text style={styles.kvLabel}>Check-in</Text>
								<Text style={styles.kvValue}>
									{format(new Date(booking.checkIn), "MMM d, h:mm a")}
								</Text>
							</View>
						) : null}
						<View style={styles.kvRow}>
							<Text style={styles.kvLabel}>Check-out</Text>
							<Text style={styles.kvValue}>
								{format(new Date(booking.checkOut), "MMM d, h:mm a")}
							</Text>
						</View>
					</View>

					<View style={[styles.rule, { marginVertical: 5 }]} />

					<View>
						<View style={styles.kvRow}>
							<Text style={styles.kvLabel}>Issued</Text>
							<Text style={styles.kvValue}>{issuedDate}</Text>
						</View>
						<View style={styles.kvRow}>
							<Text style={styles.kvLabel}>Issued by</Text>
							<Text style={styles.kvValue}>{issuedBy}</Text>
						</View>
					</View>
				</View>

				<View style={styles.rule} />
				<Text style={[styles.kvLabel, styles.center, styles.bold]}>
					CHARGES
				</Text>
				<View style={styles.rule} />

				{transactions.length === 0 ? (
					<Text style={[styles.subtitle, styles.center]}>
						No ledger transactions yet.
					</Text>
				) : (
					transactions.map((tx, idx) => (
						<View key={tx.id} style={styles.itemBlock} wrap={false}>
							{idx > 0 ? (
								<View style={[styles.rule, { marginVertical: 2 }]} />
							) : null}
							<Text style={styles.itemTitle}>
								{tx.description ?? formatCategory(tx.category)}
							</Text>
							<Text style={styles.itemMeta}>
								{format(new Date(tx.createdAt), "MMM d, h:mm a")}
								{tx.paymentMethod
									? ` · ${formatPaymentMethod(tx.paymentMethod)}`
									: ""}
								{tx.referenceNumber ? ` · ${tx.referenceNumber}` : ""}
							</Text>
							<View style={styles.itemAmountRow}>
								<Text style={styles.itemAmount}>
									{formatPeso(Number(tx.amount))}
								</Text>
								{tx.isPaid ? (
									<Text style={styles.paidPill}>PAID</Text>
								) : (
									<Text style={styles.unpaidPill}>UNPAID</Text>
								)}
							</View>
						</View>
					))
				)}

				<View style={styles.ruleThick} />

				<View style={styles.totalsBlock} wrap={false}>
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>Total charges</Text>
						<Text style={styles.totalsValue}>{formatPeso(total)}</Text>
					</View>
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>Total paid</Text>
						<Text style={styles.totalsValue}>{formatPeso(payments)}</Text>
					</View>
					<View style={[styles.totalsRow, { marginTop: 4 }]}>
						<Text style={styles.balanceLabel}>BALANCE</Text>
						<Text style={styles.balanceValue}>
							{formatPeso(remainingBalance)}
						</Text>
					</View>
				</View>

				<View style={styles.rule} />
				<Text style={styles.footer}>Thank you for your stay.</Text>

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>
						totalPages > 1 ? `${pageNumber}/${totalPages}` : ""
					}
					fixed
				/>
			</Page>
		</Document>
	);
}
