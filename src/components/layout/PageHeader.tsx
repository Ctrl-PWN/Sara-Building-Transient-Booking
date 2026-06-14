import type { ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	description?: string;
	actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
					{title}
				</h1>
				{description ? (
					<p className="font-body text-sm text-muted-foreground max-w-2xl">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex min-w-0 w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
					{actions}
				</div>
			) : null}
		</div>
	);
}
