import { queryOptions } from "@tanstack/react-query";

import { getDashboardMetrics } from "./dashboard.functions";

export const dashboardKeys = {
	all: ["dashboard"] as const,
	metrics: (date: string) => [...dashboardKeys.all, "metrics", date] as const,
};

export const dashboardQueries = {
	metrics: (date: string) =>
		queryOptions({
			queryKey: dashboardKeys.metrics(date),
			queryFn: () => getDashboardMetrics({ data: { date } }),
		}),
};
