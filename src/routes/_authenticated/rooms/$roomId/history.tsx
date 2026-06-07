import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/history")({
	component: RoomHistoryPage,
});

function RoomHistoryPage() {
	const { roomId } = Route.useParams();

	return (
		<main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
			<PageHeader
				title={`Room ${roomId} history`}
				description="Booking and status history for this room."
				actions={
					<Link
						to="/rooms/$roomId"
						params={{ roomId }}
						className="btn-secondary no-underline text-sm"
					>
						Back to room
					</Link>
				}
			/>

			<section className="block-card overflow-hidden">
				<table className="w-full font-body text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/30 text-left">
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Date
							</th>
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Event
							</th>
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Details
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className="px-4 py-3 text-muted-foreground" colSpan={3}>
								No history records yet.
							</td>
						</tr>
					</tbody>
				</table>
			</section>

			<PlaceholderPanel
				title="Room history"
				description="Historical bookings and status changes will be added in CTR-29."
			/>
		</main>
	);
}
