import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useFormContext } from "@/integrations/tanstack-form/form-context";

type SubmitButtonProps = {
	label: string;
} & Omit<React.ComponentProps<typeof Button>, "type" | "disabled" | "children">;

function SubmitButton({ label, ...buttonProps }: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={(state) => ({
				canSubmit: state.canSubmit,
				isSubmitting: state.isSubmitting,
			})}
		>
			{({ canSubmit, isSubmitting }) => (
				<Button
					type="submit"
					disabled={!canSubmit || isSubmitting}
					{...buttonProps}
				>
					{isSubmitting ? <Spinner data-icon="inline-start" /> : null}
					{label}
				</Button>
			)}
		</form.Subscribe>
	);
}

type ResetButtonProps = {
	label?: string;
} & Omit<React.ComponentProps<typeof Button>, "type" | "onClick" | "children">;

function ResetButton({
	label = "Reset",
	variant = "outline",
	...buttonProps
}: ResetButtonProps) {
	const form = useFormContext();

	return (
		<Button
			type="button"
			variant={variant}
			onClick={() => form.reset()}
			{...buttonProps}
		>
			{label}
		</Button>
	);
}

export { ResetButton, SubmitButton };
