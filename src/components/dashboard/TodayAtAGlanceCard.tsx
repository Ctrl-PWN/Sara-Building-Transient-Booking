import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartLineUpIcon,
  ClockIcon,
} from "@phosphor-icons/react";

type TodayStat = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

type TodayAtAGlanceCardProps = {
  checkInsCount: number;
  checkOutsCount: number;
  pendingDepositsCount: number;
  activeBookingsCount: number;
};

export function TodayAtAGlanceCard({
  checkInsCount,
  checkOutsCount,
  pendingDepositsCount,
  activeBookingsCount,
}: TodayAtAGlanceCardProps) {
  const stats: TodayStat[] = [
    {
      label: "Check-ins today",
      value: checkInsCount,
      icon: <ArrowRightIcon className="size-5" />,
    },
    {
      label: "Check-outs today",
      value: checkOutsCount,
      icon: <ArrowLeftIcon className="size-5" />,
    },
    {
      label: "Pending deposits",
      value: pendingDepositsCount,
      icon: <ClockIcon className="size-5" />,
    },
    {
      label: "Active bookings",
      value: activeBookingsCount,
      icon: <ChartLineUpIcon className="size-5" />,
    },
  ];

  return (
    <article className="block-card flex h-full flex-col p-6 sm:p-8">
      <p className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        Today at a glance
      </p>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3">
            <span className="text-on-surface-variant">{stat.icon}</span>
            <div>
              <p className="font-display text-4xl font-medium tracking-tight text-on-surface">
                {stat.value}
              </p>
              <p className="mt-1 font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
