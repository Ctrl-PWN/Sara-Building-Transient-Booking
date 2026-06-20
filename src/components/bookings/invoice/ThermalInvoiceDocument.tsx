import "@/lib/pdf/fonts";

import {
	Document,
	Font,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

import { formatReceiptAmount, buildLedgerReceiptModel, type ReceiptModel } from "./receipt-model";

Font.registerHyphenationCallback((word) => [word]);

export const THERMAL_PAGE_WIDTH_PT = 72 * (72 / 25.4);
const SAFE_WIDTH_PT = THERMAL_PAGE_WIDTH_PT - 16;
// Height estimates are intentionally generous: react-pdf cannot auto-size a
// page to its content, so the page must be at least as tall as everything that
// renders or the tail (totals + footer) spills onto a second page. Over-
// estimating only leaves a little trailing whitespace, which is harmless on a
// continuous thermal roll, whereas under-estimating breaks the receipt in two.
const PAGE_PADDING_PT = 32; // paddingTop + paddingBottom
const HEADER_HEIGHT_PT = 110; // brand block + thick rule + doc title + rule
const CHARGES_HEADER_PT = 42; // rule + CHARGES label + rule
const KV_ROW_HEIGHT_PT = 16;
const LINE_ITEM_HEIGHT_PT = 52; // title + meta + amount row + divider (allows wrap)
const TOTALS_ROW_HEIGHT_PT = 14;
const BALANCE_HEIGHT_PT = 26;
const FOOTER_HEIGHT_PT = 48;
const BOTTOM_BUFFER_PT = 28;

const COLORS = {
	ink: "#000000",
	label: "#6b7280",
};

const styles = StyleSheet.create({
	page: {
		width: THERMAL_PAGE_WIDTH_PT,
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
});

export function estimateThermalPageHeight(receipt: ReceiptModel): number {
	const itemCount = Math.max(receipt.lineItems.length, 1);
	const totalsRows =
		(receipt.totals.totalCharges !== undefined ? 1 : 0) +
		(receipt.totals.totalPaid !== undefined ? 1 : 0);

	return (
		PAGE_PADDING_PT +
		HEADER_HEIGHT_PT +
		receipt.kvRows.length * KV_ROW_HEIGHT_PT +
		CHARGES_HEADER_PT +
		itemCount * LINE_ITEM_HEIGHT_PT +
		totalsRows * TOTALS_ROW_HEIGHT_PT +
		BALANCE_HEIGHT_PT +
		(receipt.footerText ? FOOTER_HEIGHT_PT : 0) +
		BOTTOM_BUFFER_PT
	);
}

type ThermalReceiptDocumentProps = {
	receipt: ReceiptModel;
};

export function ThermalReceiptDocument({ receipt }: ThermalReceiptDocumentProps) {
	const pageHeight = estimateThermalPageHeight(receipt);

	return (
		<Document
			title={`${receipt.documentTitle} ${receipt.documentRef}`}
			author="Sara Building Transient"
			subject={`Receipt for ${receipt.guestName}`}
		>
			<Page size={[THERMAL_PAGE_WIDTH_PT, pageHeight]} style={styles.page} wrap>
				<View style={styles.brandBlock}>
					<Text style={[styles.brand, styles.center]}>SARA BUILDING</Text>
					<Text style={[styles.brand, styles.center]}>TRANSIENT</Text>
					<Text style={[styles.subtitle, styles.center]}>
						Guest House · Ledger
					</Text>
				</View>

				<View style={styles.ruleThick} />
				<Text style={styles.docTitle}>
					{receipt.documentTitle} {receipt.documentRef}
				</Text>
				<View style={styles.rule} />

				<View>
					{receipt.kvRows.map((row) => (
						<View key={`${row.label}-${row.value}`} style={styles.kvRow}>
							<Text style={styles.kvLabel}>{row.label}</Text>
							<Text style={styles.kvValue}>{row.value}</Text>
						</View>
					))}
				</View>

				<View style={styles.rule} />
				<Text style={[styles.kvLabel, styles.center, styles.bold]}>CHARGES</Text>
				<View style={styles.rule} />

				{receipt.lineItems.length === 0 ? (
					<Text style={[styles.subtitle, styles.center]}>No charges.</Text>
				) : (
					receipt.lineItems.map((item, index) => (
						<View key={item.id} style={styles.itemBlock} wrap={false}>
							{index > 0 ? (
								<View style={[styles.rule, { marginVertical: 2 }]} />
							) : null}
							<Text style={styles.itemTitle}>{item.label}</Text>
							{item.meta ? (
								<Text style={styles.itemMeta}>{item.meta}</Text>
							) : null}
							<View style={styles.itemAmountRow}>
								<Text style={styles.itemAmount}>
									{formatReceiptAmount(item.amount)}
								</Text>
								{item.isPaid !== undefined ? (
									item.isPaid ? (
										<Text style={styles.paidPill}>PAID</Text>
									) : (
										<Text style={styles.unpaidPill}>UNPAID</Text>
									)
								) : null}
							</View>
						</View>
					))
				)}

				<View style={styles.ruleThick} />

				<View style={styles.totalsBlock} wrap={false}>
					{receipt.totals.totalCharges !== undefined ? (
						<View style={styles.totalsRow}>
							<Text style={styles.totalsLabel}>Total charges</Text>
							<Text style={styles.totalsValue}>
								{formatReceiptAmount(receipt.totals.totalCharges)}
							</Text>
						</View>
					) : null}
					{receipt.totals.totalPaid !== undefined ? (
						<View style={styles.totalsRow}>
							<Text style={styles.totalsLabel}>Total paid</Text>
							<Text style={styles.totalsValue}>
								{formatReceiptAmount(receipt.totals.totalPaid)}
							</Text>
						</View>
					) : null}
					<View style={[styles.totalsRow, { marginTop: 4 }]}>
						<Text style={styles.balanceLabel}>
							{receipt.totals.balanceLabel ?? "TOTAL DUE"}
						</Text>
						<Text style={styles.balanceValue}>
							{formatReceiptAmount(receipt.totals.totalDue)}
						</Text>
					</View>
				</View>

				{receipt.footerText ? (
					<>
						<View style={styles.rule} />
						<Text style={styles.footer}>{receipt.footerText}</Text>
					</>
				) : null}
			</Page>
		</Document>
	);
}

/** Backward-compatible wrapper for ledger receipts. */
export function ThermalInvoiceDocument(props: {
	booking: import("@/lib/bookings/types").BookingWithRoom;
	issuedBy: string;
	transactions: import("@/lib/ledger/types").LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
}) {
	const receipt = buildLedgerReceiptModel(props);
	return <ThermalReceiptDocument receipt={receipt} />;
}
