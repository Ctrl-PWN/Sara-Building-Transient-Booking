import "@/lib/pdf/fonts";

import {
	ArrowLeftIcon,
	ArrowSquareOutIcon,
	CircleNotchIcon,
	PrinterIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import { InvoiceDocument } from "./InvoiceDocument";
import { buildLedgerReceiptModel } from "./receipt-model";
import { ThermalReceiptDocument } from "./ThermalInvoiceDocument";
import { ThermalPrintPreview } from "./ThermalPrintPreview";

const PDFViewer = lazy(() =>
	import("@react-pdf/renderer").then((m) => ({ default: m.PDFViewer })),
);

type InvoicePdfPreviewProps = {
	booking: BookingWithRoom;
	transactions: LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
	issuedBy: string;
};

function ViewerSkeleton() {
	return (
		<div className="flex h-[calc(100vh-180px)] items-center justify-center rounded-xl border border-border bg-muted">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CircleNotchIcon className="animate-spin" size={16} />
				Preparing invoice…
			</div>
		</div>
	);
}

export function InvoicePdfPreview(props: InvoicePdfPreviewProps) {
	const { booking } = props;
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [opening, setOpening] = useState(false);
	const [viewerHeight, setViewerHeight] = useState(800);
	const [thermalOpen, setThermalOpen] = useState(false);

	const receipt = buildLedgerReceiptModel(props);

	useEffect(() => {
		setViewerHeight(window.innerHeight - 180);
		const onResize = () => setViewerHeight(window.innerHeight - 180);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		return () => {
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [blobUrl]);

	async function openInNewTab() {
		setOpening(true);
		try {
			const { pdf } = await import("@react-pdf/renderer");
			const blob = await pdf(
				<InvoiceDocument
					booking={booking}
					transactions={props.transactions}
					total={props.total}
					payments={props.payments}
					remainingBalance={props.remainingBalance}
					issuedBy={props.issuedBy}
				/>,
			).toBlob();
			const url = URL.createObjectURL(blob);
			setBlobUrl(url);
			window.open(url, "_blank", "noopener,noreferrer");
		} finally {
			setOpening(false);
		}
	}

	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<Link
						to="/bookings/$bookingId"
						params={{ bookingId: String(booking.id) }}
						className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						<ArrowLeftIcon className="mr-2" size={16} />
						Back to {formatGuestName(booking)}
					</Link>
					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => setThermalOpen(true)}
						>
							<PrinterIcon data-icon="inline-start" size={16} />
							Print Receipt
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={openInNewTab}
							disabled={opening}
						>
							{opening ? (
								<CircleNotchIcon
									className="animate-spin"
									data-icon="inline-start"
									size={16}
								/>
							) : (
								<ArrowSquareOutIcon data-icon="inline-start" size={16} />
							)}
							{opening ? "Opening…" : "Open in new tab"}
						</Button>
					</div>
				</div>

				<Suspense fallback={<ViewerSkeleton />}>
					<div className="overflow-hidden rounded-xl border border-border">
						<PDFViewer
							width="100%"
							height={viewerHeight}
							showToolbar={false}
							style={{
								width: "100%",
								height: "calc(100vh - 180px)",
								border: "none",
							}}
						>
							<InvoiceDocument
								booking={booking}
								transactions={props.transactions}
								total={props.total}
								payments={props.payments}
								remainingBalance={props.remainingBalance}
								issuedBy={props.issuedBy}
							/>
						</PDFViewer>
					</div>
				</Suspense>
			</div>

			<ThermalPrintPreview
				open={thermalOpen}
				onOpenChange={setThermalOpen}
				receipt={receipt}
				pdfDocument={<ThermalReceiptDocument receipt={receipt} />}
				rollLabel={`72mm roll · ${booking.bookingRef}`}
			/>
		</main>
	);
}
