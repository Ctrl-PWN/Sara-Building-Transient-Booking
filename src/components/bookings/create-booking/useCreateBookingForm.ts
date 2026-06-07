import {
  dynamicSchemaValidators,
  useAppForm,
} from '@/integrations/tanstack-form'
import type { CreateBookingFormValues } from '@/lib/bookings/schemas'
import {
  createBookingFormDefaultValues,
  createBookingFormSchema,
} from '@/lib/bookings/schemas'

export function useCreateBookingForm({
  walkIn,
  onSubmit,
}: {
  walkIn: boolean
  onSubmit: (value: CreateBookingFormValues) => Promise<void>
}) {
  return useAppForm({
    defaultValues: createBookingFormDefaultValues(walkIn),
    ...dynamicSchemaValidators(createBookingFormSchema),
    onSubmit: async ({ value }) => onSubmit(value),
  })
}
