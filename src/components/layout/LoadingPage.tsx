import { Spinner } from "@/components/ui/spinner";
import { FullPageState } from "./FullPageState";

export default function LoadingPage() {
	return (
		<FullPageState
			media={<Spinner className="size-7 text-secondary" />}
			title="Loading"
			description="Preparing your workspace. This will only take a moment."
		/>
	);
}
