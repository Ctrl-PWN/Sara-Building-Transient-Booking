import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type PaymentReferenceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	paymentMethod: string;
	referenceNumber: string;
};

function formatPaymentMethod(method: string): string {
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}

export function PaymentReferenceDialog({
	open,
	onOpenChange,
	paymentMethod,
	referenceNumber,
}: PaymentReferenceDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Payment reference</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 py-2">
					<div>
						<p className="text-xs text-muted-foreground">Payment method</p>
						<p className="text-sm font-medium">
							{formatPaymentMethod(paymentMethod)}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Reference number</p>
						<p className="text-sm font-mono break-all">{referenceNumber}</p>
					</div>
				</div>
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
