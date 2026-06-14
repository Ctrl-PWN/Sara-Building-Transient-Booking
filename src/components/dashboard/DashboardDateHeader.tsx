import { formatManilaDisplayDate, nowInManila } from "@/lib/date/manila";

type DashboardDateHeaderProps = {
  date?: Date | string | number;
};

export function DashboardDateHeader({
  date = nowInManila(),
}: DashboardDateHeaderProps) {
  return (
    <p className="font-body text-sm font-medium text-on-surface-variant">
      {formatManilaDisplayDate(date)}
    </p>
  );
}
