import {
	CircleNotchIcon,
	PrinterIcon,
	ReceiptIcon,
	XIcon,
} from "@phosphor-icons/react";
import { lazy, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { BookingWithRoom } from "@/lib/bookings/types";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import { ThermalInvoiceDocument } from "./ThermalInvoiceDocument";
import { useThermalPrint } from "./useThermalPrint";

const PDFViewer = lazy(() =>
	import("@react-pdf/renderer").then((m) => ({ default: m.PDFViewer })),
);

type ThermalPrintPreviewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	transactions: LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
	issuedBy: string;
};

export function ThermalPrintPreview(props: ThermalPrintPreviewProps) {
	const {
		open,
		onOpenChange,
		booking,
		transactions,
		total,
		payments,
		remainingBalance,
		issuedBy,
	} = props;

	const { status, error, print, reset } = useThermalPrint();
	const [showPreview, setShowPreview] = useState(true);

	const documentElement = (
		<ThermalInvoiceDocument
			booking={booking}
			transactions={transactions}
			total={total}
			payments={payments}
			remainingBalance={remainingBalance}
			issuedBy={issuedBy}
		/>
	);

	function handlePrint() {
		void print(documentElement);
	}

	function handleOpenChange(next: boolean) {
		if (!next) {
			reset();
			setShowPreview(true);
		}
		onOpenChange(next);
	}

	const printing = status === "preparing" || status === "printing";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md sm:max-w-md">
				<DialogHeader>
					<div className="flex items-start justify-between gap-4">
						<div>
							<DialogTitle className="flex items-center gap-2">
								<ReceiptIcon className="text-muted-foreground" size={18} />
								Thermal Receipt
							</DialogTitle>
							<DialogDescription>
								80mm roll · {booking.bookingRef}
							</DialogDescription>
						</div>
						<DialogClose
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Close"
									className="-mt-1 -mr-1"
								>
									<XIcon size={16} />
								</Button>
							}
						/>
					</div>
				</DialogHeader>

				{showPreview ? (
					<div className="mt-2 flex max-h-[55vh] justify-center overflow-auto rounded-lg border border-border bg-muted/40 p-4">
						<div className="w-[226px] shrink-0 overflow-hidden rounded-sm border border-border bg-white shadow-sm">
							<Suspense
								fallback={
									<div className="flex h-64 items-center justify-center">
										<CircleNotchIcon
											className="animate-spin text-muted-foreground"
											size={18}
										/>
									</div>
								}
							>
								<PDFViewer
									width="100%"
									height={420}
									showToolbar={false}
									style={{ width: "100%", height: 420, border: "none" }}
								>
									{documentElement}
								</PDFViewer>
							</Suspense>
						</div>
					</div>
				) : null}

				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}

				<DialogFooter className="mt-2 flex-row items-center justify-between gap-2 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setShowPreview((v) => !v)}
					>
						{showPreview ? "Hide preview" : "Show preview"}
					</Button>
					<div className="flex gap-2">
						<DialogClose
							render={
								<Button type="button" variant="outline" size="sm">
									Cancel
								</Button>
							}
						/>
						<Button
							type="button"
							size="sm"
							onClick={handlePrint}
							disabled={printing}
						>
							{printing ? (
								<CircleNotchIcon
									className="animate-spin"
									data-icon="inline-start"
									size={16}
								/>
							) : (
								<PrinterIcon data-icon="inline-start" size={16} />
							)}
							{status === "preparing"
								? "Preparing…"
								: status === "printing"
									? "Printing…"
									: "Print"}
						</Button>
					</div>
				</DialogFooter>

				<p className="text-xs text-muted-foreground">
					Choose your 80mm thermal printer in the system print dialog.
				</p>
			</DialogContent>
		</Dialog>
	);
}
