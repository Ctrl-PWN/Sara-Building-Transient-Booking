import { PlusIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

type BookingsPageHeaderProps = {
  onNewReservation: () => void
  onWalkIn: () => void
}

export function BookingsPageHeader({
  onNewReservation,
  onWalkIn,
}: BookingsPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h2 className="text-3xl font-serif tracking-tight text-foreground">
          Bookings Ledger.
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage reservations, guest details, and check-ins.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button className="gap-2 font-medium" onClick={onNewReservation}>
          <PlusIcon size={16} />
          New Reservation
        </Button>
        <Button
          variant="outline"
          className="gap-2 font-medium"
          onClick={onWalkIn}
        >
          <PlusIcon size={16} />
          Walk-in
        </Button>
      </div>
    </div>
  )
}
