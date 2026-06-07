import { createFormHook } from "@tanstack/react-form";
import { ResetButton, SubmitButton } from "@/components/form/form-components";
import {
	CheckboxField,
	DateRangeField,
	NumberField,
	RadioChoiceCardField,
	RadioGroupField,
	SelectField,
	TextareaField,
	TextField,
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
		DateRangeField,
		ToggleField,
	},
	formComponents: {
		SubmitButton,
		ResetButton,
	},
});

export { formOptions } from "@tanstack/react-form";
