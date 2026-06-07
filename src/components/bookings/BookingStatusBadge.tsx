import { Badge } from '@/components/ui/badge'
import type { BookingStatusPresentation } from '@/lib/bookings/status'
import { getBookingStatusPresentation } from '@/lib/bookings/status'
import { cn } from '@/lib/utils'

type BookingStatusBadgeProps = {
  status: string
  className?: string
  presentation?: BookingStatusPresentation
}

export function BookingStatusBadge({
  status,
  className,
  presentation,
}: BookingStatusBadgeProps) {
  const resolved = presentation ?? getBookingStatusPresentation(status)

  return (
    <Badge variant="outline" className={cn('gap-1.5 uppercase', className)}>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: `var(${resolved.colorVar})` }}
      />
      {resolved.legendLabel}
    </Badge>
  )
}

export function BookingStatusDot({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const resolved = getBookingStatusPresentation(status)

  return (
    <span
      aria-hidden
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: `var(${resolved.colorVar})` }}
    />
  )
}
