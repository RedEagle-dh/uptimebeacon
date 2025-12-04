"use client";

import {
	Activity,
	AlertTriangle,
	ArrowRight,
	ArrowUpRight,
	CheckCircle,
	Clock,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";

import { type Status, StatusDot, UptimeBar } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type MonitorStats = RouterOutputs["monitor"]["getStats"];
type Monitor = RouterOutputs["monitor"]["getAll"][number];
type Incident = RouterOutputs["incident"]["getAll"][number];

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	description?: string;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	variant?: "default" | "success" | "danger" | "warning";
}

function StatCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	variant = "default",
}: StatCardProps) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden",
				variant === "success" && "border-status-up/20",
				variant === "danger" && "border-status-down/20",
				variant === "warning" && "border-status-degraded/20",
			)}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				<div
					className={cn(
						"flex size-9 items-center justify-center rounded-lg",
						variant === "default" && "bg-muted/50",
						variant === "success" && "bg-status-up/10",
						variant === "danger" && "bg-status-down/10",
						variant === "warning" && "bg-status-degraded/10",
					)}
				>
					<Icon
						className={cn(
							"size-4",
							variant === "default" && "text-muted-foreground",
							variant === "success" && "text-status-up",
							variant === "danger" && "text-status-down",
							variant === "warning" && "text-status-degraded",
						)}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-baseline gap-2">
					<span className="font-bold text-3xl tracking-tight">{value}</span>
					{trend && (
						<span
							className={cn(
								"flex items-center gap-0.5 font-medium text-xs",
								trend.isPositive ? "text-status-up" : "text-status-down",
							)}
						>
							<TrendingUp
								className={cn(
									"size-3",
									!trend.isPositive && "rotate-180 transform",
								)}
							/>
							{trend.value}%
						</span>
					)}
				</div>
				{description && (
					<p className="mt-1 text-muted-foreground text-xs">{description}</p>
				)}
			</CardContent>
			{/* Subtle gradient overlay */}
			<div
				className={cn(
					"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.03]",
					variant === "success" && "from-status-up to-transparent",
					variant === "danger" && "from-status-down to-transparent",
					variant === "warning" && "from-status-degraded to-transparent",
				)}
			/>
		</Card>
	);
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
	const status = monitor.status as Status;
	const responseTime = monitor.avgResponseTime ?? 0;
	const uptime = monitor.uptimePercentage ?? 0;

	return (
		<Link className="block" href={`/dashboard/monitors/${monitor.id}`}>
			<div className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-card">
				<div className="flex items-center gap-3">
					<StatusDot status={status} />
					<div>
						<p className="font-medium transition-colors duration-200 group-hover:text-foreground">
							{monitor.name}
						</p>
						<p className="text-muted-foreground text-xs">
							{monitor.url ?? monitor.hostname}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-6">
					<div className="hidden text-right md:block">
						<p
							className={cn(
								"font-medium font-mono text-sm",
								status === "UP" && "text-status-up",
								status === "DOWN" && "text-status-down",
								status === "DEGRADED" && "text-status-degraded",
							)}
						>
							{status === "UP" ? `${Math.round(responseTime)}ms` : status}
						</p>
						<p className="text-muted-foreground text-xs">
							{uptime.toFixed(2)}% uptime
						</p>
					</div>
					<ArrowRight className="size-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
				</div>
			</div>
		</Link>
	);
}

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - new Date(date).getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins} minutes ago`;
	if (diffHours < 24) return `${diffHours} hours ago`;
	return `${diffDays} days ago`;
}

function IncidentCard({ incident }: { incident: Incident }) {
	return (
		<Link className="block" href={`/dashboard/incidents/${incident.id}`}>
			<div className="group flex items-start gap-4 rounded-lg border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-card">
				<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-degraded/10">
					<AlertTriangle className="size-4 text-status-degraded" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<p className="font-medium transition-colors duration-200 group-hover:text-foreground">
							{incident.title}
						</p>
						<Badge
							className="shrink-0"
							variant={
								incident.status === "investigating"
									? "destructive"
									: "secondary"
							}
						>
							{incident.status}
						</Badge>
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{incident.monitor.name} &middot; Started{" "}
						{formatTimeAgo(incident.startedAt)}
					</p>
				</div>
			</div>
		</Link>
	);
}

export function DashboardClient() {
	const [stats] = api.monitor.getStats.useSuspenseQuery();
	const [monitors] = api.monitor.getAll.useSuspenseQuery();
	const [incidents] = api.incident.getAll.useSuspenseQuery();

	const activeIncidents = incidents.filter((i) => i.status !== "resolved");
	const displayMonitors = monitors.slice(0, 4);

	// Calculate average uptime
	const avgUptime =
		monitors.length > 0
			? monitors.reduce((acc, m) => acc + (m.uptimePercentage ?? 0), 0) /
				monitors.length
			: 100;

	return (
		<div className="space-y-8">
			{/* Page header */}
			<div className="flex items-end justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Dashboard</h1>
					<p className="mt-1 text-muted-foreground">
						Overview of your monitoring status
					</p>
				</div>
				<Button asChild size="sm" variant="outline">
					<Link href="/dashboard/monitors/new">
						<Zap className="mr-2 size-4" />
						Add Monitor
					</Link>
				</Button>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					description="Active monitors"
					icon={Activity}
					title="Total Monitors"
					value={stats.total}
				/>
				<StatCard
					description="Services online"
					icon={CheckCircle}
					title="Operational"
					value={stats.up}
					variant="success"
				/>
				<StatCard
					description="Services offline"
					icon={AlertTriangle}
					title="Down"
					value={stats.down}
					variant="danger"
				/>
				<StatCard
					description="Across all monitors"
					icon={Clock}
					title="Avg Response"
					value={`${Math.round(stats.avgResponseTime)}ms`}
				/>
			</div>

			{/* Uptime Overview */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Uptime Overview</CardTitle>
							<CardDescription>Last 30 days performance</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-bold text-3xl text-status-up">
								{avgUptime.toFixed(2)}%
							</span>
							<span className="text-muted-foreground text-sm">uptime</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<UptimeBar className="w-full justify-between" days={90} />
					<div className="mt-3 flex items-center justify-between text-muted-foreground text-xs">
						<span>90 days ago</span>
						<span>Today</span>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Monitors List */}
				<Card>
					<CardHeader>
						<CardTitle>Monitors</CardTitle>
						<CardDescription>Your active monitoring endpoints</CardDescription>
						<CardAction>
							<Button asChild size="sm" variant="ghost">
								<Link href="/dashboard/monitors">
									View all
									<ArrowUpRight className="ml-1 size-3" />
								</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-3">
						{displayMonitors.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="font-medium">No monitors yet</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Add your first monitor to get started
								</p>
							</div>
						) : (
							displayMonitors.map((monitor) => (
								<MonitorCard key={monitor.id} monitor={monitor} />
							))
						)}
					</CardContent>
				</Card>

				{/* Active Incidents */}
				<Card>
					<CardHeader>
						<CardTitle>Active Incidents</CardTitle>
						<CardDescription>
							Current issues requiring attention
						</CardDescription>
						<CardAction>
							<Button asChild size="sm" variant="ghost">
								<Link href="/dashboard/incidents">
									View all
									<ArrowUpRight className="ml-1 size-3" />
								</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{activeIncidents.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-status-up/10">
									<CheckCircle className="size-6 text-status-up" />
								</div>
								<p className="font-medium">No active incidents</p>
								<p className="mt-1 text-muted-foreground text-sm">
									All systems are operational
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{activeIncidents.slice(0, 5).map((incident) => (
									<IncidentCard incident={incident} key={incident.id} />
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
