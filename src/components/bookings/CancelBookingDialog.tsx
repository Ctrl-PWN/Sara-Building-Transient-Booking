import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CancelBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookingRef: string;
	guestName: string;
	onConfirm: (reason: string) => void;
};

export function CancelBookingDialog({
	open,
	onOpenChange,
	bookingRef,
	guestName,
	onConfirm,
}: CancelBookingDialogProps) {
	const [reason, setReason] = useState("");

	const handleConfirm = () => {
		onConfirm(reason || "Cancelled by staff");
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Cancel Booking</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<p className="text-sm text-muted-foreground">
						Are you sure you want to cancel {bookingRef} for {guestName}?
					</p>
					<div className="space-y-2">
						<Label>Cancellation Reason</Label>
						<Input
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Reason for cancellation"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Keep Booking
					</Button>
					<Button variant="destructive" onClick={handleConfirm}>
						Confirm Cancellation
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
