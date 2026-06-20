import { createFormHook } from "@tanstack/react-form";
import { ResetButton, SubmitButton } from "@/components/form/form-components";
import {
	CheckboxField,
	DateField,
	DateRangeField,
	NumberField,
	PasswordField,
	RadioChoiceCardField,
	RadioGroupField,
	SelectField,
	TextareaField,
	TextField,
	TimeField,
	ToggleField,
} from "@/components/form/form-fields";

import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextareaField,
		CheckboxField,
		SelectField,
		NumberField,
		RadioGroupField,
		RadioChoiceCardField,
		DateField,
		DateRangeField,
		ToggleField,
		PasswordField,
		TimeField,
	},
	formComponents: {
		SubmitButton,
		ResetButton,
	},
});

export { formOptions } from "@tanstack/react-form";
