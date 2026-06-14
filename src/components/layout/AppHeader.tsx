import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
			<SidebarTrigger />
			<Separator orientation="vertical" className="mr-1 h-4" />
			<div className="flex flex-1 items-center justify-end">
				<ThemeToggle />
			</div>
		</header>
	);
}
