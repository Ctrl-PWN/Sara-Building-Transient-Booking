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
import { userMutations } from "@/lib/users/users.mutations";

type UserRow = {
	id: string;
	name: string;
};

type DeleteUserDialogProps = {
	user: UserRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteUserDialog({
	user,
	open,
	onOpenChange,
}: DeleteUserDialogProps) {
	const queryClient = useQueryClient();
	const deleteUser = useMutation(userMutations.delete(queryClient));

	async function handleDelete() {
		if (!user) return;
		try {
			await deleteUser.mutateAsync({ userId: user.id });
			toast.success(`${user.name} deleted`);
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete user",
			);
		}
	}

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete user</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-medium text-foreground">{user.name}</span>?
						This action cannot be undone.
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
						disabled={deleteUser.isPending}
					>
						{deleteUser.isPending ? "Deleting…" : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
