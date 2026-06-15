import type { Icon } from "@phosphor-icons/react";
import {
	CalendarCheckIcon,
	CalendarIcon,
	CurrencyDollarIcon,
	DoorIcon,
	HouseIcon,
	UsersIcon,
} from "@phosphor-icons/react";

export type NavItem = {
	label: string;
	to: string;
	icon: Icon;
};

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: HouseIcon },
  { label: 'Timeline', to: '/timeline', icon: CalendarIcon },
  { label: 'Bookings', to: '/bookings', icon: CalendarCheckIcon },
  { label: 'Rooms', to: '/rooms', icon: DoorIcon },
  { label: 'Ledger', to: '/ledger', icon: CurrencyDollarIcon },
  { label: 'Users', to: '/user-management', icon: UsersIcon },
  { label: 'Room Management', to: '/room-management', icon: DoorIcon },
]

export function isNavItemActive(pathname: string, to: string): boolean {
	if (to === "/") {
		return pathname === "/";
	}
	return pathname === to || pathname.startsWith(`${to}/`);
}
