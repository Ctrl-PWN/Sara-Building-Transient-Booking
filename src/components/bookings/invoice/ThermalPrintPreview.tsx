import {
	CircleNotchIcon,
	PrinterIcon,
	ReceiptIcon,
	XIcon,
} from "@phosphor-icons/react";
import type { DocumentProps } from "@react-pdf/renderer";
import { type ReactElement, useState } from "react";

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
import { ReceiptPreview } from "./ReceiptPreview";
import type { ReceiptModel } from "./receipt-model";
import { useThermalPrint } from "./useThermalPrint";

type PrintableDocument = ReactElement<DocumentProps>;

type ThermalPrintPreviewProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	receipt: ReceiptModel;
	pdfDocument?: PrintableDocument;
	rollLabel?: string;
};

export function ThermalPrintPreview({
	open,
	onOpenChange,
	receipt,
	pdfDocument,
	rollLabel,
}: ThermalPrintPreviewProps) {
	const pdfPrint = useThermalPrint();
	const [showPreview, setShowPreview] = useState(true);

	const isBusy =
		pdfPrint.status === "preparing" || pdfPrint.status === "printing";

	function handleOpenChange(next: boolean) {
		if (!next) {
			pdfPrint.reset();
			setShowPreview(true);
		}
		onOpenChange(next);
	}

	async function handlePrint() {
		if (!pdfDocument) {
			throw new Error("No print method available.");
		}
		await pdfPrint.print(pdfDocument);
	}

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
								{rollLabel ?? "72mm roll"} · {receipt.documentRef}
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
						<ReceiptPreview receipt={receipt} />
					</div>
				) : null}

				{pdfPrint.error ? (
					<p className="text-sm text-destructive" role="alert">
						{pdfPrint.error}
					</p>
				) : null}

				<DialogFooter className="mt-2 flex-row items-center justify-between gap-2 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setShowPreview((value) => !value)}
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
							onClick={() => void handlePrint()}
							disabled={isBusy}
						>
							{isBusy ? (
								<CircleNotchIcon
									className="animate-spin"
									data-icon="inline-start"
									size={16}
								/>
							) : (
								<PrinterIcon data-icon="inline-start" size={16} />
							)}
							{pdfPrint.status === "printing"
								? "Printing…"
								: pdfPrint.status === "preparing"
									? "Preparing…"
									: "Print"}
						</Button>
					</div>
				</DialogFooter>

				<p className="text-xs text-muted-foreground">
					Choose your 72mm thermal printer in the system print dialog.
				</p>
			</DialogContent>
		</Dialog>
	);
}
