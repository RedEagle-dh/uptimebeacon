"use client";

import {
	ArrowLeft,
	ExternalLink,
	Globe,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { type Status, StatusDot } from "@/components/shared";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatUptime } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { AddMonitorDialog } from "./AddMonitorDialog";

interface StatusPageDetailClientProps {
	id: string;
}

type StatusPageMonitor =
	RouterOutputs["statusPage"]["getById"]["monitors"][number];

const DAYS_OPTIONS = [
	{ value: "7", label: "7 days" },
	{ value: "14", label: "14 days" },
	{ value: "30", label: "30 days" },
	{ value: "60", label: "60 days" },
	{ value: "90", label: "90 days" },
];

export function StatusPageDetailClient({ id }: StatusPageDetailClientProps) {
	const router = useRouter();
	const utils = api.useUtils();

	const [statusPage] = api.statusPage.getById.useSuspenseQuery({ id });

	// Form state
	const [name, setName] = useState(statusPage.name);
	const [slug, setSlug] = useState(statusPage.slug);
	const [description, setDescription] = useState(statusPage.description ?? "");
	const [isPublic, setIsPublic] = useState(statusPage.isPublic);
	const [showIncidentHistory, setShowIncidentHistory] = useState(
		statusPage.showIncidentHistory,
	);
	const [showUptimeGraph, setShowUptimeGraph] = useState(
		statusPage.showUptimeGraph,
	);
	const [daysToShow, setDaysToShow] = useState(String(statusPage.daysToShow));
	const [logoUrl, setLogoUrl] = useState(statusPage.logoUrl ?? "");
	const [faviconUrl, setFaviconUrl] = useState(statusPage.faviconUrl ?? "");

	// Dialog states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [addMonitorDialogOpen, setAddMonitorDialogOpen] = useState(false);

	// Mutations
	const updateMutation = api.statusPage.update.useMutation({
		onSuccess: () => {
			toast.success("Status page updated");
			utils.statusPage.getById.invalidate({ id });
			utils.statusPage.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update status page");
		},
	});

	const deleteMutation = api.statusPage.delete.useMutation({
		onSuccess: () => {
			toast.success("Status page deleted");
			router.push("/dashboard/status-pages");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete status page");
		},
	});

	const removeMonitorMutation = api.statusPage.removeMonitor.useMutation({
		onSuccess: () => {
			toast.success("Monitor removed");
			utils.statusPage.getById.invalidate({ id });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove monitor");
		},
	});

	const generateSlug = (value: string) => {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	};

	const handleSave = () => {
		if (!name.trim()) {
			toast.error("Please enter a name");
			return;
		}

		if (!slug.trim() || slug.length < 3) {
			toast.error("Slug must be at least 3 characters");
			return;
		}

		updateMutation.mutate({
			id,
			name: name.trim(),
			slug: slug.trim(),
			description: description.trim() || undefined,
			isPublic,
			showIncidentHistory,
			showUptimeGraph,
			daysToShow: parseInt(daysToShow, 10),
			logoUrl: logoUrl.trim() || "",
			faviconUrl: faviconUrl.trim() || "",
		});
	};

	const handleRemoveMonitor = (monitorId: string) => {
		removeMonitorMutation.mutate({
			statusPageId: id,
			monitorId,
		});
	};

	const overallStatus = statusPage.overallStatus as Status;
	const existingMonitorIds = statusPage.monitors.map((m) => m.monitorId);
	const publicUrl = statusPage.customDomain
		? `https://${statusPage.customDomain}`
		: `/status/${statusPage.slug}`;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button asChild className="mt-1" size="icon" variant="ghost">
						<Link href="/dashboard/status-pages">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight">
								{statusPage.name}
							</h1>
							<Badge variant={statusPage.isPublic ? "default" : "secondary"}>
								{statusPage.isPublic ? "Public" : "Private"}
							</Badge>
							<StatusDot status={overallStatus} />
						</div>
						<p className="mt-1 text-muted-foreground">/{statusPage.slug}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link href={publicUrl} rel="noopener noreferrer" target="_blank">
							<ExternalLink className="mr-2 size-4" />
							View Public Page
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="icon" variant="outline">
								<MoreHorizontal className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem asChild>
								<Link
									href={publicUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									<ExternalLink className="mr-2 size-4" />
									View Public Page
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => setDeleteDialogOpen(true)}
							>
								<Trash2 className="mr-2 size-4" />
								Delete Status Page
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Settings Card */}
			<Card>
				<CardHeader>
					<CardTitle>Settings</CardTitle>
					<CardDescription>
						Configure your status page appearance and behavior
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Basic Info */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Acme Inc Status"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug *</Label>
							<Input
								id="slug"
								onChange={(e) => setSlug(generateSlug(e.target.value))}
								placeholder="e.g., acme-status"
								value={slug}
							/>
							<p className="text-muted-foreground text-xs">
								Available at /status/{slug || "..."}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							className="max-h-[100px] resize-none"
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder="A brief description of your status page..."
							rows={2}
							value={description}
						/>
					</div>

					{/* Display Settings */}
					<div className="space-y-4 rounded-lg border p-4">
						<h4 className="font-medium text-sm">Display Settings</h4>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="isPublic">Public</Label>
								<p className="text-muted-foreground text-xs">
									Make this status page visible to everyone
								</p>
							</div>
							<Switch
								checked={isPublic}
								id="isPublic"
								onCheckedChange={setIsPublic}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="showIncidentHistory">
									Show Incident History
								</Label>
								<p className="text-muted-foreground text-xs">
									Display recent incidents on the page
								</p>
							</div>
							<Switch
								checked={showIncidentHistory}
								id="showIncidentHistory"
								onCheckedChange={setShowIncidentHistory}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="showUptimeGraph">Show Uptime Graph</Label>
								<p className="text-muted-foreground text-xs">
									Display the uptime history visualization
								</p>
							</div>
							<Switch
								checked={showUptimeGraph}
								id="showUptimeGraph"
								onCheckedChange={setShowUptimeGraph}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="daysToShow">History Duration</Label>
							<Select onValueChange={setDaysToShow} value={daysToShow}>
								<SelectTrigger className="w-full sm:w-48" id="daysToShow">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DAYS_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Branding */}
					<div className="space-y-4 rounded-lg border p-4">
						<h4 className="font-medium text-sm">Branding (Optional)</h4>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="logoUrl">Logo URL</Label>
								<Input
									id="logoUrl"
									onChange={(e) => setLogoUrl(e.target.value)}
									placeholder="https://example.com/logo.png"
									type="url"
									value={logoUrl}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="faviconUrl">Favicon URL</Label>
								<Input
									id="faviconUrl"
									onChange={(e) => setFaviconUrl(e.target.value)}
									placeholder="https://example.com/favicon.ico"
									type="url"
									value={faviconUrl}
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end">
						<Button disabled={updateMutation.isPending} onClick={handleSave}>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Monitors Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Monitors</CardTitle>
						<CardDescription>
							Monitors displayed on this status page
						</CardDescription>
					</div>
					<Button
						onClick={() => setAddMonitorDialogOpen(true)}
						size="sm"
						variant="outline"
					>
						<Plus className="mr-2 size-4" />
						Add Monitor
					</Button>
				</CardHeader>
				<CardContent>
					{statusPage.monitors.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<Globe className="mx-auto mb-4 size-12 opacity-50" />
							<p className="mb-2 font-medium">No monitors added</p>
							<p className="text-sm">
								Add monitors to display their status on this page
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{statusPage.monitors.map((m) => (
								<div
									className="flex items-center justify-between rounded-lg border px-4 py-3"
									key={m.monitorId}
								>
									<div className="flex items-center gap-3">
										<StatusDot status={m.monitor.status as Status} />
										<div>
											<p className="font-medium">
												{m.displayName || m.monitor.name}
											</p>
											{m.displayName && (
												<p className="text-muted-foreground text-xs">
													{m.monitor.name}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="secondary">
											{formatUptime(m.monitor.uptimePercentage)}%
										</Badge>
										<Button
											disabled={removeMonitorMutation.isPending}
											onClick={() => handleRemoveMonitor(m.monitorId)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="text-destructive">Danger Zone</CardTitle>
					<CardDescription>
						Irreversible and destructive actions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Delete Status Page</p>
							<p className="text-muted-foreground text-sm">
								Permanently delete this status page and all associated data
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
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Status Page</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{statusPage.name}"? This action
							cannot be undone.
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

			{/* Add Monitor Dialog */}
			<AddMonitorDialog
				existingMonitorIds={existingMonitorIds}
				onOpenChange={setAddMonitorDialogOpen}
				open={addMonitorDialogOpen}
				statusPageId={id}
			/>
		</div>
	);
}
