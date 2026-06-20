import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FullPageStateProps = {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	media?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	className?: string;
};

export function FullPageState({
	eyebrow,
	title,
	description,
	media,
	actions,
	children,
	className,
}: FullPageStateProps) {
	return (
		<main
			className={cn(
				"relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden bg-surface px-6 py-16 text-center",
				className,
			)}
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--secondary)_8%,transparent),transparent_60%)]"
			/>

			<div className="relative flex w-full max-w-md flex-col items-center gap-6">
				<img
					src="/logo.png"
					alt="Sara Building"
					className="h-14 w-auto max-w-full object-contain opacity-90"
				/>

				{media}

				<div className="flex flex-col items-center gap-3">
					{eyebrow ? (
						<span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
							{eyebrow}
						</span>
					) : null}
					<h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						{title}
					</h1>
					{description ? (
						<p className="max-w-sm font-body text-sm/relaxed text-muted-foreground text-balance">
							{description}
						</p>
					) : null}
				</div>

				{children}

				{actions ? (
					<div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
						{actions}
					</div>
				) : null}
			</div>
		</main>
	);
}
