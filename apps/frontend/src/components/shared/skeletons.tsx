"use client";

import { cn } from "@/lib/utils";

// Base skeleton component
function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("shimmer rounded-md bg-muted/50", className)}
			{...props}
		/>
	);
}

// Stat card skeleton
function StatCardSkeleton() {
	return (
		<div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-card py-6">
			<div className="flex items-center justify-between px-6">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="size-9 rounded-lg" />
			</div>
			<div className="px-6">
				<Skeleton className="mb-2 h-8 w-20" />
				<Skeleton className="h-3 w-16" />
			</div>
		</div>
	);
}

// Monitor row skeleton
function MonitorRowSkeleton() {
	return (
		<div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 p-4">
			<Skeleton className="size-2.5 shrink-0 rounded-full" />
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-48" />
			</div>
			<div className="hidden lg:block">
				<Skeleton className="h-6 w-48" />
			</div>
			<div className="hidden md:block">
				<Skeleton className="mb-1 h-4 w-16" />
				<Skeleton className="h-3 w-20" />
			</div>
			<Skeleton className="hidden h-4 w-12 sm:block" />
			<Skeleton className="size-4" />
		</div>
	);
}

// Monitor list skeleton
function MonitorListSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<MonitorRowSkeleton key={`monitor-skeleton-${i}`} />
			))}
		</div>
	);
}

// Dashboard stats skeleton
function DashboardStatsSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<StatCardSkeleton key={`stat-skeleton-${i}`} />
			))}
		</div>
	);
}

// Uptime bar skeleton
function UptimeBarSkeleton() {
	return (
		<div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-card py-6">
			<div className="flex items-center justify-between px-6">
				<div>
					<Skeleton className="mb-2 h-5 w-32" />
					<Skeleton className="h-3 w-40" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-16" />
					<Skeleton className="h-4 w-12" />
				</div>
			</div>
			<div className="px-6">
				<Skeleton className="h-6 w-full" />
				<div className="mt-3 flex justify-between">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-3 w-10" />
				</div>
			</div>
		</div>
	);
}

// Incident card skeleton
function IncidentSkeleton() {
	return (
		<div className="flex items-start gap-4 rounded-lg border border-border/40 bg-card/50 p-4">
			<Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
				<Skeleton className="mt-2 h-3 w-48" />
			</div>
		</div>
	);
}

// Incident list skeleton
function IncidentListSkeleton({ count = 2 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<IncidentSkeleton key={`incident-skeleton-${i}`} />
			))}
		</div>
	);
}

// Card skeleton
function CardSkeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 rounded-xl border border-border/50 bg-card py-6",
				className,
			)}
			{...props}
		>
			<div className="flex items-center justify-between px-6">
				<div>
					<Skeleton className="mb-2 h-5 w-24" />
					<Skeleton className="h-3 w-40" />
				</div>
				<Skeleton className="h-8 w-16" />
			</div>
			<div className="px-6">
				<Skeleton className="h-32 w-full" />
			</div>
		</div>
	);
}

// Page header skeleton
function PageHeaderSkeleton() {
	return (
		<div className="flex items-end justify-between">
			<div>
				<Skeleton className="mb-2 h-7 w-32" />
				<Skeleton className="h-4 w-56" />
			</div>
			<Skeleton className="h-9 w-28" />
		</div>
	);
}

// Table skeleton
function TableSkeleton({
	rows = 5,
	cols = 4,
}: {
	rows?: number;
	cols?: number;
}) {
	return (
		<div className="w-full">
			<div className="flex gap-4 border-border/50 border-b pb-3">
				{Array.from({ length: cols }).map((_, i) => (
					<Skeleton
						className={cn("h-3", i === 0 ? "w-1/3" : "flex-1")}
						key={`th-${i}`}
					/>
				))}
			</div>
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div
					className="flex gap-4 border-border/30 border-b py-4"
					key={`row-${rowIndex}`}
				>
					{Array.from({ length: cols }).map((_, colIndex) => (
						<Skeleton
							className={cn("h-4", colIndex === 0 ? "w-1/3" : "flex-1")}
							key={`cell-${rowIndex}-${colIndex}`}
						/>
					))}
				</div>
			))}
		</div>
	);
}

// Full page skeleton for dashboard
function DashboardPageSkeleton() {
	return (
		<div className="space-y-8">
			<PageHeaderSkeleton />
			<DashboardStatsSkeleton />
			<UptimeBarSkeleton />
			<div className="grid gap-6 lg:grid-cols-2">
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
}

// Full page skeleton for monitors
function MonitorsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageHeaderSkeleton />
			<div className="flex flex-wrap items-center gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton className="h-7 w-20 rounded-full" key={`badge-${i}`} />
				))}
			</div>
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-24" />
			</div>
			<MonitorListSkeleton count={5} />
		</div>
	);
}

// Status page card skeleton
function StatusPageCardSkeleton() {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Skeleton className="size-4" />
					<Skeleton className="h-4 w-28" />
				</div>
				<Skeleton className="size-2.5 rounded-full" />
			</div>
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-14 rounded-full" />
					<Skeleton className="h-4 w-20" />
				</div>
				<Skeleton className="h-4 w-24" />
				<div className="flex gap-2 pt-2">
					<Skeleton className="h-8 flex-1" />
					<Skeleton className="size-8" />
				</div>
			</div>
		</div>
	);
}

// Status pages page skeleton
function StatusPagesPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageHeaderSkeleton />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<StatusPageCardSkeleton key={`status-page-skeleton-${i}`} />
				))}
			</div>
		</div>
	);
}

// Notification channel card skeleton
function NotificationCardSkeleton() {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="size-10 rounded-lg" />
					<Skeleton className="h-4 w-28" />
				</div>
				<Skeleton className="h-5 w-9 rounded-full" />
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-4 w-20" />
				</div>
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	);
}

// Notifications page skeleton
function NotificationsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageHeaderSkeleton />
			<div className="grid gap-4 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<NotificationCardSkeleton key={`notification-skeleton-${i}`} />
				))}
			</div>
			<CardSkeleton />
		</div>
	);
}

// Incidents page skeleton
function IncidentsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageHeaderSkeleton />
			<div className="flex gap-2">
				<Skeleton className="h-9 w-24 rounded-md" />
				<Skeleton className="h-9 w-24 rounded-md" />
			</div>
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<IncidentSkeleton key={`incident-page-skeleton-${i}`} />
				))}
			</div>
		</div>
	);
}

// Branding page skeleton
function BrandingPageSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="mb-2 h-7 w-64" />
				<Skeleton className="h-4 w-72" />
			</div>
			{Array.from({ length: 4 }).map((_, i) => (
				<CardSkeleton key={`branding-card-${i}`} />
			))}
		</div>
	);
}

// Monitor detail page skeleton
function MonitorDetailSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Skeleton className="size-9 rounded-lg" />
				<div className="flex-1">
					<Skeleton className="mb-2 h-7 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-9 w-24" />
			</div>
			{/* Stats grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<StatCardSkeleton key={`detail-stat-${i}`} />
				))}
			</div>
			{/* Tabs */}
			<Skeleton className="h-9 w-80 rounded-lg" />
			{/* Content */}
			<div className="grid gap-6 lg:grid-cols-2">
				<CardSkeleton />
				<CardSkeleton />
			</div>
			<CardSkeleton />
		</div>
	);
}

// Public status page skeleton
function PublicStatusPageSkeleton() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-12">
			{/* Hero */}
			<div className="mb-10 flex flex-col items-center text-center">
				<Skeleton className="mb-6 size-20 rounded-2xl" />
				<Skeleton className="mb-2 h-8 w-64" />
				<Skeleton className="h-4 w-40" />
			</div>
			{/* Uptime card */}
			<UptimeBarSkeleton />
			{/* Services card */}
			<div className="mt-8 mb-8 rounded-xl border border-border/50 bg-card p-6">
				<Skeleton className="mb-1 h-5 w-20" />
				<Skeleton className="mb-4 h-4 w-48" />
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							className="flex items-center justify-between rounded-lg border border-border/30 px-4 py-3"
							key={`service-skeleton-${i}`}
						>
							<div className="flex items-center gap-3">
								<Skeleton className="size-2.5 rounded-full" />
								<Skeleton className="h-4 w-24" />
							</div>
							<div className="flex items-center gap-4">
								<Skeleton className="h-4 w-14" />
								<Skeleton className="h-5 w-12 rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>
			{/* Incidents card */}
			<CardSkeleton />
		</div>
	);
}

export {
	BrandingPageSkeleton,
	CardSkeleton,
	DashboardPageSkeleton,
	DashboardStatsSkeleton,
	IncidentListSkeleton,
	IncidentSkeleton,
	IncidentsPageSkeleton,
	MonitorDetailSkeleton,
	MonitorListSkeleton,
	MonitorRowSkeleton,
	MonitorsPageSkeleton,
	NotificationCardSkeleton,
	NotificationsPageSkeleton,
	PageHeaderSkeleton,
	PublicStatusPageSkeleton,
	Skeleton,
	StatCardSkeleton,
	StatusPageCardSkeleton,
	StatusPagesPageSkeleton,
	TableSkeleton,
	UptimeBarSkeleton,
};
