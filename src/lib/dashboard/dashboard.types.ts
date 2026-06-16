export type DashboardBookingRow = {
	id: number;
	bookingRef: string;
	firstName: string;
	lastName: string;
	roomId: number;
	roomNumber: string;
	roomType: string;
	checkInDate: string;
	checkOutDate: string;
	occupantsCount: number;
};

export type OverdueFlagRow = DashboardBookingRow & {
	daysOverdue: number;
};

export type OccupancySummary = {
	totalRooms: number;
	occupiedRooms: number;
	rate: number;
};

export type TodaySummary = {
	checkIns: DashboardBookingRow[];
	checkOuts: DashboardBookingRow[];
	checkInsCount: number;
	checkOutsCount: number;
};

export type DashboardMetrics = {
	date: string;
	occupancy: OccupancySummary;
	today: TodaySummary;
	activeBookingsCount: number;
	pendingDepositsCount: number;
	overdueFlags: OverdueFlagRow[];
};
