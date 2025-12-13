"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Clock,
	ExternalLink,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Settings,
	Trash2,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { type Status, StatusBadge, StatusDot } from "@/components/shared";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INCIDENT_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatUptime } from "@/lib/utils";
import { api } from "@/trpc/react";

interface MonitorDetailClientProps {
	id: string;
}

const chartConfig = {
	responseTime: {
		label: "Avg Response Time",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export function MonitorDetailClient({ id }: MonitorDetailClientProps) {
	const router = useRouter();
	const utils = api.useUtils();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [monitor] = api.monitor.getById.useSuspenseQuery({ id });
	const [uptimeData] = api.monitor.getUptimeData.useSuspenseQuery({
		monitorId: id,
		days: 30,
	});

	const pauseMutation = api.monitor.pause.useMutation({
		onSuccess: () => {
			toast.success("Monitor paused");
			utils.monitor.getById.invalidate({ id });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to pause monitor");
		},
	});

	const resumeMutation = api.monitor.resume.useMutation({
		onSuccess: () => {
			toast.success("Monitor resumed");
			utils.monitor.getById.invalidate({ id });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to resume monitor");
		},
	});

	const deleteMutation = api.monitor.delete.useMutation({
		onSuccess: () => {
			toast.success("Monitor deleted");
			router.push("/dashboard/monitors");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete monitor");
		},
	});

	const status = monitor.status as Status;
	const checks = monitor.checks;
	const incidents = monitor.incidents;

	// Memoize chart data to avoid recalculation on every render
	const chartData = useMemo(
		() =>
			uptimeData.map((day) => ({
				date: day.date,
				uptime: day.uptime,
				up: day.up,
				down: day.down,
				degraded: day.degraded,
			})),
		[uptimeData],
	);

	// Memoize average response time calculation
	const avgResponseTime = useMemo(() => {
		const recentResponseTimes = checks
			.filter((c) => c.responseTime != null)
			.slice(0, 50);
		return recentResponseTimes.length > 0
			? recentResponseTimes.reduce((acc, c) => acc + (c.responseTime ?? 0), 0) /
					recentResponseTimes.length
			: 0;
	}, [checks]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button
						className="mt-1"
						nativeButton={false}
						render={<Link href="/dashboard/monitors" />}
						size="icon"
						variant="ghost"
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight">
								{monitor.name}
							</h1>
							<Badge className="bg-muted/50" variant="secondary">
								{monitor.type}
							</Badge>
							<StatusBadge status={status} />
							{monitor.paused && (
								<Badge
									className="bg-yellow-500/10 text-yellow-500"
									variant="secondary"
								>
									Paused
								</Badge>
							)}
						</div>
						<p className="mt-1 text-muted-foreground">
							{monitor.url ?? monitor.hostname}
							{monitor.port && `:${monitor.port}`}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{monitor.url && (
						<Button
							nativeButton={false}
							render={
								<Link
									href={monitor.url}
									rel="noopener noreferrer"
									target="_blank"
								/>
							}
							size="sm"
							variant="outline"
						>
							<ExternalLink className="mr-2 size-4" />
							Visit
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger
							render={<Button size="icon" variant="outline" />}
						>
							<MoreHorizontal className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								render={<Link href={`/dashboard/monitors/${id}/edit`} />}
							>
								<Pencil className="mr-2 size-4" />
								Edit Monitor
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={pauseMutation.isPending || resumeMutation.isPending}
								onClick={() => {
									if (monitor.paused) {
										resumeMutation.mutate({ id });
									} else {
										pauseMutation.mutate({ id });
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
								onClick={() => setDeleteDialogOpen(true)}
							>
								<Trash2 className="mr-2 size-4" />
								Delete Monitor
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Status</CardTitle>
						<Activity className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<StatusDot status={status} />
							<span
								className={cn(
									"font-bold text-2xl",
									status === "UP" && "text-green-500",
									status === "DOWN" && "text-red-500",
									status === "DEGRADED" && "text-yellow-500",
									status === "PENDING" && "text-neutral-500",
									status === "MAINTENANCE" && "text-blue-500",
								)}
							>
								{status}
							</span>
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							{monitor.lastCheckAt
								? `Last checked ${formatDistanceToNow(new Date(monitor.lastCheckAt), { addSuffix: true })}`
								: "No checks yet"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Response Time</CardTitle>
						<Zap className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl">
							{Math.round(avgResponseTime)}ms
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Average from last 50 checks
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Uptime</CardTitle>
						<Activity className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"font-bold font-mono text-2xl",
								monitor.uptimePercentage >= 99.9
									? "text-green-500"
									: monitor.uptimePercentage >= 99
										? "text-yellow-500"
										: "text-red-500",
							)}
						>
							{formatUptime(monitor.uptimePercentage)}%
						</div>
						<p className="mt-1 text-muted-foreground text-xs">Last 30 days</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Check Interval
						</CardTitle>
						<Clock className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{monitor.interval < 60
								? `${monitor.interval}s`
								: `${monitor.interval / 60}m`}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Timeout: {monitor.timeout}s
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="checks">Recent Checks</TabsTrigger>
					<TabsTrigger value="incidents">
						Incidents
						{incidents.length > 0 && (
							<Badge
								className="ml-2 bg-red-500/10 text-red-500"
								variant="secondary"
							>
								{incidents.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent className="space-y-6" value="overview">
					<div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
						{/* Uptime Chart */}
						<Card>
							<CardHeader>
								<CardTitle>30-Day Uptime</CardTitle>
								<CardDescription>
									Daily uptime percentage over the last 30 days
								</CardDescription>
							</CardHeader>
							<CardContent>
								{chartData.length > 0 ? (
									<ChartContainer
										className="h-[200px] w-full"
										config={chartConfig}
									>
										<AreaChart data={chartData}>
											<defs>
												<linearGradient
													id="uptimeGradient"
													x1="0"
													x2="0"
													y1="0"
													y2="1"
												>
													<stop
														offset="5%"
														stopColor="hsl(142, 76%, 36%)"
														stopOpacity={0.3}
													/>
													<stop
														offset="95%"
														stopColor="hsl(142, 76%, 36%)"
														stopOpacity={0}
													/>
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis
												axisLine={false}
												dataKey="date"
												tickFormatter={(value) => {
													const date = new Date(value);
													return `${date.getMonth() + 1}/${date.getDate()}`;
												}}
												tickLine={false}
												tickMargin={8}
											/>
											<YAxis
												axisLine={false}
												domain={[90, 100]}
												tickFormatter={(value) => `${value}%`}
												tickLine={false}
												tickMargin={8}
											/>
											<ChartTooltip
												content={
													<ChartTooltipContent
														formatter={(value) => [
															`${formatUptime(Number(value))}%`,
															"Uptime",
														]}
													/>
												}
											/>
											<Area
												dataKey="uptime"
												fill="url(#uptimeGradient)"
												fillOpacity={1}
												stroke="hsl(142, 76%, 36%)"
												strokeWidth={2}
												type="monotone"
											/>
										</AreaChart>
									</ChartContainer>
								) : (
									<div className="flex h-[200px] items-center justify-center text-muted-foreground">
										No data available yet
									</div>
								)}
							</CardContent>
						</Card>

						{/* Configuration */}
						<Card>
							<CardHeader>
								<CardTitle>Configuration</CardTitle>
								<CardDescription>
									Monitor settings and parameters
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Type</span>
									<span className="font-medium">{monitor.type}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Method</span>
									<span className="font-medium">{monitor.method}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Interval</span>
									<span className="font-medium">{monitor.interval}s</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Timeout</span>
									<span className="font-medium">{monitor.timeout}s</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Retries</span>
									<span className="font-medium">{monitor.retries}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Expected Status</span>
									<span className="font-medium">
										{monitor.expectedStatusCodes.join(", ")}
									</span>
								</div>
								{monitor.type === "HTTPS" && (
									<>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												TLS Expiry Alert
											</span>
											<span className="font-medium">
												{monitor.tlsExpiry
													? `${monitor.tlsExpiryDays} days`
													: "Disabled"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Ignore TLS Errors
											</span>
											<span className="font-medium">
												{monitor.ignoreTls ? "Yes" : "No"}
											</span>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Recent Checks Tab */}
				<TabsContent value="checks">
					<Card>
						<CardHeader>
							<CardTitle>Recent Checks</CardTitle>
							<CardDescription>
								Last {checks.length} check results
							</CardDescription>
						</CardHeader>
						<CardContent>
							{checks.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Time</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Response Time</TableHead>
											<TableHead className="hidden sm:table-cell">
												Status Code
											</TableHead>
											<TableHead className="hidden md:table-cell">
												Message
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{checks.map((check) => (
											<TableRow key={check.id}>
												<TableCell className="font-mono text-xs">
													{formatDistanceToNow(new Date(check.createdAt), {
														addSuffix: true,
													})}
												</TableCell>
												<TableCell>
													<StatusBadge
														showDot
														size="sm"
														status={check.status as Status}
													/>
												</TableCell>
												<TableCell className="font-mono">
													{check.responseTime != null
														? `${check.responseTime}ms`
														: "-"}
												</TableCell>
												<TableCell className="hidden font-mono sm:table-cell">
													{check.statusCode ?? "-"}
												</TableCell>
												<TableCell className="hidden max-w-xs truncate text-muted-foreground text-xs md:table-cell">
													{check.message || check.error || "-"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="py-8 text-center text-muted-foreground">
									No checks recorded yet
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Incidents Tab */}
				<TabsContent value="incidents">
					<Card>
						<CardHeader>
							<CardTitle>Incidents</CardTitle>
							<CardDescription>
								Recent incidents for this monitor
							</CardDescription>
						</CardHeader>
						<CardContent>
							{incidents.length > 0 ? (
								<div className="space-y-4">
									{incidents.map((incident) => (
										<div
											className="flex items-start gap-4 rounded-lg border border-border/50 p-4"
											key={incident.id}
										>
											<div
												className={cn(
													"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
													incident.severity === "critical" &&
														"bg-red-500/10 text-red-500",
													incident.severity === "major" &&
														"bg-orange-500/10 text-orange-500",
													incident.severity === "minor" &&
														"bg-yellow-500/10 text-yellow-500",
												)}
											>
												<AlertTriangle className="size-4" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-2">
													<h4 className="font-medium">{incident.title}</h4>
													<Badge
														className={
															INCIDENT_STATUS_CONFIG[
																incident.status as keyof typeof INCIDENT_STATUS_CONFIG
															]?.badgeClass
														}
														variant="secondary"
													>
														{
															INCIDENT_STATUS_CONFIG[
																incident.status as keyof typeof INCIDENT_STATUS_CONFIG
															]?.label
														}
													</Badge>
												</div>
												<p className="mt-1 text-muted-foreground text-sm">
													Started{" "}
													{formatDistanceToNow(new Date(incident.startedAt), {
														addSuffix: true,
													})}
													{incident.resolvedAt && (
														<>
															{" "}
															· Resolved{" "}
															{formatDistanceToNow(
																new Date(incident.resolvedAt),
																{ addSuffix: true },
															)}
														</>
													)}
													{incident.duration && (
														<>
															{" "}
															· Duration:{" "}
															{incident.duration < 60
																? `${incident.duration}s`
																: incident.duration < 3600
																	? `${Math.round(incident.duration / 60)}m`
																	: `${Math.round(incident.duration / 3600)}h`}
														</>
													)}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center text-muted-foreground">
									No incidents recorded
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Settings Tab */}
				<TabsContent value="settings">
					<Card>
						<CardHeader>
							<CardTitle>Monitor Settings</CardTitle>
							<CardDescription>
								Advanced configuration and danger zone
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">Edit Monitor</h4>
									<p className="text-muted-foreground text-sm">
										Change monitor configuration and settings
									</p>
								</div>
								<Button
									nativeButton={false}
									render={<Link href={`/dashboard/monitors/${id}/edit`} />}
									variant="outline"
								>
									<Settings className="mr-2 size-4" />
									Edit
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">
										{monitor.paused ? "Resume Monitoring" : "Pause Monitoring"}
									</h4>
									<p className="text-muted-foreground text-sm">
										{monitor.paused
											? "Resume health checks for this monitor"
											: "Temporarily stop health checks"}
									</p>
								</div>
								<Button
									disabled={pauseMutation.isPending || resumeMutation.isPending}
									onClick={() => {
										if (monitor.paused) {
											resumeMutation.mutate({ id });
										} else {
											pauseMutation.mutate({ id });
										}
									}}
									variant="outline"
								>
									{monitor.paused ? (
										<>
											<Play className="mr-2 size-4" />
											Resume
										</>
									) : (
										<>
											<Pause className="mr-2 size-4" />
											Pause
										</>
									)}
								</Button>
							</div>

							<div className="border-border/50 border-t pt-6">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-destructive">
											Delete Monitor
										</h4>
										<p className="text-muted-foreground text-sm">
											Permanently delete this monitor and all its data
										</p>
									</div>
									<Button
										onClick={() => setDeleteDialogOpen(true)}
										variant="destructive"
									>
										<Trash2 className="mr-2 size-4" />
										Delete
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Monitor</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{monitor.name}"? This action
							cannot be undone. All check history and incidents will be
							permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
							onClick={() => deleteMutation.mutate({ id })}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
