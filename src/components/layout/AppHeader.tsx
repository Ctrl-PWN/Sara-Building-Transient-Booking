import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
	return (
		<header className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
			<SidebarTrigger />
			<Separator orientation="vertical" className="mr-1 h-4" />
			<div className="flex flex-1 items-center justify-end">
				<ThemeToggle />
			</div>
		</header>
	);
}
