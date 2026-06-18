import type { rooms } from "@/db/schema";
import type { useCreateBookingForm } from "./useCreateBookingForm";

export type CreateBookingForm = ReturnType<typeof useCreateBookingForm>;

type Room = typeof rooms.$inferSelect;

export type CreateBookingFormSectionProps = {
	form: CreateBookingForm;
	rooms?: Room[];
};
