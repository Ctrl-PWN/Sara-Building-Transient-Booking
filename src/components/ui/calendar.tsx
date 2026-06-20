import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarProps = {
	month: Date;
	onMonthChange: (date: Date) => void;
	selectedDate?: Date;
	onSelectDate?: (date: Date) => void;
	rangeStart?: Date | null;
	rangeEnd?: Date | null;
	onRangeChange?: (start: Date | null, end: Date | null) => void;
	minDate?: Date;
	maxDate?: Date;
	disabledDates?: (date: Date) => boolean;
	className?: string;
};

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
	if (!a || !b) return false;
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function isBetween(date: Date, start: Date, end: Date) {
	const t = startOfDay(date).getTime();
	const s = startOfDay(start).getTime();
	const e = startOfDay(end).getTime();
	return t > s && t < e;
}

export function Calendar({
	month,
	onMonthChange,
	selectedDate,
	onSelectDate,
	rangeStart,
	rangeEnd,
	onRangeChange,
	minDate,
	maxDate,
	disabledDates,
	className,
}: CalendarProps) {
	const [hoverDate, setHoverDate] = useState<Date | null>(null);

	const currentMonth = month.getMonth();
	const currentYear = month.getFullYear();

	const firstDay = new Date(currentYear, currentMonth, 1);
	const lastDay = new Date(currentYear, currentMonth + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay();

	const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const calendarDays: (number | null)[] = [];
	for (let i = 0; i < startingDayOfWeek; i++) {
		calendarDays.push(null);
	}
	for (let i = 1; i <= daysInMonth; i++) {
		calendarDays.push(i);
	}

	const goToPreviousMonth = () => {
		onMonthChange(new Date(currentYear, currentMonth - 1, 1));
	};

	const goToNextMonth = () => {
		onMonthChange(new Date(currentYear, currentMonth + 1, 1));
	};

	const buildDate = (day: number) => new Date(currentYear, currentMonth, day);

	const hasDisabledDateBetween = (start: Date, end: Date): boolean => {
		const e = startOfDay(end).getTime();
		const cursor = new Date(start);
		while (startOfDay(cursor).getTime() < e) {
			cursor.setDate(cursor.getDate() + 1);
			if (startOfDay(cursor).getTime() === e) break;
			if (disabledDates?.(new Date(cursor))) return true;
		}
		return false;
	};

	const handleDateClick = (day: number) => {
		const date = buildDate(day);
		if (onRangeChange) {
			if (!rangeStart || rangeEnd) {
				onRangeChange(date, null);
				return;
			}
			if (date.getTime() < startOfDay(rangeStart).getTime()) {
				onRangeChange(date, null);
				return;
			}
			if (hasDisabledDateBetween(rangeStart, date)) {
				return;
			}
			onRangeChange(rangeStart, date);
			return;
		}
		if (onSelectDate) {
			onSelectDate(date);
		}
	};

	const isDateDisabled = (day: number): boolean => {
		const date = buildDate(day);
		if (minDate && startOfDay(date).getTime() < startOfDay(minDate).getTime()) {
			return true;
		}
		if (maxDate && startOfDay(date).getTime() > startOfDay(maxDate).getTime()) {
			return true;
		}
		if (disabledDates) return disabledDates(date);
		return false;
	};

	const isNextMonthDisabled = (() => {
		if (!maxDate) return false;
		const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
		return startOfDay(nextMonthStart).getTime() > startOfDay(maxDate).getTime();
	})();

	const isDateSelected = (day: number): boolean => {
		if (onRangeChange) {
			const date = buildDate(day);
			if (isSameDay(date, rangeStart) || isSameDay(date, rangeEnd)) return true;
			if (rangeStart && rangeEnd && isBetween(date, rangeStart, rangeEnd)) {
				return true;
			}
			if (
				rangeStart &&
				!rangeEnd &&
				hoverDate &&
				date.getTime() !== startOfDay(rangeStart).getTime() &&
				isBetween(date, rangeStart, hoverDate)
			) {
				return true;
			}
			return false;
		}
		if (!selectedDate) return false;
		return isSameDay(buildDate(day), selectedDate);
	};

	const isRangeStart = (day: number) => isSameDay(buildDate(day), rangeStart);
	const isRangeEnd = (day: number) => isSameDay(buildDate(day), rangeEnd);
	const isRangeMiddle = (day: number) => {
		if (!rangeStart || !rangeEnd) {
			if (rangeStart && hoverDate && !rangeEnd) {
				const date = buildDate(day);
				return isBetween(date, rangeStart, hoverDate);
			}
			return false;
		}
		return isBetween(buildDate(day), rangeStart, rangeEnd);
	};

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	return (
		<div
			className={cn(
				"w-full rounded-lg border border-border bg-card p-4",
				className,
			)}
		>
			<div className="mb-4 flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					onClick={goToPreviousMonth}
					className="h-8 w-8 p-0"
				>
					<ArrowLeftIcon className="size-4" />
				</Button>
				<h2 className="text-sm font-semibold">
					{monthNames[currentMonth]} {currentYear}
				</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={goToNextMonth}
					disabled={isNextMonthDisabled}
					className="h-8 w-8 p-0"
				>
					<ArrowRightIcon className="size-4" />
				</Button>
			</div>

			<div className="mb-2 grid grid-cols-7 gap-1">
				{daysOfWeek.map((day) => (
					<div
						key={day}
						className="text-xs font-semibold text-muted-foreground text-center py-2"
					>
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-0">
				{calendarDays.map((day, index) => {
					const isStart = day !== null && isRangeStart(day);
					const isEnd = day !== null && isRangeEnd(day);
					const isMiddle =
						day !== null && isRangeMiddle(day) && !isStart && !isEnd;
					// Edge cells of a week (Sun/Sat) need a half-band on the inner side
					// so the highlight visually connects across the week gap.
					const colIndex = index % 7;
					const showRightBand = isMiddle || (isStart && colIndex !== 0);
					const showLeftBand = isMiddle || (isEnd && colIndex !== 6);
					return (
						<div
							key={`${index}-${day}`}
							className="aspect-square border-r border-b border-border/30 first:border-l"
						>
							{day === null ? (
								<div className="relative h-full w-full">
									{(showRightBand || showLeftBand) && (
										<>
											{showLeftBand ? (
												<span className="absolute inset-y-0 left-0 right-1/2 bg-secondary/30" />
											) : null}
											{showRightBand ? (
												<span className="absolute inset-y-0 right-0 left-1/2 bg-secondary/30" />
											) : null}
										</>
									)}
								</div>
							) : (
								<button
									type="button"
									onClick={() => handleDateClick(day)}
									onMouseEnter={() => setHoverDate(buildDate(day))}
									onMouseLeave={() => setHoverDate(null)}
									disabled={isDateDisabled(day)}
									aria-pressed={isDateSelected(day)}
									className={cn(
										"relative h-full w-full text-sm transition-colors duration-100 cursor-pointer",
										"hover:bg-accent/60",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:z-10",
										"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
										isStart &&
											"bg-primary text-primary-foreground hover:bg-primary/90",
										isEnd &&
											"bg-primary text-primary-foreground hover:bg-primary/90",
										isMiddle && "text-foreground",
										!isStart &&
											!isEnd &&
											!isMiddle &&
											isDateSelected(day) &&
											!onRangeChange &&
											"bg-primary text-primary-foreground hover:bg-primary/90",
										!isStart &&
											!isEnd &&
											!isMiddle &&
											(!isDateSelected(day) || !!onRangeChange) &&
											"bg-transparent text-foreground",
									)}
								>
									{showLeftBand && !isStart ? (
										<span className="pointer-events-none absolute inset-y-0 left-0 right-1/2 bg-secondary/30" />
									) : null}
									{showRightBand && !isEnd ? (
										<span className="pointer-events-none absolute inset-y-0 right-0 left-1/2 bg-secondary/30" />
									) : null}
									<span className="relative z-10 flex h-full w-full items-center justify-center">
										{day}
									</span>
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
