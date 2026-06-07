import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAppForm } from "@/integrations/tanstack-form";
import { createUserSchema } from "@/lib/users/schemas";
import { userMutations } from "@/lib/users/users.mutations";

type CreateUserSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateUserSheet({ open, onOpenChange }: CreateUserSheetProps) {
	const queryClient = useQueryClient();
	const createUser = useMutation(userMutations.create(queryClient));

	const form = useAppForm({
		defaultValues: {
			email: "",
			firstName: "",
			lastName: "",
			password: "",
		},
		validators: { onSubmit: createUserSchema },
		onSubmit: async ({ value }) => {
			await createUser.mutateAsync(value);
			form.reset();
			onOpenChange(false);
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Create user</SheetTitle>
					<SheetDescription>
						Add a new staff account to the system.
					</SheetDescription>
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
						<form.AppField name="firstName">
							{(field) => (
								<field.TextField
									label="First name"
									placeholder="Jane"
									description="Letters and spaces only, max 15 characters"
									maxLength={15}
								/>
							)}
						</form.AppField>

						<form.AppField name="lastName">
							{(field) => (
								<field.TextField
									label="Last name"
									placeholder="Doe"
									description="Letters and spaces only, max 15 characters"
									maxLength={15}
								/>
							)}
						</form.AppField>

						<form.AppField name="email">
							{(field) => (
								<field.TextField
									label="Email"
									type="email"
									placeholder="jane@example.com"
								/>
							)}
						</form.AppField>

						<form.AppField name="password">
							{(field) => (
								<field.TextField
									label="Password"
									type="password"
									placeholder="Minimum 8 characters"
								/>
							)}
						</form.AppField>

						<div className="flex justify-end gap-2 pt-2">
							<form.ResetButton label="Cancel" />
							<form.SubmitButton label="Create user" />
						</div>
					</form.AppForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}
