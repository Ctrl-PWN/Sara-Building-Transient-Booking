import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { useStore } from '@/store'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'

const statusColorMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  RESERVED: 'warning',
  CONFIRMED: 'default',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'outline',
  CANCELLED: 'destructive',
}

export const Route = createFileRoute('/_authenticated/bookings/')({
  component: BookingsListPage,
})

function BookingsListPage() {
  const { bookings, rooms, addBooking, init, refreshRooms } = useStore()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [formData, setFormData] = useState({
    roomId: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    checkInDate: '',
    checkOutDate: '',
    occupantsCount: 2,
  })

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (isAddOpen) {
      void refreshRooms()
    }
  }, [isAddOpen, refreshRooms])

  const handleSave = async () => {
    if (
      !formData.roomId ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.checkInDate ||
      !formData.checkOutDate
    )
      return

    await addBooking({
      roomId: Number(formData.roomId),
      firstName: formData.firstName,
      lastName: formData.lastName,
      contactNumber: formData.contactNumber,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      occupantsCount: formData.occupantsCount,
    })

    setFormData({
      roomId: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      checkInDate: '',
      checkOutDate: '',
      occupantsCount: 2,
    })
    setIsAddOpen(false)
  }

  const availableRooms = rooms.filter(
    (room) => (room.status ?? '').toUpperCase() === 'AVAILABLE',
  )

  return (
    <main className="page-wrap px-4 py-6 pb-8">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-serif tracking-tight text-foreground">
              Bookings Ledger.
            </h2>
            <p className="text-muted-foreground mt-2">
              Manage reservations, guest details, and check-ins.
            </p>
          </div>
          <Button
            className="shrink-0 gap-2 font-medium"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={16} />
            New Reservation
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b border-border p-4 bg-muted/20">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search guest name or ref..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Ref</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {booking.bookingRef}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {booking.firstName} {booking.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.contactNumber}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{booking.checkInDate} &rarr;</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {booking.checkOutDate}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {booking.roomSnapshot.roomNumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {booking.roomSnapshot.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColorMap[booking.status]}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      {booking.paymentStatus === 'OVERDUE' && (
                        <Badge variant="destructive" className="ml-2">
                          OVERDUE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            to="/bookings/$bookingId"
                            params={{ bookingId: String(booking.id) }}
                          />
                        }
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Reservation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Room</Label>
                <select
                  value={formData.roomId}
                  onChange={(event) =>
                    setFormData({ ...formData, roomId: event.target.value })
                  }
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
                >
                  <option
                    value=""
                    disabled
                    className="bg-background text-muted-foreground"
                  >
                    Select a room
                  </option>
                  {rooms.length === 0 ? (
                    <option
                      value=""
                      disabled
                      className="bg-background text-muted-foreground"
                    >
                      Loading rooms...
                    </option>
                  ) : null}
                  {rooms.length > 0 && availableRooms.length === 0 ? (
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
                      {room.roomNumber} - {room.type} (${room.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact</Label>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactNumber: e.target.value,
                    })
                  }
                  placeholder="Phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) =>
                      setFormData({ ...formData, checkInDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOutDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Occupants Count</Label>
                <Input
                  type="number"
                  value={formData.occupantsCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      occupantsCount: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Create Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
