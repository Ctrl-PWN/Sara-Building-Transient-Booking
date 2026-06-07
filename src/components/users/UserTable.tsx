import { PencilIcon, TrashIcon, UserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

type UserRow = {
	id: string;
	name: string;
	firstName?: string;
	lastName?: string;
	email: string;
	role?: string;
};

type UserTableProps = {
	users: UserRow[];
	onEdit: (user: UserRow) => void;
	onDelete: (user: UserRow) => void;
};

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
	if (users.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<UserIcon />
					</EmptyMedia>
					<EmptyTitle>No users found</EmptyTitle>
					<EmptyDescription>
						No staff accounts match your current filters.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent />
			</Empty>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full font-body text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/30 text-left">
						<th className="px-4 py-3 font-medium text-muted-foreground">
							First name
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Last name
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Email
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							<span className="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr
							key={user.id}
							className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
						>
							<td className="px-4 py-3 text-muted-foreground">
								{user.firstName ?? ""}
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								{user.lastName ?? ""}
							</td>
							<td className="px-4 py-3 text-muted-foreground">{user.email}</td>

							<td className="px-4 py-3">
								<div className="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => onEdit(user)}
										aria-label={`Edit ${user.firstName} ${user.lastName}`}
									>
										<PencilIcon />
									</Button>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => onDelete(user)}
										aria-label={`Delete ${user.firstName} ${user.lastName}`}
									>
										<TrashIcon />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
