import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import type { Room } from "@/lib/rooms/types";

type DeleteRoomDialogProps = {
	room: Room | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteRoomDialog({
	room,
	open,
	onOpenChange,
}: DeleteRoomDialogProps) {
	const queryClient = useQueryClient();
	const deleteRoom = useMutation(roomMutations.delete(queryClient));

	async function handleDelete() {
		if (!room) return;
		try {
			await deleteRoom.mutateAsync({ id: room.id });
			toast.success(`Room ${room.roomNumber} deleted`);
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete room",
			);
		}
	}

	if (!room) return null;

	const isOccupied = room.status === "OCCUPIED";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete room</DialogTitle>
					<DialogDescription>
						{isOccupied ? (
							<span>
								Room{" "}
								<span className="font-medium text-foreground">
									{room.roomNumber}
								</span>{" "}
								is currently occupied and cannot be deleted.
							</span>
						) : (
							<span>
								Are you sure you want to delete room{" "}
								<span className="font-medium text-foreground">
									{room.roomNumber}
								</span>
								? This action cannot be undone.
							</span>
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						variant="destructive"
						onClick={() => {
							void handleDelete();
						}}
						disabled={deleteRoom.isPending || isOccupied}
					>
						{deleteRoom.isPending ? "Deleting…" : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
