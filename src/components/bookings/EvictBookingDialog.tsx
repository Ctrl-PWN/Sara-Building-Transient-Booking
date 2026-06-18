import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EvictBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	guestName: string;
	roomNumber: string;
	onConfirm: (reason: string) => void;
};

export function EvictBookingDialog({
	open,
	onOpenChange,
	guestName,
	roomNumber,
	onConfirm,
}: EvictBookingDialogProps) {
	const [reason, setReason] = useState("");

	const handleConfirm = () => {
		onConfirm(reason);
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-[425px]">
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Evict Guest</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
					<p className="text-sm text-muted-foreground">
						This is a non-refundable booking. Evicting {guestName} from{" "}
						{roomNumber}.
					</p>
					<div className="space-y-2">
						<Label>Eviction Reason</Label>
						<Input
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Reason for eviction"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={handleConfirm}>
						Confirm Eviction
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogOutsideScroll>
	</Dialog>
);
}
