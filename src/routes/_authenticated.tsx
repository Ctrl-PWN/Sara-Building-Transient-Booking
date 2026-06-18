import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/session/session.functions";

export const Route = createFileRoute("/_authenticated")({
	loader: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/log-in" });
		}
		return { session };
	},
	component: AppShell,
});
