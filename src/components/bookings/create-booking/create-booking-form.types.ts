import type { useCreateBookingForm } from "./useCreateBookingForm";

export type CreateBookingForm = ReturnType<typeof useCreateBookingForm>;

export type CreateBookingFormSectionProps = {
	form: CreateBookingForm;
};
