import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
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
import { useAppForm, DateRangeField } from '@/integrations/tanstack-form'
import { bookingMutations } from '@/lib/bookings/bookings.mutations'
import { createBookingFormSchema } from '@/lib/bookings/schemas'
import type { rooms } from '@/db/schema'
import type { BookingWithRoom } from '@/lib/bookings/types'

type Room = typeof rooms.$inferSelect

type CreateBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  bookings: BookingWithRoom[]
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
  bookings,
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
    })
  }, [form])

  const toFieldErrors = (errors: readonly unknown[]) =>
    errors.map((error) =>
      typeof error === 'string'
        ? { message: error }
        : { message: String(error) },
    )

  const { checkInDate, checkOutDate } = useStore(form.store, (state) => ({
    checkInDate: state.values.checkInDate,
    checkOutDate: state.values.checkOutDate,
  }))

  const conflictedRoomIds = new Set<number>()
  if (checkInDate && checkOutDate) {
    const start = new Date(checkInDate).getTime()
    const end = new Date(checkOutDate).getTime()
    if (end > start) {
      for (const booking of bookings) {
        if (booking.status !== 'RESERVED' && booking.status !== 'CHECKED_IN') {
          continue
        }
        const bStart = new Date(booking.checkInDate).getTime()
        const bEnd = new Date(booking.checkOutDate).getTime()
        if (bStart < end && bEnd > start) {
          conflictedRoomIds.add(booking.roomId)
        }
      }
    }
  }

  // Per-room set of booked day timestamps (start-of-day ms).
  const bookedDaysByRoom = new Map<number, Set<number>>()
  for (const booking of bookings) {
    if (booking.status !== 'RESERVED' && booking.status !== 'CHECKED_IN') {
      continue
    }
    const bStart = new Date(booking.checkInDate)
    bStart.setHours(0, 0, 0, 0)
    const bEnd = new Date(booking.checkOutDate)
    bEnd.setHours(0, 0, 0, 0)
    let set = bookedDaysByRoom.get(booking.roomId)
    if (!set) {
      set = new Set<number>()
      bookedDaysByRoom.set(booking.roomId, set)
    }
    for (let t = bStart.getTime(); t < bEnd.getTime(); t += 86_400_000) {
      set.add(t)
    }
  }

  // A date is fully booked when every room is unavailable on it
  // (either has a booking covering it, or has a non-AVAILABLE status).
  // Walk only dates that appear in some booking — that covers the visible
  // range. The calendar's minDate guards against past dates.
  const fullyBookedDays = new Set<number>()
  for (const set of bookedDaysByRoom.values()) {
    for (const day of set) {
      const allUnavailable = rooms.every(
        (r) =>
          r.status !== 'AVAILABLE' || (bookedDaysByRoom.get(r.id)?.has(day) ?? false),
      )
      if (allUnavailable) fullyBookedDays.add(day)
    }
  }
  const isDateFullyBooked = (date: Date) => {
    const t = new Date(date)
    t.setHours(0, 0, 0, 0)
    return fullyBookedDays.has(t.getTime())
  }

  const allRooms = rooms.slice().sort((a, b) => {
    const aBlocked =
      a.status !== 'AVAILABLE' || conflictedRoomIds.has(a.id)
    const bBlocked =
      b.status !== 'AVAILABLE' || conflictedRoomIds.has(b.id)
    if (!aBlocked && bBlocked) return -1
    if (aBlocked && !bBlocked) return 1
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  const roomOptions = allRooms.map((room) => {
    const isConflicted = conflictedRoomIds.has(room.id)
    const statusTag =
      isConflicted && room.status === 'AVAILABLE'
        ? '[OCCUPIED]'
        : room.status !== 'AVAILABLE'
          ? `[${room.status}]`
          : ''

    return {
      value: room.id.toString(),
      label: `${room.roomNumber} - ${room.type} (₱${room.basePrice})${
        statusTag ? ` ${statusTag}` : ''
      }`,
      disabled: walkIn
        ? room.status !== 'AVAILABLE'
        : ['MAINTENANCE', 'OUT_OF_ORDER'].includes(room.status),
    }
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
              <DateRangeField
                form={form}
                startFieldName="checkInDate"
                endFieldName="checkOutDate"
                label="Stay Dates"
                startLabel="Check-in"
                endLabel="Check-out"
                minDate={new Date()}
                disabledDates={isDateFullyBooked}
              />

              <form.AppField name="roomId">
                {(field) => (
                  <field.SelectField
                    label="Room"
                    placeholder="Select a room"
                    options={roomOptions}
                  />
                )}
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
