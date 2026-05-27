import { useNavigate } from '@tanstack/react-router'
import {
  CaretLeftIcon,
  CaretRightIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  resolveWeekStart,
  shiftWeek,
} from '@/lib/timeline/week'

type TimelineWeekNavProps = {
  weekStart: string
}

export function TimelineWeekNav({ weekStart }: TimelineWeekNavProps) {
  const navigate = useNavigate()

  function goToWeek(nextWeekStart: string) {
    navigate({
      to: '/timeline',
      search: { week: nextWeekStart },
    })
  }

  return (
    <div className="flex items-center justify-end">
      <ButtonGroup aria-label="Week navigation" className="bg-transparent">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToWeek(shiftWeek(weekStart, -1))}
        >
          <CaretLeftIcon />
          <span className="sr-only">Previous week</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => goToWeek(resolveWeekStart())}
        >
          <CalendarBlankIcon data-icon="inline-start" />
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToWeek(shiftWeek(weekStart, 1))}
        >
          <CaretRightIcon />
          <span className="sr-only">Next week</span>
        </Button>
      </ButtonGroup>
    </div>
  )
}
