import "@/lib/pdf/fonts";

import {
	ArrowSquareOutIcon,
	CircleNotchIcon,
	PrinterIcon,
} from "@phosphor-icons/react";
import { lazy, Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MonthlyBillingPeriod } from "@/lib/bookings/monthly-billing-periods";
import type { BookingWithRoom } from "@/lib/bookings/types";
import type { MonthlyInvoiceUtilityLine } from "@/lib/invoices/schemas";

import { MonthlyInvoiceDocument } from "./MonthlyInvoiceDocument";
import { buildMonthlyInvoiceReceiptModel } from "./receipt-model";
import { ThermalReceiptDocument } from "./ThermalInvoiceDocument";
import { ThermalPrintPreview } from "./ThermalPrintPreview";

const PDFViewer = lazy(() =>
	import("@react-pdf/renderer").then((m) => ({ default: m.PDFViewer })),
);

type MonthlyInvoicePdfPreviewProps = {
	booking: BookingWithRoom;
	period: MonthlyBillingPeriod;
	roomCharge: number;
	utilities: MonthlyInvoiceUtilityLine[];
	issuedBy: string;
};

function ViewerSkeleton() {
	return (
		<div className="flex h-[600px] items-center justify-center rounded-xl border border-border bg-muted">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CircleNotchIcon className="animate-spin" size={16} />
				Preparing invoice…
			</div>
		</div>
	);
}

export function MonthlyInvoicePdfPreview(props: MonthlyInvoicePdfPreviewProps) {
	const { booking, period, roomCharge, utilities, issuedBy } = props;
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [opening, setOpening] = useState(false);
	const [thermalOpen, setThermalOpen] = useState(false);
	const [viewerHeight, setViewerHeight] = useState(800);

	const receipt = buildMonthlyInvoiceReceiptModel({
		booking,
		period,
		roomCharge,
		utilities,
		issuedBy,
	});

	useEffect(() => {
		setViewerHeight(window.innerHeight - 240);
		const onResize = () => setViewerHeight(window.innerHeight - 240);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		return () => {
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [blobUrl]);

	const documentElement = (
		<MonthlyInvoiceDocument
			booking={booking}
			period={period}
			roomCharge={roomCharge}
			utilities={utilities}
			issuedBy={issuedBy}
		/>
	);

	async function openInNewTab() {
		setOpening(true);
		try {
			const { pdf } = await import("@react-pdf/renderer");
			const blob = await pdf(documentElement).toBlob();
			const url = URL.createObjectURL(blob);
			setBlobUrl(url);
			window.open(url, "_blank", "noopener,noreferrer");
		} finally {
			setOpening(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-end gap-2">
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

			<Suspense fallback={<ViewerSkeleton />}>
				<div className="overflow-hidden rounded-xl border border-border">
					<PDFViewer
						width="100%"
						height={viewerHeight}
						showToolbar={false}
						style={{ width: "100%", height: viewerHeight, border: "none" }}
					>
						{documentElement}
					</PDFViewer>
				</div>
			</Suspense>

			<ThermalPrintPreview
				open={thermalOpen}
				onOpenChange={setThermalOpen}
				receipt={receipt}
				pdfDocument={<ThermalReceiptDocument receipt={receipt} />}
				rollLabel={`72mm roll · ${booking.bookingRef}`}
			/>
		</div>
	);
}
