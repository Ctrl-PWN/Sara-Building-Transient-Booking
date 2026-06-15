import { SignOutIcon } from "@phosphor-icons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { isNavItemActive, mainNavItems } from "@/lib/nav";

export function AppSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const isAdmin = session?.user.role === "admin";
	const adminOnlyPaths = ["/user-management", "/room-management"];
	const visibleNavItems = isAdmin
		? mainNavItems
		: mainNavItems.filter((item) => !adminOnlyPaths.includes(item.to));

	async function handleLogout() {
		await authClient.signOut();
		await navigate({ to: "/log-in", replace: true });
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex flex-col gap-0.5 px-2 py-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
					<span className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:sr-only">
						Sara Building
					</span>
					<span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:sr-only">
						Block Center
					</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Operations</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{visibleNavItems.map((item) => {
								const Icon = item.icon;
								const active = isNavItemActive(pathname, item.to);

								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											render={<Link to={item.to} />}
											isActive={active}
											tooltip={item.label}
										>
											<Icon />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border">
				<Button
					type="button"
					variant="ghost"
					className="w-full justify-start"
					onClick={() => {
						void handleLogout();
					}}
				>
					<SignOutIcon data-icon="inline-start" />
					<span>Log out</span>
				</Button>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
