import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { roomStatusValues } from "@/db/schema/enums";
import { useAppForm } from "@/integrations/tanstack-form";
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import { createRoomSchema } from "@/lib/rooms/schemas";

type CreateRoomSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateRoomSheet({ open, onOpenChange }: CreateRoomSheetProps) {
	const queryClient = useQueryClient();
	const createRoom = useMutation(roomMutations.create(queryClient));

	const form = useAppForm({
		defaultValues: {
			roomNumber: "",
			type: "",
			capacity: 1,
			basePrice: 0,
			monthlyPrice: 0,
			status: "AVAILABLE" as (typeof roomStatusValues)[number],
		},
		validators: { onSubmit: createRoomSchema },
		onSubmit: async ({ value }) => {
			try {
				await createRoom.mutateAsync(value);
				form.reset();
				onOpenChange(false);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to create room",
				);
			}
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Create room</SheetTitle>
					<SheetDescription>Add a new room to the inventory.</SheetDescription>
				</SheetHeader>

				<form
					className="flex flex-col gap-4 px-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.AppForm>
						<form.AppField name="roomNumber">
							{(field) => (
								<field.TextField
									label="Room number"
									placeholder="101"
									maxLength={3}
								/>
							)}
						</form.AppField>

						<form.AppField name="type">
							{(field) => (
								<field.TextField
									label="Room type"
									placeholder="Standard"
									maxLength={20}
								/>
							)}
						</form.AppField>

						<form.AppField name="capacity">
							{(field) => (
								<field.NumberField
									label="Capacity"
									placeholder="2"
									min={1}
									max={9999}
								/>
							)}
						</form.AppField>

						<form.AppField name="basePrice">
							{(field) => (
								<field.NumberField
									label="Base price"
									placeholder="1200"
									description="Price per day in PHP"
									min={1}
									max={9999999}
								/>
							)}
						</form.AppField>

						<form.AppField name="monthlyPrice">
							{(field) => (
								<field.NumberField
									label="Monthly price"
									placeholder="15000"
									description="Price per month in PHP (leave 0 if not applicable)"
								/>
							)}
						</form.AppField>

						<form.AppField name="status">
							{(field) => (
								<field.SelectField
									label="Status"
									options={roomStatusValues.map((s) => ({
										value: s,
										label: s.replace(/_/g, " "),
									}))}
								/>
							)}
						</form.AppField>

						<div className="flex justify-end gap-2 pt-2">
							<form.SubmitButton label="Create room" />
						</div>
					</form.AppForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}
