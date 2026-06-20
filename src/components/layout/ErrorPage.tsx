import { ArrowClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FullPageState } from "./FullPageState";

type ErrorPageProps = {
	error?: unknown;
	reset?: () => void;
};

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error.trim()) return error;
	return "An unexpected error occurred. Please try again.";
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
	const router = useRouter();

	const handleRetry = () => {
		reset?.();
		void router.invalidate();
	};

	return (
		<FullPageState
			eyebrow="Something went wrong"
			title="We hit a snag"
			description="The page couldn't be loaded. You can try again or head back to your dashboard."
			actions={
				<>
					<Button onClick={handleRetry}>
						<ArrowClockwiseIcon data-icon="inline-start" />
						Try again
					</Button>
					<Button variant="outline" render={<Link to="/" />}>
						<HouseIcon data-icon="inline-start" />
						Go to dashboard
					</Button>
				</>
			}
		>
			<div className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-left">
				<p className="font-mono text-xs/relaxed break-words text-muted-foreground">
					{getErrorMessage(error)}
				</p>
			</div>
		</FullPageState>
	);
}
