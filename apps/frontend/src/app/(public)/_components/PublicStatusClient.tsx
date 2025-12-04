"use client";

import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";

import {
	type Status,
	StatusBadge,
	StatusDot,
	UptimeBar,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type PublicOverview = RouterOutputs["statusPage"]["getPublicOverview"];
type Monitor = PublicOverview["monitors"][number];
type Incident = PublicOverview["activeIncidents"][number];

function ServiceRow({ monitor }: { monitor: Monitor }) {
	const status = monitor.status as Status;
	const uptime = monitor.uptimePercentage ?? 0;

	return (
		<div className="group flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-3 transition-all duration-200 hover:border-border/50 hover:bg-card/50">
			<div className="flex items-center gap-3">
				<StatusDot status={status} />
				<span className="font-medium">{monitor.name}</span>
			</div>
			<div className="flex items-center gap-4">
				<span className="font-mono text-muted-foreground text-sm">
					{uptime.toFixed(2)}%
				</span>
				<StatusBadge showDot={false} size="sm" status={status} />
			</div>
		</div>
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
	const isOngoing = incident.status !== "resolved";

	return (
		<div
			className={cn(
				"rounded-lg border p-4 transition-all duration-200",
				isOngoing
					? "border-status-degraded/30 bg-status-degraded/5"
					: "border-border/30 bg-card/30",
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div
						className={cn(
							"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
							isOngoing
								? "bg-status-degraded/10 text-status-degraded"
								: "bg-muted/50 text-muted-foreground",
						)}
					>
						{isOngoing ? (
							<AlertTriangle className="size-4" />
						) : (
							<CheckCircle2 className="size-4" />
						)}
					</div>
					<div>
						<h3 className="font-medium">{incident.title}</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							{incident.description ??
								`Incident affecting ${incident.monitor.name}`}
						</p>
						<p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
							<Clock className="size-3" />
							{formatTimeAgo(incident.startedAt)}
						</p>
					</div>
				</div>
				<Badge
					className={cn(
						"shrink-0 capitalize",
						isOngoing && "bg-status-degraded/10 text-status-degraded",
					)}
					variant={isOngoing ? "secondary" : "outline"}
				>
					{incident.status}
				</Badge>
			</div>
		</div>
	);
}

export function PublicStatusClient() {
	const [data] = api.statusPage.getPublicOverview.useSuspenseQuery();

	const { monitors, overallStatus, activeIncidents, recentResolvedIncidents } =
		data;

	const status = overallStatus as Status;
	const allIncidents = [...activeIncidents, ...recentResolvedIncidents];

	const uptimePercentage =
		monitors.length > 0
			? monitors.reduce((acc, m) => acc + (m.uptimePercentage ?? 0), 0) /
				monitors.length
			: 100;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-12">
			{/* Overall Status Hero */}
			<div className="mb-10 text-center">
				<div
					className={cn(
						"mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl",
						status === "UP" && "bg-status-up/10",
						status === "DOWN" && "bg-status-down/10",
						status === "DEGRADED" && "bg-status-degraded/10",
						status === "PENDING" && "bg-muted/50",
					)}
				>
					{status === "UP" ? (
						<CheckCircle2
							className="size-10 text-status-up"
							strokeWidth={1.5}
						/>
					) : status === "DOWN" ? (
						<AlertTriangle
							className="size-10 text-status-down"
							strokeWidth={1.5}
						/>
					) : status === "DEGRADED" ? (
						<AlertTriangle
							className="size-10 text-status-degraded"
							strokeWidth={1.5}
						/>
					) : (
						<CheckCircle2
							className="size-10 text-muted-foreground"
							strokeWidth={1.5}
						/>
					)}
				</div>
				<h1 className="mb-2 font-bold text-3xl tracking-tight">
					{status === "UP"
						? "All Systems Operational"
						: status === "DOWN"
							? "Major System Outage"
							: status === "DEGRADED"
								? "Partial System Outage"
								: "Status Unknown"}
				</h1>
				<p className="text-muted-foreground">
					Last updated: {new Date().toLocaleString()}
				</p>
			</div>

			{/* Uptime Overview */}
			<Card className="mb-8">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Uptime History</CardTitle>
							<CardDescription>Last 90 days performance</CardDescription>
						</div>
						<div className="text-right">
							<span className="font-bold text-2xl text-status-up">
								{uptimePercentage.toFixed(2)}%
							</span>
							<p className="text-muted-foreground text-xs">avg uptime</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<UptimeBar className="w-full justify-between" days={90} />
					<div className="mt-3 flex justify-between text-muted-foreground text-xs">
						<span>90 days ago</span>
						<span>Today</span>
					</div>
				</CardContent>
			</Card>

			{/* Services List */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Services</CardTitle>
					<CardDescription>
						Current status of all monitored services
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					{monitors.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							No services configured
						</div>
					) : (
						monitors.map((monitor) => (
							<ServiceRow key={monitor.id} monitor={monitor} />
						))
					)}
				</CardContent>
			</Card>

			{/* Recent Incidents */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Recent Incidents</CardTitle>
					<CardDescription>
						Past incidents and maintenance updates
					</CardDescription>
				</CardHeader>
				<CardContent>
					{allIncidents.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-status-up/10">
								<CheckCircle2 className="size-6 text-status-up" />
							</div>
							<p className="font-medium">No recent incidents</p>
							<p className="mt-1 text-muted-foreground text-sm">
								All systems have been running smoothly
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{allIncidents.map((incident) => (
								<IncidentCard incident={incident} key={incident.id} />
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Subscribe CTA */}
			<Card className="border-dashed bg-muted/20">
				<CardContent className="flex flex-col items-center justify-center py-8 text-center">
					<h3 className="mb-2 font-semibold">Stay Updated</h3>
					<p className="mb-4 max-w-md text-muted-foreground text-sm">
						Subscribe to receive notifications about incidents and scheduled
						maintenance.
					</p>
					<Button size="sm" variant="outline">
						<ExternalLink className="mr-2 size-4" />
						Subscribe to Updates
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
