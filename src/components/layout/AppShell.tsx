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
				<SidebarInset className="min-w-0 overflow-x-hidden">
					<AppHeader />
					<div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
