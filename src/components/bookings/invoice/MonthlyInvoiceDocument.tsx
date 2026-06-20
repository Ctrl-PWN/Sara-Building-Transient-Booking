import "@/lib/pdf/fonts";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

import { formatPeso } from "@/lib/bookings/stay-pricing";
import { formatGuestName } from "@/lib/bookings/types";

import {
	getMonthlyInvoiceRef,
	type MonthlyInvoiceDocumentProps,
} from "./monthly-invoice.helpers";

const COLORS = {
	text: "#1a1c1b",
	muted: "#6b7280",
	border: "#e5e7eb",
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
	gridCol: { flex: 1 },
	gridColRight: { flex: 1, alignItems: "flex-end" },
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
	tableSection: { paddingVertical: 20 },
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
	thDescription: { width: "50%" },
	thType: { width: "20%" },
	thAmount: { width: "30%", textAlign: "right" },
	row: {
		flexDirection: "row",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	cellDescription: { width: "50%" },
	cellType: { width: "20%", color: COLORS.muted, fontSize: 10 },
	cellAmount: {
		width: "30%",
		textAlign: "right",
		fontWeight: 500,
	},
	descTitle: { fontSize: 10, fontWeight: 500, color: COLORS.text },
	descMeta: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
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
	totalsValue: { fontSize: 11, fontWeight: 600, color: COLORS.text },
});

function formatUtilityType(type: string): string {
	return type.charAt(0) + type.slice(1).toLowerCase();
}

export function MonthlyInvoiceDocument({
	booking,
	period,
	roomCharge,
	utilities,
	issuedBy,
}: MonthlyInvoiceDocumentProps) {
	const invoiceRef = getMonthlyInvoiceRef(booking.bookingRef, period.index);
	const issuedDate = format(new Date(), "MMM d, yyyy h:mm a");
	const totalDue = roomCharge + utilities.reduce((sum, u) => sum + u.amount, 0);

	return (
		<Document
			title={`Invoice ${invoiceRef}`}
			author="Sara Building Transient"
			subject={`Monthly invoice for ${formatGuestName(booking)}`}
		>
			<Page size="A4" style={styles.page} wrap={false}>
				<View style={styles.header} fixed>
					<View>
						<Text style={styles.title}>Monthly Invoice</Text>
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
						<Text style={styles.sectionLabel}>Room</Text>
						<Text style={styles.sectionValue}>
							{booking.roomNumber} ({booking.roomType})
						</Text>
					</View>
					<View style={styles.gridColRight}>
						<Text style={styles.sectionLabel}>Booking</Text>
						<Text style={styles.sectionValue}>{booking.bookingRef}</Text>
						<Text style={styles.sectionLabel}>Billing period</Text>
						<Text style={styles.sectionValue}>{period.label}</Text>
					</View>
				</View>

				<View style={styles.tableSection}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderCell, styles.thDescription]}>
							Description
						</Text>
						<Text style={[styles.tableHeaderCell, styles.thType]}>Type</Text>
						<Text style={[styles.tableHeaderCell, styles.thAmount]}>Amount</Text>
					</View>

					<View style={styles.row} wrap={false}>
						<View style={styles.cellDescription}>
							<Text style={styles.descTitle}>Monthly room charge</Text>
							<Text style={styles.descMeta}>{period.label}</Text>
						</View>
						<Text style={styles.cellType}>Room</Text>
						<Text style={[styles.cellAmount, { color: COLORS.text }]}>
							{formatPeso(roomCharge)}
						</Text>
					</View>

					{utilities.map((utility, index) => (
						<View
							// biome-ignore lint/suspicious/noArrayIndexKey: utility lines have no stable id
							key={`${utility.utilityType}-${index}`}
							style={styles.row}
							wrap={false}
						>
							<View style={styles.cellDescription}>
								<Text style={styles.descTitle}>{utility.description}</Text>
							</View>
							<Text style={styles.cellType}>
								{formatUtilityType(utility.utilityType)}
							</Text>
							<Text style={[styles.cellAmount, { color: COLORS.text }]}>
								{formatPeso(utility.amount)}
							</Text>
						</View>
					))}
				</View>

				<View style={styles.totalsBlock} wrap={false}>
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>Total due</Text>
						<Text style={styles.totalsValue}>{formatPeso(totalDue)}</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
}
