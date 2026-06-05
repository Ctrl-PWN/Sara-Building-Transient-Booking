import { reservationFeeTypeOptions } from './create-booking-form.constants'
import type { CreateBookingFormSectionProps } from './create-booking-form.types'

export function CreateBookingReservationSection({
  form,
}: CreateBookingFormSectionProps) {
  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <form.AppField name="reservationFeeType">
        {(field) => (
          <field.RadioChoiceCardField
            label="Reservation fee type"
            options={[...reservationFeeTypeOptions]}
          />
        )}
      </form.AppField>
      <form.Subscribe
        selector={(state) =>
          'reservationFeeType' in state.values
            ? state.values.reservationFeeType
            : 'PERCENT'
        }
      >
        {(feeType) => (
          <form.AppField name="reservationFeeValue">
            {(field) => (
              <field.NumberField
                label={
                  feeType === 'PERCENT'
                    ? 'Reservation fee percentage'
                    : 'Reservation fee amount (₱)'
                }
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>
    </div>
  )
}
