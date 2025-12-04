"use client";

import {
	ArrowRight,
	Filter,
	MoreHorizontal,
	Pause,
	Play,
	Plus,
	Search,
	Settings,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { type Status, StatusDot, UptimeBar } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type Monitor = RouterOutputs["monitor"]["getAll"][number];

interface MonitorRowProps {
	monitor: Monitor;
}

function MonitorRow({ monitor }: MonitorRowProps) {
	const utils = api.useUtils();
	const pauseMutation = api.monitor.pause.useMutation({
		onSuccess: () => utils.monitor.getAll.invalidate(),
	});
	const resumeMutation = api.monitor.resume.useMutation({
		onSuccess: () => utils.monitor.getAll.invalidate(),
	});
	const deleteMutation = api.monitor.delete.useMutation({
		onSuccess: () => utils.monitor.getAll.invalidate(),
	});

	const status = monitor.status as Status;
	const responseTime = monitor.avgResponseTime ?? 0;
	const uptime = monitor.uptimePercentage ?? 0;
	const interval = monitor.interval;

	return (
		<Link className="block" href={`/dashboard/monitors/${monitor.id}`}>
			<div className="group flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-card">
				{/* Status and name */}
				<div className="flex min-w-0 flex-1 items-center gap-4">
					<StatusDot status={status} />
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3 className="truncate font-medium transition-colors duration-200 group-hover:text-foreground">
								{monitor.name}
							</h3>
							<Badge
								className="shrink-0 bg-muted/50 text-[10px]"
								variant="secondary"
							>
								{monitor.type}
							</Badge>
						</div>
						<p className="mt-0.5 truncate text-muted-foreground text-sm">
							{monitor.url ?? monitor.hostname}
						</p>
					</div>
				</div>

				{/* Uptime bar - hidden on mobile */}
				<div className="hidden w-48 flex-col items-center lg:flex">
					<UptimeBar className="h-5 w-full" days={30} />
					<p className="mt-1 text-center text-[10px] text-muted-foreground">
						30 days
					</p>
				</div>

				{/* Stats */}
				<div className="hidden w-20 flex-col items-end md:flex">
					<p
						className={cn(
							"font-medium font-mono text-sm",
							status === "UP" && "text-status-up",
							status === "DOWN" && "text-status-down",
							status === "DEGRADED" && "text-status-degraded",
							status === "MAINTENANCE" && "text-status-maintenance",
							status === "PENDING" && "text-status-pending",
						)}
					>
						{status === "UP" || status === "DEGRADED"
							? `${Math.round(responseTime)}ms`
							: status}
					</p>
					<p className="text-muted-foreground text-xs">
						{uptime.toFixed(2)}% uptime
					</p>
				</div>

				{/* Interval */}
				<div className="hidden w-16 text-right sm:block">
					<p className="text-muted-foreground text-sm">
						{interval < 60 ? `${interval}s` : `${interval / 60}m`}
					</p>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
								onClick={(e) => e.preventDefault()}
								size="icon-sm"
								variant="ghost"
							>
								<MoreHorizontal className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
								}}
							>
								<Settings className="mr-2 size-4" />
								Edit Monitor
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={pauseMutation.isPending || resumeMutation.isPending}
								onClick={(e) => {
									e.preventDefault();
									if (monitor.paused) {
										resumeMutation.mutate({ id: monitor.id });
									} else {
										pauseMutation.mutate({ id: monitor.id });
									}
								}}
							>
								{monitor.paused ? (
									<>
										<Play className="mr-2 size-4" />
										Resume Monitoring
									</>
								) : (
									<>
										<Pause className="mr-2 size-4" />
										Pause Monitoring
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								disabled={deleteMutation.isPending}
								onClick={(e) => {
									e.preventDefault();
									deleteMutation.mutate({ id: monitor.id });
								}}
							>
								<Trash2 className="mr-2 size-4" />
								Delete Monitor
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ArrowRight className="size-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
				</div>
			</div>
		</Link>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-border/50 border-dashed bg-muted/10 py-16">
			<div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted/50">
				<Plus className="size-6 text-muted-foreground" />
			</div>
			<h3 className="font-semibold">No monitors yet</h3>
			<p className="mt-1 mb-6 max-w-sm text-center text-muted-foreground text-sm">
				Create your first monitor to start tracking the uptime of your services.
			</p>
			<Button asChild>
				<Link href="/dashboard/monitors/new">
					<Plus className="mr-2 size-4" />
					Add your first monitor
				</Link>
			</Button>
		</div>
	);
}

export function MonitorsClient() {
	const [monitors] = api.monitor.getAll.useSuspenseQuery();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredMonitors = monitors.filter((monitor) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			monitor.name.toLowerCase().includes(query) ||
			monitor.url?.toLowerCase().includes(query) ||
			monitor.hostname?.toLowerCase().includes(query)
		);
	});

	const stats = {
		total: monitors.length,
		up: monitors.filter((m) => m.status === "UP").length,
		down: monitors.filter((m) => m.status === "DOWN").length,
		degraded: monitors.filter((m) => m.status === "DEGRADED").length,
	};

	const hasMonitors = monitors.length > 0;

	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Monitors</h1>
					<p className="mt-1 text-muted-foreground">
						Manage and track your uptime monitors
					</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/monitors/new">
						<Plus className="mr-2 size-4" />
						Add Monitor
					</Link>
				</Button>
			</div>

			{hasMonitors ? (
				<>
					{/* Stats bar */}
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							className="gap-1.5 bg-muted/50 px-3 py-1"
							variant="secondary"
						>
							<span className="text-muted-foreground">Total:</span>
							<span className="font-semibold">{stats.total}</span>
						</Badge>
						<Badge
							className="gap-1.5 bg-status-up/10 px-3 py-1 text-status-up"
							variant="secondary"
						>
							<StatusDot animate={false} className="size-2" status="UP" />
							<span>{stats.up} Up</span>
						</Badge>
						{stats.down > 0 && (
							<Badge
								className="gap-1.5 bg-status-down/10 px-3 py-1 text-status-down"
								variant="secondary"
							>
								<StatusDot animate={false} className="size-2" status="DOWN" />
								<span>{stats.down} Down</span>
							</Badge>
						)}
						{stats.degraded > 0 && (
							<Badge
								className="gap-1.5 bg-status-degraded/10 px-3 py-1 text-status-degraded"
								variant="secondary"
							>
								<StatusDot
									animate={false}
									className="size-2"
									status="DEGRADED"
								/>
								<span>{stats.degraded} Degraded</span>
							</Badge>
						)}
					</div>

					{/* Filters and search */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
							<input
								className="input-modern h-9 w-full pl-9"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search monitors..."
								type="text"
								value={searchQuery}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button size="sm" variant="outline">
								<Filter className="mr-2 size-4" />
								Filters
							</Button>
						</div>
					</div>

					{/* Monitors list */}
					<div className="space-y-3">
						{filteredMonitors.map((monitor) => (
							<MonitorRow key={monitor.id} monitor={monitor} />
						))}
						{filteredMonitors.length === 0 && searchQuery && (
							<div className="py-8 text-center text-muted-foreground">
								No monitors match your search
							</div>
						)}
					</div>
				</>
			) : (
				<EmptyState />
			)}
		</div>
	);
}
