"use client";

import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	Globe,
	MessageSquarePlus,
	RefreshCw,
	Wrench,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { INCIDENT_STATUS_CONFIG, SEVERITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

import { AddUpdateDialog } from "./AddUpdateDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";

interface IncidentDetailClientProps {
	id: string;
}

function formatDuration(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	if (seconds < 3600) {
		return `${Math.round(seconds / 60)}m`;
	}
	if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.round((seconds % 3600) / 60);
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	const days = Math.floor(seconds / 86400);
	const hours = Math.round((seconds % 86400) / 3600);
	return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

const AFFECTED_STATUS_CONFIG = {
	DOWN: {
		label: "Down",
		icon: XCircle,
		colorClass: "text-red-500",
		dotClass: "bg-red-500",
	},
	DEGRADED: {
		label: "Degraded",
		icon: AlertTriangle,
		colorClass: "text-yellow-500",
		dotClass: "bg-yellow-500",
	},
	MAINTENANCE: {
		label: "Maintenance",
		icon: Wrench,
		colorClass: "text-blue-500",
		dotClass: "bg-blue-500",
	},
} as const;

export function IncidentDetailClient({ id }: IncidentDetailClientProps) {
	const utils = api.useUtils();
	const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
	const [addUpdateOpen, setAddUpdateOpen] = useState(false);

	const [incident] = api.incident.getById.useSuspenseQuery({ id });

	const resolveMutation = api.incident.resolve.useMutation({
		onSuccess: () => {
			toast.success("Incident resolved");
			utils.incident.getById.invalidate({ id });
			utils.incident.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to resolve incident");
		},
	});

	const isResolved = incident.status === "resolved";
	const severityConfig =
		SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG];
	const statusConfig =
		INCIDENT_STATUS_CONFIG[
			incident.status as keyof typeof INCIDENT_STATUS_CONFIG
		];

	// Calculate ongoing duration if not resolved
	const duration = incident.duration
		? incident.duration
		: Math.floor((Date.now() - new Date(incident.startedAt).getTime()) / 1000);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button
						className="mt-1"
						nativeButton={false}
						render={<Link href="/dashboard/incidents" />}
						size="icon"
						variant="ghost"
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight">
								{incident.title}
							</h1>
							<Badge className={severityConfig?.badgeClass} variant="outline">
								{severityConfig?.label}
							</Badge>
							<Badge className={statusConfig?.badgeClass} variant="secondary">
								<span
									className={cn(
										"mr-1.5 size-2 rounded-full",
										statusConfig?.dotClass,
									)}
								/>
								{statusConfig?.label}
							</Badge>
						</div>
						<p className="mt-1 text-muted-foreground">
							<Link
								className="hover:underline"
								href={`/dashboard/monitors/${incident.monitor.id}`}
							>
								{incident.monitor.name}
							</Link>
						</p>
					</div>
				</div>

				{!isResolved && (
					<div className="flex items-center gap-2">
						<Button onClick={() => setUpdateStatusOpen(true)} variant="outline">
							<RefreshCw className="mr-2 size-4" />
							Update Status
						</Button>
						<Button
							disabled={resolveMutation.isPending}
							onClick={() => resolveMutation.mutate({ id })}
							variant="default"
						>
							<CheckCircle2 className="mr-2 size-4" />
							{resolveMutation.isPending ? "Resolving..." : "Resolve"}
						</Button>
					</div>
				)}
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Status</CardTitle>
						<AlertTriangle className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<span
								className={cn("size-3 rounded-full", statusConfig?.dotClass)}
							/>
							<span className="font-bold text-2xl capitalize">
								{incident.status}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Severity</CardTitle>
						<AlertTriangle className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<span
								className={cn("size-3 rounded-full", severityConfig?.dotClass)}
							/>
							<span className="font-bold text-2xl capitalize">
								{incident.severity}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Started</CardTitle>
						<Calendar className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{formatDistanceToNow(new Date(incident.startedAt), {
								addSuffix: true,
							})}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							{new Date(incident.startedAt).toLocaleString()}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Duration</CardTitle>
						<Clock className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"font-bold text-2xl",
								isResolved ? "text-green-500" : "text-yellow-500",
							)}
						>
							{formatDuration(duration)}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							{isResolved ? "Total duration" : "Ongoing"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Status Page Impact
						</CardTitle>
						<Globe className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{(() => {
							const affectedConfig =
								AFFECTED_STATUS_CONFIG[
									incident.affectedStatus as keyof typeof AFFECTED_STATUS_CONFIG
								] ?? AFFECTED_STATUS_CONFIG.DEGRADED;
							const Icon = affectedConfig.icon;
							return (
								<div className="flex items-center gap-2">
									<Icon className={cn("size-5", affectedConfig.colorClass)} />
									<span
										className={cn(
											"font-bold text-2xl",
											affectedConfig.colorClass,
										)}
									>
										{affectedConfig.label}
									</span>
								</div>
							);
						})()}
						<p className="mt-1 text-muted-foreground text-xs">
							{isResolved ? "Was shown on status page" : "Shown on status page"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Description */}
			{incident.description && (
				<Card>
					<CardHeader>
						<CardTitle>Description</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">{incident.description}</p>
					</CardContent>
				</Card>
			)}

			{/* Timeline */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Timeline</CardTitle>
						<CardDescription>
							{incident.updates.length} update
							{incident.updates.length !== 1 ? "s" : ""}
						</CardDescription>
					</div>
					{!isResolved && (
						<Button
							onClick={() => setAddUpdateOpen(true)}
							size="sm"
							variant="outline"
						>
							<MessageSquarePlus className="mr-2 size-4" />
							Add Update
						</Button>
					)}
				</CardHeader>
				<CardContent>
					{incident.updates.length > 0 ? (
						<div className="relative space-y-0">
							{/* Vertical line */}
							<div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-border" />

							{incident.updates.map((update) => {
								const updateStatusConfig =
									INCIDENT_STATUS_CONFIG[
										update.status as keyof typeof INCIDENT_STATUS_CONFIG
									];
								return (
									<div
										className="relative flex gap-4 pb-6 last:pb-0"
										key={update.id}
									>
										{/* Status dot */}
										<div
											className={cn(
												"relative z-10 mt-1 size-6 shrink-0 rounded-full border-2 border-background",
												updateStatusConfig?.dotClass,
											)}
										/>

										{/* Content */}
										<div className="flex-1 pb-2">
											<div className="flex flex-wrap items-center gap-2">
												<Badge
													className={updateStatusConfig?.badgeClass}
													variant="secondary"
												>
													{updateStatusConfig?.label}
												</Badge>
												<span className="text-muted-foreground text-xs">
													{formatDistanceToNow(new Date(update.createdAt), {
														addSuffix: true,
													})}
												</span>
											</div>
											<p className="mt-2 text-sm">{update.message}</p>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="py-8 text-center text-muted-foreground">
							No updates yet
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialogs */}
			<UpdateStatusDialog
				currentStatus={incident.status}
				incidentId={id}
				onOpenChange={setUpdateStatusOpen}
				open={updateStatusOpen}
			/>

			<AddUpdateDialog
				incidentId={id}
				onOpenChange={setAddUpdateOpen}
				open={addUpdateOpen}
			/>
		</div>
	);
}
