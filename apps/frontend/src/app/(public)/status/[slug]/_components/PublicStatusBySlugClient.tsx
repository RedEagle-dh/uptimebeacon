"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

import { type Status, StatusBadge, StatusDot } from "@/components/shared";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type StatusPageBySlug = RouterOutputs["statusPage"]["getBySlug"];
type StatusPageMonitor = StatusPageBySlug["monitors"][number];

function ServiceRow({ monitor }: { monitor: StatusPageMonitor }) {
	const status = monitor.monitor.status as Status;
	const uptime = monitor.monitor.uptimePercentage ?? 0;
	const displayName = monitor.displayName || monitor.monitor.name;

	return (
		<div className="group flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-3 transition-all duration-200 hover:border-border/50 hover:bg-card/50">
			<div className="flex items-center gap-3">
				<StatusDot status={status} />
				<span className="font-medium">{displayName}</span>
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

interface PublicStatusBySlugClientProps {
	slug: string;
}

export function PublicStatusBySlugClient({
	slug,
}: PublicStatusBySlugClientProps) {
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const { data, error } = api.statusPage.getBySlug.useQuery(
		{ slug },
		{
			retry: false,
		},
	);

	useEffect(() => {
		if (data) {
			setLastUpdated(new Date().toLocaleString());
		}
	}, [data]);

	// Handle 404
	if (error?.data?.code === "NOT_FOUND") {
		notFound();
	}

	if (!data) {
		return null;
	}

	const { monitors, overallStatus, name, description, logoUrl } = data;
	const status = overallStatus as Status;

	const uptimePercentage =
		monitors.length > 0
			? monitors.reduce(
					(acc, m) => acc + (m.monitor.uptimePercentage ?? 0),
					0,
				) / monitors.length
			: 100;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-12">
			{/* Overall Status Hero */}
			<div className="mb-10 text-center">
				{logoUrl ? (
					<Image
						alt={name}
						className="mx-auto mb-6 rounded-2xl object-contain"
						height={80}
						src={logoUrl}
						width={80}
					/>
				) : (
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
				)}
				<h1 className="mb-2 font-bold text-3xl tracking-tight">{name}</h1>
				{description && (
					<p className="mb-2 text-muted-foreground">{description}</p>
				)}
				<p
					className={cn(
						"font-medium text-lg",
						status === "UP" && "text-status-up",
						status === "DOWN" && "text-status-down",
						status === "DEGRADED" && "text-status-degraded",
						status === "PENDING" && "text-muted-foreground",
					)}
				>
					{status === "UP"
						? "All Systems Operational"
						: status === "DOWN"
							? "Major System Outage"
							: status === "DEGRADED"
								? "Partial System Outage"
								: "Status Unknown"}
				</p>
				{lastUpdated && (
					<p className="mt-2 text-muted-foreground text-sm">
						Last updated: {lastUpdated}
					</p>
				)}
			</div>

			{/* Uptime Summary */}
			<Card className="mb-8">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>System Status</CardTitle>
							<CardDescription>
								Current status of all monitored services
							</CardDescription>
						</div>
						<div className="text-right">
							<span className="font-bold text-2xl text-status-up">
								{uptimePercentage.toFixed(2)}%
							</span>
							<p className="text-muted-foreground text-xs">avg uptime</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					{monitors.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							No services configured
						</div>
					) : (
						monitors.map((monitor) => (
							<ServiceRow key={monitor.monitorId} monitor={monitor} />
						))
					)}
				</CardContent>
			</Card>

			{/* Footer */}
			<div className="text-center text-muted-foreground text-sm">
				<p>Powered by UptimeBeacon</p>
			</div>
		</div>
	);
}
