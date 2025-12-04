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
interface UptimeBarProps {
	days?: number;
	data?: Array<{ status: Status }>;
	className?: string;
}

// Deterministic pseudo-random based on index (avoids hydration mismatch)
function getSeededStatus(index: number): Status {
	// Simple hash function for deterministic "randomness"
	const hash = ((index * 2654435761) >>> 0) % 100;
	if (hash < 5) return "DOWN";
	if (hash < 10) return "DEGRADED";
	return "UP";
}

export function UptimeBar({ days = 30, data, className }: UptimeBarProps) {
	// Generate deterministic mock data if not provided
	const uptimeData =
		data ??
		Array.from({ length: days }, (_, i) => ({
			status: getSeededStatus(i),
		}));

	return (
		<div className={cn("flex items-end gap-[3px]", className)}>
			{uptimeData.map((day, index) => {
				const config = STATUS_CONFIG[day.status];
				return (
					<div
						className={cn(
							"h-8 w-1 rounded-sm transition-all duration-200 ease-out hover:h-10 hover:w-1.5",
							config.barClass,
						)}
						key={`uptime-${index}`}
						title={`Day ${days - index}: ${config.label}`}
					/>
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
