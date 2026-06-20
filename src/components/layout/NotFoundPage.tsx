import { ArrowLeftIcon, HouseIcon } from "@phosphor-icons/react";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FullPageState } from "./FullPageState";

export function NotFoundPage() {
	const router = useRouter();

	return (
		<FullPageState
			media={
				<span className="font-display text-7xl font-semibold leading-none tracking-tight text-secondary sm:text-8xl">
					404
				</span>
			}
			title="Page not found"
			description="The page you're looking for doesn't exist or may have been moved."
			actions={
				<>
					<Button variant="outline" onClick={() => router.history.back()}>
						<ArrowLeftIcon data-icon="inline-start" />
						Go back
					</Button>
					<Button render={<Link to="/dashboard" />}>
						<HouseIcon data-icon="inline-start" />
						Go to dashboard
					</Button>
				</>
			}
		/>
	);
}
