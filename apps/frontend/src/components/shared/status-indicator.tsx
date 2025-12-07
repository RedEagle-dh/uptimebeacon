"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	type LucideIcon,
	Wrench,
	XCircle,
} from "lucide-react";
import type * as React from "react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Status types
export type Status = "UP" | "DOWN" | "DEGRADED" | "PENDING" | "MAINTENANCE";

// Status configuration - semantic colors only
export const STATUS_CONFIG: Record<
	Status,
	{
		label: string;
		icon: LucideIcon;
		dotClass: string;
		badgeClass: string;
		textClass: string;
		barClass: string;
	}
> = {
	UP: {
		label: "Operational",
		icon: CheckCircle,
		dotClass: "bg-green-500",
		badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-800",
		textClass: "text-green-500",
		barClass: "bg-green-500 hover:shadow-lg hover:shadow-green-500/50",
	},
	DOWN: {
		label: "Down",
		icon: XCircle,
		dotClass: "bg-red-500",
		badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-800",
		textClass: "text-red-500",
		barClass: "bg-red-500 hover:shadow-lg hover:shadow-red-500/50",
	},
	DEGRADED: {
		label: "Degraded",
		icon: AlertTriangle,
		dotClass: "bg-yellow-500",
		badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-800",
		textClass: "text-yellow-500",
		barClass: "bg-yellow-500 hover:shadow-lg hover:shadow-yellow-500/50",
	},
	PENDING: {
		label: "Pending",
		icon: Clock,
		dotClass: "bg-neutral-500",
		badgeClass: "bg-neutral-900 text-neutral-400 border-neutral-800",
		textClass: "text-neutral-500",
		barClass: "bg-neutral-500 hover:shadow-lg hover:shadow-neutral-500/50",
	},
	MAINTENANCE: {
		label: "Maintenance",
		icon: Wrench,
		dotClass: "bg-blue-500",
		badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-800",
		textClass: "text-blue-500",
		barClass: "bg-blue-500 hover:shadow-lg hover:shadow-blue-500/50",
	},
};

// StatusDot component - animated pulsing dot
interface StatusDotProps {
	status: Status;
	className?: string;
	animate?: boolean;
}

export function StatusDot({
	status,
	className,
	animate = true,
}: StatusDotProps) {
	const config = STATUS_CONFIG[status];

	return (
		<span
			aria-label={config.label}
			className={cn(
				"relative inline-flex size-2.5 rounded-full",
				config.dotClass,
				animate &&
					"after:absolute after:inset-0 after:animate-ping after:rounded-full",
				animate && status === "UP" && "after:bg-green-500/40",
				animate && status === "DOWN" && "after:bg-red-500/40",
				animate && status === "DEGRADED" && "after:bg-yellow-500/40",
				animate && status === "MAINTENANCE" && "after:bg-blue-500/40",
				className,
			)}
			role="img"
		/>
	);
}

// StatusBadge variants
const statusBadgeVariants = cva(
	"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-xs transition-colors duration-200",
	{
		variants: {
			size: {
				sm: "px-2 py-0.5 text-[10px]",
				default: "px-2.5 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

// StatusBadge component - pill-shaped badge with icon
interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
	status: Status;
	showIcon?: boolean;
	showDot?: boolean;
	className?: string;
}

export function StatusBadge({
	status,
	showIcon = false,
	showDot = true,
	size,
	className,
}: StatusBadgeProps) {
	const config = STATUS_CONFIG[status];
	const Icon = config.icon;

	return (
		<span
			className={cn(
				statusBadgeVariants({ size }),
				config.badgeClass,
				className,
			)}
		>
			{showDot && (
				<StatusDot animate={false} className="size-2" status={status} />
			)}
			{showIcon && <Icon className="size-3" />}
			{config.label}
		</span>
	);
}

// StatusText component - just colored text
interface StatusTextProps {
	status: Status;
	children?: React.ReactNode;
	className?: string;
}

export function StatusText({ status, children, className }: StatusTextProps) {
	const config = STATUS_CONFIG[status];

	return (
		<span className={cn(config.textClass, "font-medium", className)}>
			{children ?? config.label}
		</span>
	);
}

// UptimeBar component - visual uptime representation
export interface UptimeBarDayData {
	status: Status;
	date?: Date | string;
	incidents?: number;
	downtimeMinutes?: number;
}

interface UptimeBarProps {
	days?: number;
	mobileDays?: number;
	data?: Array<UptimeBarDayData>;
	className?: string;
}

function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getTooltipContent(day: UptimeBarDayData, daysAgo: number): string {
	const config = STATUS_CONFIG[day.status];
	const dateStr = day.date ? formatDate(day.date) : `${daysAgo} days ago`;

	if (day.status === "PENDING") {
		return `${dateStr}\nNo data`;
	}

	if (day.status === "UP") {
		return `${dateStr}\nNo incidents`;
	}

	const parts = [dateStr, config.label];

	if (day.incidents !== undefined && day.incidents > 0) {
		parts.push(`${day.incidents} incident${day.incidents > 1 ? "s" : ""}`);
	}

	if (day.downtimeMinutes !== undefined && day.downtimeMinutes > 0) {
		const hours = Math.floor(day.downtimeMinutes / 60);
		const mins = day.downtimeMinutes % 60;
		if (hours > 0) {
			parts.push(`${hours}h ${mins}m downtime`);
		} else {
			parts.push(`${mins}m downtime`);
		}
	}

	return parts.join("\n");
}

export function UptimeBar({
	days = 30,
	mobileDays = 14,
	data,
	className,
}: UptimeBarProps) {
	// Build a map of provided data by date string
	const dataByDate = new Map<string, UptimeBarDayData>();
	if (data) {
		for (const day of data) {
			if (day.date) {
				const dateStr =
					typeof day.date === "string"
						? day.date.split("T")[0]
						: day.date.toISOString().split("T")[0];
				if (dateStr) {
					dataByDate.set(dateStr, day);
				}
			}
		}
	}

	// Generate all days, using provided data or PENDING status
	const uptimeData = Array.from({ length: days }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - (days - 1 - i));
		const dateStr = date.toISOString().split("T")[0]!;

		const existingData = dataByDate.get(dateStr);
		if (existingData) {
			return existingData;
		}

		return {
			status: "PENDING" as Status,
			date,
			incidents: 0,
			downtimeMinutes: 0,
		};
	});

	// Calculate how many bars to hide on mobile (show only the most recent mobileDays)
	const hiddenOnMobile = days - mobileDays;

	return (
		<div
			className={cn("flex flex-1 items-center gap-1.5 sm:gap-[3px]", className)}
		>
			{uptimeData.map((day, index) => {
				const config = STATUS_CONFIG[day.status];
				const daysAgo = days - index;
				const hideOnMobile = index < hiddenOnMobile;

				return (
					<Popover key={`uptime-${index}`}>
						<PopoverTrigger asChild>
							<button
								className={cn(
									"h-8 w-2 cursor-pointer rounded-sm transition-shadow duration-200 sm:h-8 sm:w-1",
									config.barClass,
									hideOnMobile && "hidden sm:block",
								)}
								type="button"
							/>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto whitespace-pre-line rounded-md border-neutral-800 bg-neutral-900 px-3 py-1.5 text-center text-neutral-100 text-xs"
							sideOffset={4}
						>
							{getTooltipContent(day, daysAgo)}
						</PopoverContent>
					</Popover>
				);
			})}
		</div>
	);
}

// OverallStatus component - large status indicator for status pages
interface OverallStatusProps {
	status: Status;
	className?: string;
}

export function OverallStatus({ status, className }: OverallStatusProps) {
	const config = STATUS_CONFIG[status];
	const Icon = config.icon;

	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3",
				className,
			)}
		>
			<Icon className={cn("size-5", config.textClass)} />
			<span className="font-semibold text-neutral-100">{config.label}</span>
			<StatusDot animate className="ml-auto" status={status} />
		</div>
	);
}
