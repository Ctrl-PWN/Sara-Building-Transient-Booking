import { cn } from '@/lib/utils'
import type { BookingWithRoom } from '@/lib/bookings/types'
import type { TimelineRoom } from '@/lib/timeline/types'
import { formatDayHeader, isToday } from '@/lib/timeline/week'

import { TimelineRoomRow } from '@/components/timeline/TimelineRoomRow'

type TimelineGridProps = {
  days: string[]
  rooms: TimelineRoom[]
  bookings: BookingWithRoom[]
  weekStart: string
  weekEnd: string
  selectedBookingId: number | null
  onSelectBooking: (bookingId: number) => void
}

const gridCols = 'grid grid-cols-[11rem_repeat(7,minmax(5rem,1fr))]'

export function TimelineGrid({
  days,
  rooms,
  bookings,
  weekStart,
  weekEnd,
  selectedBookingId,
  onSelectBooking,
}: TimelineGridProps) {
  const bookingsByRoom = new Map<number, BookingWithRoom[]>()

  for (const booking of bookings) {
    const roomBookings = bookingsByRoom.get(booking.roomId) ?? []
    roomBookings.push(booking)
    bookingsByRoom.set(booking.roomId, roomBookings)
  }

  return (
    <div className="block-card min-w-0 overflow-hidden">
      <div className="h-[min(70vh,48rem)] w-full overflow-auto bg-surface">
        <div className="min-w-5xl">
          <div
            className={`${gridCols} items-stretch border-b border-border bg-surface-dim`}
          >
            <div className="sticky left-0 z-2 flex items-center self-stretch border-r border-border bg-surface-dim px-4 py-3 font-body text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted-foreground shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)]">
              Rooms
            </div>
            {days.map((day) => {
              const header = formatDayHeader(day)
              const today = isToday(day)
              return (
                <div
                  key={day}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 text-center',
                    today && 'bg-surface-container-high',
                  )}
                >
                  <p
                    className={cn(
                      'font-body text-[0.7rem] uppercase m-0',
                      today
                        ? 'font-semibold text-secondary'
                        : 'text-muted-foreground',
                    )}
                  >
                    {header.weekday}
                  </p>
                  <p className="font-body text-sm font-semibold text-foreground m-0">
                    {header.day}
                  </p>
                </div>
              )
            })}
          </div>

          {rooms.map((room) => (
            <TimelineRoomRow
              key={room.id}
              roomId={room.id}
              roomNumber={room.roomNumber}
              roomType={room.type}
              days={days}
              bookings={bookingsByRoom.get(room.id) ?? []}
              weekStart={weekStart}
              weekEnd={weekEnd}
              selectedBookingId={selectedBookingId}
              onSelectBooking={onSelectBooking}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
