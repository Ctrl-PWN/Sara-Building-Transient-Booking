import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ErrorPage } from "./components/layout/ErrorPage";
import LoadingPage from "./components/layout/LoadingPage";
import { NotFoundPage } from "./components/layout/NotFoundPage";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultPendingComponent: LoadingPage,
		defaultErrorComponent: ({ error, reset }) => (
			<ErrorPage error={error} reset={reset} />
		),
		defaultNotFoundComponent: () => <NotFoundPage />,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
