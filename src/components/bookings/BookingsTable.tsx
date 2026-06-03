import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
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
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import type { BookingWithRoom } from '@/lib/bookings/types'

const statusColorMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  RESERVED: 'warning',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'outline',
  CANCELLED: 'destructive',
}

type BookingsTableProps = {
  bookings: BookingWithRoom[]
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function BookingsTable({
  bookings,
  searchQuery,
  onSearchChange,
}: BookingsTableProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border p-4 bg-muted/20">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search guest name or ref..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
                  <p className="text-sm">
                    {format(parseISO(booking.checkInDate), 'MMMM d, yyyy')}{' '}
                    &rarr;
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(parseISO(booking.checkOutDate), 'MMMM d, yyyy')}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {booking.roomNumber}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    {booking.roomType}
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
  )
}
