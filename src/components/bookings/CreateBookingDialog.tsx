import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppForm } from '@/integrations/tanstack-form'
import { bookingMutations } from '@/lib/bookings/bookings.mutations'
import { createBookingFormSchema } from '@/lib/bookings/schemas'
import type { rooms } from '@/db/schema'

type Room = typeof rooms.$inferSelect

type CreateBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  walkIn: boolean
  onSuccess: (bookingRef: string) => void
  onError: (error: string) => void
}

function defaultDates() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { checkInDate: fmt(today), checkOutDate: fmt(tomorrow) }
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  rooms,
  walkIn,
  onSuccess,
  onError,
}: CreateBookingDialogProps) {
  const queryClient = useQueryClient()
  const dates = defaultDates()

  const mutation = useMutation(
    bookingMutations.createBooking(queryClient, onSuccess, onError),
  )

  const form = useAppForm({
    defaultValues: {
      roomId: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      checkInDate: dates.checkInDate,
      checkOutDate: dates.checkOutDate,
      occupantsCount: 2,
      isNonRefundable: false,
    },
    validators: { onSubmit: createBookingFormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        roomId: Number(value.roomId),
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        contactNumber: value.contactNumber.trim() || undefined,
        checkInDate: value.checkInDate,
        checkOutDate: value.checkOutDate,
        occupantsCount: value.occupantsCount,
        isNonRefundable: walkIn ? false : value.isNonRefundable,
        walkIn,
      })
    },
  })

  const resetForm = useCallback(() => {
    const freshDates = defaultDates()
    form.reset({
      roomId: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      checkInDate: freshDates.checkInDate,
      checkOutDate: freshDates.checkOutDate,
      occupantsCount: 2,
      isNonRefundable: false,
    })
  }, [form])

  const toFieldErrors = (errors: readonly unknown[]) =>
    errors.map((error) =>
      typeof error === 'string'
        ? { message: error }
        : { message: String(error) },
    )

  const allRooms = rooms.slice().sort((a, b) => {
    if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1
    if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.AppForm>
            <DialogHeader>
              <DialogTitle>
                {walkIn ? 'Walk-in Booking' : 'New Reservation'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <form.AppField name="roomId">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0

                  return (
                    <Field data-invalid={isInvalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Room</FieldLabel>
                      <select
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm [color-scheme:light] dark:bg-input/30 dark:disabled:bg-input/80 dark:[color-scheme:dark]"
                        aria-invalid={isInvalid || undefined}
                      >
                        <option
                          value=""
                          disabled
                          className="bg-background text-foreground"
                        >
                          Select a room
                        </option>
                        {allRooms.map((room) => (
                          <option
                            key={room.id}
                            value={room.id.toString()}
                            disabled={room.status !== 'AVAILABLE'}
                            className="bg-background text-foreground"
                          >
                            {room.roomNumber} - {room.type} (₱{room.basePrice})
                            {room.status !== 'AVAILABLE'
                              ? ` [${room.status}]`
                              : ''}
                          </option>
                        ))}
                      </select>
                      {isInvalid ? (
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      ) : null}
                    </Field>
                  )
                }}
              </form.AppField>

              <div className="grid grid-cols-2 gap-4">
                <form.AppField name="firstName">
                  {(field) => (
                    <field.TextField
                      label="First Name"
                      placeholder="First name"
                    />
                  )}
                </form.AppField>
                <form.AppField name="lastName">
                  {(field) => (
                    <field.TextField
                      label="Last Name"
                      placeholder="Last name"
                    />
                  )}
                </form.AppField>
              </div>

              <form.AppField name="contactNumber">
                {(field) => (
                  <field.TextField label="Contact" placeholder="Phone number" />
                )}
              </form.AppField>

              <div className="grid grid-cols-2 gap-4">
                <form.AppField name="checkInDate">
                  {(field) => <field.TextField label="Check-in" type="date" />}
                </form.AppField>
                <form.AppField name="checkOutDate">
                  {(field) => <field.TextField label="Check-out" type="date" />}
                </form.AppField>
              </div>

              <form.AppField name="occupantsCount">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  const value = field.state.value

                  return (
                    <Field data-invalid={isInvalid || undefined}>
                      <FieldLabel htmlFor={field.name}>
                        Occupants Count
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1}
                        value={Number.isFinite(value) ? value : 1}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          field.handleChange(Number.isNaN(next) ? 1 : next)
                        }}
                        aria-invalid={isInvalid || undefined}
                      />
                      {isInvalid ? (
                        <FieldError
                          errors={toFieldErrors(field.state.meta.errors)}
                        />
                      ) : null}
                    </Field>
                  )
                }}
              </form.AppField>

              {!walkIn && (
                <form.AppField name="isNonRefundable">
                  {(field) => (
                    <field.CheckboxField label="Non-refundable (100% deposit, auto check-in)" />
                  )}
                </form.AppField>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <form.SubmitButton
                label={walkIn ? 'Check In Walk-in' : 'Create Booking'}
              />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  )
}
