import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { bookingKeys, roomKeys } from '@/lib/bookings/bookings.queries'
import { createBooking } from '@/lib/bookings/bookings.actions'
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

  const createMutation = useMutation({
    mutationFn: (data: {
      roomId: number
      firstName: string
      lastName: string
      contactNumber?: string
      checkInDate: string
      checkOutDate: string
      occupantsCount: number
      isNonRefundable?: boolean
      walkIn?: boolean
    }) =>
      createBooking({
        data: {
          ...data,
          depositPercentage: data.isNonRefundable ? 100 : 20,
          isNonRefundable: data.isNonRefundable ?? false,
          walkIn: data.walkIn ?? false,
        },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all })
      queryClient.invalidateQueries({ queryKey: roomKeys.all })
      onSuccess(result.bookingRef)
    },
    onError: (err: Error) => {
      onError(err.message || 'Failed to create booking')
    },
  })

  const dates = defaultDates()

  const form = useForm({
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
    onSubmit: async ({ value }) => {
      createMutation.mutate({
        roomId: Number(value.roomId),
        firstName: value.firstName,
        lastName: value.lastName,
        contactNumber: value.contactNumber || undefined,
        checkInDate: value.checkInDate,
        checkOutDate: value.checkOutDate,
        occupantsCount: value.occupantsCount,
        isNonRefundable: walkIn ? false : value.isNonRefundable,
        walkIn,
      })
    },
  })

  const resetForm = () => {
    const freshDates = defaultDates()
    form.reset()
    form.setFieldValue('checkInDate', freshDates.checkInDate)
    form.setFieldValue('checkOutDate', freshDates.checkOutDate)
  }

  const availableRooms = rooms.filter(
    (room) => room.status.toUpperCase() === 'AVAILABLE',
  )

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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {walkIn ? 'Walk-in Booking' : 'New Reservation'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <form.Field
                name="roomId"
                validators={{
                  onChange: ({ value }) =>
                    !value ? 'Room is required' : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <select
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
                    >
                      <option
                        value=""
                        disabled
                        className="bg-background text-muted-foreground"
                      >
                        Select a room
                      </option>
                      {availableRooms.length === 0 ? (
                        <option
                          value=""
                          disabled
                          className="bg-background text-muted-foreground"
                        >
                          No available rooms
                        </option>
                      ) : null}
                      {availableRooms.map((room) => (
                        <option
                          key={room.id}
                          value={room.id.toString()}
                          className="bg-background text-foreground"
                        >
                          {room.roomNumber} - {room.type} (₱{room.basePrice})
                        </option>
                      ))}
                    </select>
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <form.Field
                  name="firstName"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? 'First name is required' : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="First name"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <form.Field
                  name="lastName"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? 'Last name is required' : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Last name"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact</Label>
              <form.Field
                name="contactNumber"
              >
                {(field) => (
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Phone number"
                  />
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <form.Field
                  name="checkInDate"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? 'Check-in date is required' : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <Input
                        type="date"
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <form.Field
                  name="checkOutDate"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? 'Check-out date is required' : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <Input
                        type="date"
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Occupants Count</Label>
              <form.Field
                name="occupantsCount"
                validators={{
                  onChange: ({ value }) =>
                    value < 1 ? 'At least 1 occupant required' : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Input
                      type="number"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 1)}
                      min={1}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {!walkIn && (
              <form.Field
                name="isNonRefundable"
              >
                {(field) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label
                      htmlFor={field.name}
                      className="text-sm cursor-pointer"
                    >
                      Non-refundable (100% deposit, auto check-in)
                    </Label>
                  </div>
                )}
              </form.Field>
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
            <form.Subscribe
              selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {walkIn ? 'Check In Walk-in' : 'Create Booking'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
