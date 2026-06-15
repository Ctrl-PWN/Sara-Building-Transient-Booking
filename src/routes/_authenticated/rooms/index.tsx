import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const Route = createFileRoute("/_authenticated/rooms/")({
	component: RoomsListPage,
});

function RoomsListPage() {
	return (
		<main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
			<PageHeader
				title="Rooms"
				description="Room inventory, status, and operational details."
			/>

			<section className="block-card overflow-hidden">
				<table className="w-full font-body text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/30 text-left">
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Room
							</th>
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Type
							</th>
							<th className="px-4 py-3 font-medium text-muted-foreground">
								Status
							</th>
						</tr>
					</thead>
					<tbody>
						<tr className="border-b border-border">
							<td className="px-4 py-3">
								<Link
									to="/rooms/$roomId"
									params={{ roomId: "101" }}
									className="font-medium text-foreground underline-offset-4 hover:underline"
								>
									101
								</Link>
							</td>
							<td className="px-4 py-3 text-muted-foreground">Standard</td>
							<td className="px-4 py-3 text-muted-foreground">Available</td>
						</tr>
					</tbody>
				</table>
			</section>

			<PlaceholderPanel
				title="Room list"
				description="Live room data and admin CRUD will be wired in room feature tasks."
			/>
		</main>
	);
}
