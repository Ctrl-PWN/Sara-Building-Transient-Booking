import type { CreateBookingForm } from './create-booking-form.types'

type CreateBookingStayFieldsProps = {
  form: CreateBookingForm
  step: number
  roomOptions: {
    value: string
    label: string
    disabled: boolean
  }[]
  isDateDisabled: (date: Date) => boolean
}

export function CreateBookingStayFields({
  form,
  step,
  roomOptions,
  isDateDisabled,
}: CreateBookingStayFieldsProps) {
  return (
    <>
      {step === 1 && (
        <form.AppField name="roomId">
          {(field) => (
            <field.SelectField
              label="Room"
              placeholder="Select a room"
              options={roomOptions}
            />
          )}
        </form.AppField>
      )}

      {step === 2 && (
        <form.AppField name="checkInDate">
          {(field) => (
            <field.DateRangeField
              endFieldName="checkOutDate"
              label="Stay Dates"
              startLabel="Check-in"
              endLabel="Check-out"
              minDate={new Date()}
              disabledDates={isDateDisabled}
            />
          )}
        </form.AppField>
      )}

      {step === 3 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="firstName">
              {(field) => (
                <field.TextField label="First Name" placeholder="First name" />
              )}
            </form.AppField>
            <form.AppField name="lastName">
              {(field) => (
                <field.TextField label="Last Name" placeholder="Last name" />
              )}
            </form.AppField>
          </div>

          <form.AppField name="contactNumber">
            {(field) => (
              <field.TextField label="Contact" placeholder="Phone number" />
            )}
          </form.AppField>

          <form.AppField name="address">
            {(field) => (
              <field.TextField label="Address" placeholder="Guest address" />
            )}
          </form.AppField>

          <form.AppField name="occupantsCount">
            {(field) => <field.NumberField label="Occupants" />}
          </form.AppField>
        </>
      )}
    </>
  )
}
