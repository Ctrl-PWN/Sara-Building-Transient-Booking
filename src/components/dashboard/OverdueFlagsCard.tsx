import { WarningIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { formatGuestName } from "@/lib/bookings/types";
import type { OverdueFlagRow } from "@/lib/dashboard/dashboard.types";

type OverdueFlagsCardProps = {
	flags: OverdueFlagRow[];
};

export function OverdueFlagsCard({ flags }: OverdueFlagsCardProps) {
	return (
		<article className="block-card flex h-full flex-col">
			<header className="border-b border-outline px-6 py-5">
				<p className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
					Critical flags
				</p>
			</header>
			<div className="flex-1 p-2">
				{flags.length === 0 ? (
					<p className="py-10 text-center font-body text-sm text-on-surface-variant">
						No overdue stays.
					</p>
				) : (
					<ul className="flex flex-col">
						{flags.map((flag) => (
							<Link
								key={flag.id}
								to="/bookings/$bookingId"
								params={{ bookingId: String(flag.id) }}
								className="group flex items-start gap-3 rounded-lg px-4 py-4 transition-colors hover:bg-surface-container-high"
							>
								<WarningIcon className="mt-0.5 size-5 shrink-0 text-status-overdue" />
								<div className="flex-1">
									<p className="font-body text-xs font-bold uppercase tracking-wider text-status-overdue">
										Overdue stay
									</p>
									<p className="mt-1 font-body text-sm font-semibold text-on-surface">
										{formatGuestName(flag)} — {flag.roomNumber}
									</p>
									<p className="mt-0.5 font-body text-xs text-on-surface-variant">
										{flag.daysOverdue} day
										{flag.daysOverdue === 1 ? "" : "s"} overdue
									</p>
								</div>
							</Link>
						))}
					</ul>
				)}
			</div>
		</article>
	);
}
