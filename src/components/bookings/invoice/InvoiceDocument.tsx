import "@/lib/pdf/fonts";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

const COLORS = {
	text: "#1a1c1b",
	muted: "#6b7280",
	border: "#e5e7eb",
	emerald: "#059669",
	amber: "#d97706",
	paidBg: "#f5dcbe",
	paidFg: "#725f48",
	unpaidBorder: "#d1d5db",
};

const styles = StyleSheet.create({
	page: {
		paddingTop: 40,
		paddingBottom: 40,
		paddingHorizontal: 40,
		fontFamily: "Inter",
		fontSize: 10,
		color: COLORS.text,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	title: {
		fontFamily: "Newsreader",
		fontSize: 22,
		fontWeight: 600,
	},
	ref: {
		marginTop: 4,
		fontSize: 10,
		color: COLORS.muted,
	},
	issuedLabel: {
		fontSize: 10,
		color: COLORS.muted,
	},
	issuedValue: {
		fontSize: 10,
		fontWeight: 500,
		color: COLORS.text,
	},
	grid: {
		flexDirection: "row",
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
		gap: 24,
	},
	gridCol: {
		flex: 1,
	},
	gridColRight: {
		flex: 1,
		alignItems: "flex-end",
	},
	sectionLabel: {
		fontSize: 8,
		fontWeight: 500,
		letterSpacing: 1,
		textTransform: "uppercase",
		color: COLORS.muted,
	},
	sectionValue: {
		marginTop: 4,
		fontSize: 11,
		fontWeight: 500,
		color: COLORS.text,
	},
	sectionSub: {
		marginTop: 2,
		fontSize: 10,
		color: COLORS.muted,
	},
	tableSection: {
		paddingVertical: 20,
	},
	tableHeader: {
		flexDirection: "row",
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	tableHeaderCell: {
		fontSize: 8,
		fontWeight: 500,
		letterSpacing: 1,
		textTransform: "uppercase",
		color: COLORS.muted,
	},
	thDescription: { width: "38%" },
	thPayment: { width: "14%" },
	thReference: { width: "18%" },
	thAmount: { width: "15%", textAlign: "right" },
	thStatus: { width: "15%", textAlign: "right" },
	row: {
		flexDirection: "row",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	cellDescription: { width: "38%" },
	cellPayment: { width: "14%", color: COLORS.muted },
	cellReference: { width: "18%", color: COLORS.muted },
	cellAmount: {
		width: "15%",
		textAlign: "right",
		fontWeight: 500,
	},
	cellStatus: { width: "15%", alignItems: "flex-end" },
	descTitle: { fontSize: 10, fontWeight: 500, color: COLORS.text },
	descMeta: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
	cellMuted: { fontSize: 10, color: COLORS.muted },
	cellText: { fontSize: 10, color: COLORS.text },
	empty: {
		paddingVertical: 40,
		textAlign: "center",
		fontSize: 10,
		color: COLORS.muted,
	},
	paidPill: {
		backgroundColor: COLORS.paidBg,
		color: COLORS.paidFg,
		fontSize: 8,
		fontWeight: 500,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	unpaidPill: {
		fontSize: 8,
		fontWeight: 500,
		color: COLORS.muted,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: COLORS.unpaidBorder,
	},
	totalsBlock: {
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 4,
	},
	totalsLabel: { fontSize: 10, color: COLORS.muted },
	totalsValue: { fontSize: 10, fontWeight: 500, color: COLORS.text },
	totalsValueEmerald: { fontSize: 10, fontWeight: 500, color: COLORS.emerald },
	totalsDivider: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingTop: 8,
		marginTop: 4,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
	},
	totalsBalanceLabel: { fontSize: 11, fontWeight: 600, color: COLORS.text },
	totalsBalanceValue: { fontSize: 11, fontWeight: 600, color: COLORS.emerald },
	totalsBalanceValueAmber: {
		fontSize: 11,
		fontWeight: 600,
		color: COLORS.amber,
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

type InvoiceDocumentProps = {
	booking: BookingWithRoom;
	issuedBy: string;
	transactions: LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
};

export function InvoiceDocument({
	booking,
	transactions,
	issuedBy,
	total,
	payments,
	remainingBalance,
}: InvoiceDocumentProps) {
	const invoiceRef = `INV-${booking.bookingRef}`;
	const issuedDate = format(new Date(), "MMM d, yyyy h:mm a");

	return (
		<Document
			title={`Invoice ${invoiceRef}`}
			author="Sara Building Transient"
			subject={`Invoice for ${formatGuestName(booking)}`}
		>
			<Page size="A4" style={styles.page}>
				<View style={styles.header} fixed>
					<View>
						<Text style={styles.title}>Invoice</Text>
						<Text style={styles.ref}>{invoiceRef}</Text>
					</View>
					<View>
						<Text style={styles.issuedLabel}>
							Issued: <Text style={styles.issuedValue}>{issuedDate}</Text>
						</Text>
						<Text style={styles.issuedLabel}>
							Issued by: <Text style={styles.issuedValue}>{issuedBy}</Text>
						</Text>
					</View>
				</View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Guest</Text>
            <Text style={styles.sectionValue}>{formatGuestName(booking)}</Text>
            {booking.contactNumber ? (
              <Text style={styles.sectionSub}>{booking.contactNumber}</Text>
            ) : null}
          </View>
          <View style={styles.gridColRight}>
            <Text style={styles.sectionLabel}>Booking</Text>
            <Text style={styles.sectionValue}>{booking.bookingRef}</Text>
            <Text style={styles.sectionSub}>
              Room {booking.roomNumber} ·{' '}
              {format(new Date(booking.checkInDate), 'MMM d, yyyy')} at{' '}
              {booking.checkInTime} —{' '}
              {format(new Date(booking.checkOutDate), 'MMM d, yyyy')} at{' '}
              {booking.checkOutTime}
            </Text>
          </View>
        </View>

				<View style={styles.tableSection}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderCell, styles.thDescription]}>
							Description
						</Text>

						<Text style={[styles.tableHeaderCell, styles.thPayment]}>
							Payment
						</Text>
						<Text style={[styles.tableHeaderCell, styles.thReference]}>
							Reference
						</Text>
						<Text style={[styles.tableHeaderCell, styles.thAmount]}>
							Amount
						</Text>
						<Text style={[styles.tableHeaderCell, styles.thStatus]}>
							Status
						</Text>
					</View>
					{transactions.length === 0 ? (
						<Text style={styles.empty}>No ledger transactions yet.</Text>
					) : (
						transactions.map((tx) => (
							<View key={tx.id} style={styles.row} wrap={false}>
								<View style={styles.cellDescription}>
									<Text style={styles.descTitle}>
										{tx.description ?? formatCategory(tx.category)}
									</Text>
									<Text style={styles.descMeta}>
										{format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
									</Text>
								</View>
								<Text style={[styles.cellMuted, styles.cellPayment]}>
									{formatPaymentMethod(tx.paymentMethod)}
								</Text>
								<Text
									style={[styles.cellMuted, styles.cellReference]}
									wrap={false}
								>
									{tx.referenceNumber ?? "—"}
								</Text>
								<Text style={[styles.cellAmount, styles.cellText]}>
									{formatPeso(Number(tx.amount))}
								</Text>
								<View style={styles.cellStatus}>
									{tx.isPaid ? (
										<Text style={styles.paidPill}>Paid</Text>
									) : (
										<Text style={styles.unpaidPill}>Unpaid</Text>
									)}
								</View>
							</View>
						))
					)}
				</View>

				<View style={styles.totalsBlock} wrap={false}>
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>Total charges</Text>
						<Text style={styles.totalsValue}>{formatPeso(total)}</Text>
					</View>
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>Total paid</Text>
						<Text style={styles.totalsValueEmerald}>
							{formatPeso(payments)}
						</Text>
					</View>
					<View style={styles.totalsDivider}>
						<Text style={styles.totalsBalanceLabel}>Balance</Text>
						<Text
							style={
								remainingBalance > 0
									? styles.totalsBalanceValueAmber
									: styles.totalsBalanceValue
							}
						>
							{formatPeso(remainingBalance)}
						</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
}
