import { PlusIcon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

type BookingsPageHeaderProps = {
	onNewReservation: () => void;
	onWalkIn: () => void;
};

export function BookingsPageHeader({
	onNewReservation,
	onWalkIn,
}: BookingsPageHeaderProps) {
	return (
		<PageHeader
			title="Bookings"
			description="Manage reservations, guest details, and check-ins."
			actions={
				<>
					<Button className="gap-2 font-medium" onClick={onNewReservation}>
						<PlusIcon data-icon="inline-start" />
						New Reservation
					</Button>
					<Button
						variant="outline"
						className="gap-2 font-medium"
						onClick={onWalkIn}
					>
						<PlusIcon data-icon="inline-start" />
						Walk-in
					</Button>
				</>
			}
		/>
	);
}
