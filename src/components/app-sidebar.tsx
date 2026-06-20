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
import type { getSession } from "@/lib/session/session.functions";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type AppSidebarProps = {
	session: Session;
};

export function AppSidebar({ session }: AppSidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const isAdmin = session.user.role === "admin";
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
			<SidebarHeader className="h-14 border-b border-sidebar-border px-4">
				<div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
						{session.user.firstName?.[0] ?? "U"}
						{session.user.lastName?.[0] ?? ""}
					</div>
					<div className="flex min-w-0 flex-col group-data-[collapsible=icon]:sr-only">
						<span className="truncate font-body text-sm font-medium text-sidebar-foreground">
							{session.user.firstName} {session.user.lastName}
						</span>
						<span className="truncate font-body text-xs capitalize text-muted-foreground">
							{session.user.role}
						</span>
					</div>
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
					className="w-full justify-start group-data-[collapsible=icon]:justify-center"
					onClick={() => {
						void handleLogout();
					}}
				>
					<SignOutIcon />
					<span className="group-data-[collapsible=icon]:sr-only">Log out</span>
				</Button>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
