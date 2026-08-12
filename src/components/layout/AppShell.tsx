import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route } from "@/routes/_authenticated";

export function AppShell() {
	const { session } = Route.useLoaderData();
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar session={session} />
				<SidebarInset className="min-w-0 max-h-svh overflow-y-auto">
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					>
						Skip to main content
					</a>
					<AppHeader />
					<div
						id="main-content"
						tabIndex={-1}
						className="flex min-w-0 flex-1 flex-col outline-none"
					>
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
